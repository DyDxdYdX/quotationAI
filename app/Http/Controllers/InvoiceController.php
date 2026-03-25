<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Quotation;
use App\Services\QuotationMilestoneBillingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class InvoiceController extends Controller
{
    public function __construct(public QuotationMilestoneBillingService $quotationMilestoneBillingService) {}

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $per_page = $request->input('per_page', 10);
        $search = $request->input('search', '');
        $userId = $request->user()->id;

        $query = Invoice::with(['client', 'quotation'])
            ->whereHas('client', function ($clientQuery) use ($userId) {
                $clientQuery->where('user_id', $userId);
            });

        // Apply search filter
        if (! empty($search)) {
            $query->where(function ($q) use ($search, $userId) {
                // Search by invoice ID
                $q->where('id', 'like', '%'.$search.'%')
                    // Search by client company name
                    ->orWhereHas('client', function ($clientQuery) use ($search, $userId) {
                        $clientQuery->where('user_id', $userId)
                            ->where('company_name', 'like', '%'.$search.'%');
                    })
                    // Search by status
                    ->orWhere('status', 'like', '%'.$search.'%');
            });
        }

        if ($per_page === 'all') {
            $invoices = $query->orderBy('created_at', 'desc')->get();
            // Manual pagination structure for 'all'
            $paginatedInvoices = (object) [
                'data' => $invoices,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $invoices->count() ?: 1,
                'total' => $invoices->count(),
                'from' => $invoices->count() > 0 ? 1 : null,
                'to' => $invoices->count(),
                'links' => [],
            ];
        } else {
            $paginatedInvoices = $query->orderBy('created_at', 'desc')->paginate((int) $per_page);
            $paginatedInvoices->appends([
                'per_page' => $per_page,
                'search' => $search,
            ]);
        }

        return Inertia::render('invoice/index', [
            'invoices' => $paginatedInvoices,
            'per_page_request' => $per_page,
            'search_request' => $search,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    /**
     * Convert a quotation to a draft invoice.
     */
    public function convert(Request $request, Quotation $quotation)
    {
        $userId = $request->user()->id;

        // Verify ownership
        if ($quotation->client->user_id !== $userId) {
            abort(403);
        }

        $validated = $request->validate([
            'phase_key' => ['required', 'string'],
        ]);

        $billablePhases = $this->quotationMilestoneBillingService->extractBillablePhases($quotation);
        if (empty($billablePhases)) {
            return back()->withErrors([
                'phase_key' => 'No billable milestones were found for this quotation.',
            ]);
        }

        $selectedPhase = collect($billablePhases)
            ->firstWhere('phase_key', $validated['phase_key']);

        if (! $selectedPhase) {
            return back()->withErrors([
                'phase_key' => 'The selected milestone phase is invalid.',
            ]);
        }

        // Block duplicate billing for the same quotation phase
        $existingPhaseInvoice = Invoice::where('quotation_id', $quotation->id)
            ->where('phase_key', $selectedPhase['phase_key'])
            ->first();

        if ($existingPhaseInvoice) {
            return redirect()
                ->route('invoices.show', $existingPhaseInvoice)
                ->with('message', 'An invoice for this phase already exists.');
        }

        // Generate Invoice Number
        $invoiceNumber = $this->generateInvoiceNumber($quotation->client->user_id);

        // Create Invoice
        $invoice = Invoice::create([
            'client_id' => $quotation->client_id,
            'quotation_id' => $quotation->id,
            'phase_key' => $selectedPhase['phase_key'],
            'phase_name' => $selectedPhase['phase_name'],
            'phase_description' => $selectedPhase['phase_description'],
            'phase_percentage' => $selectedPhase['phase_percentage'],
            'invoice_number' => $invoiceNumber,
            'invoice_date' => now(),
            'due_date' => now()->addDays(14), // Default Net 14
            'status' => 'pending', // Draft/Pending
            'currency' => $selectedPhase['currency'],
            'total_amount' => $selectedPhase['amount'],
            'notes' => 'Converted from Quotation #'.$quotation->id.' ('.$selectedPhase['phase_name'].')',
        ]);

        InvoiceItem::create([
            'invoice_id' => $invoice->id,
            'description' => $selectedPhase['phase_name'].': '.$selectedPhase['phase_description'],
            'quantity' => 1,
            'unit_price' => $selectedPhase['amount'],
            'amount' => $selectedPhase['amount'],
        ]);

        return redirect()->route('invoices.show', $invoice)->with('success', 'Quotation converted to draft invoice.');
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $userId = $request->user()->id;
        $clients = Client::where('user_id', $userId)->orderBy('company_name')->get();

        // Manual creation, empty form
        $prefilledItems = [[
            'description' => '',
            'quantity' => 1,
            'unit_price' => 0,
            'amount' => 0,
        ]];

        return Inertia::render('invoice/create', [
            'clients' => $clients,
            'prefilled_data' => [],
            'prefilled_items' => $prefilledItems,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $userId = $request->user()->id;

        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'quotation_id' => 'nullable|exists:quotations,id',
            'invoice_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:invoice_date',
            'status' => ['required', Rule::in(['pending', 'paid', 'void'])],
            'currency' => 'required|string|max:3',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        // Verify the client belongs to the current user
        $client = Client::where('id', $validated['client_id'])
            ->where('user_id', $userId)
            ->firstOrFail();

        // Calculate total
        $totalAmount = 0;
        foreach ($validated['items'] as $item) {
            $totalAmount += $item['quantity'] * $item['unit_price'];
        }

        // Generate Invoice Number
        $invoiceNumber = $this->generateInvoiceNumber($userId);

        $invoice = Invoice::create([
            'client_id' => $validated['client_id'],
            'quotation_id' => $validated['quotation_id'] ?? null,
            'invoice_number' => $invoiceNumber,
            'invoice_date' => $validated['invoice_date'],
            'due_date' => $validated['due_date'],
            'status' => $validated['status'],
            'currency' => $validated['currency'],
            'total_amount' => $totalAmount,
            'notes' => $validated['notes'] ?? null,
        ]);

        foreach ($validated['items'] as $item) {
            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'amount' => $item['quantity'] * $item['unit_price'],
            ]);
        }

        return redirect()->route('invoices.show', $invoice)->with('success', 'Invoice created successfully.');
    }

    /**
     * Display the specified resource.
     */
    public function show(Request $request, Invoice $invoice)
    {
        $userId = $request->user()->id;

        $invoice->load(['client', 'quotation', 'items']);

        if ($invoice->client->user_id !== $userId) {
            abort(403);
        }

        return Inertia::render('invoice/view', [
            'invoice' => $invoice,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Request $request, Invoice $invoice)
    {
        $userId = $request->user()->id;

        $invoice->load(['client', 'items']);

        // Verify ownership
        if ($invoice->client->user_id !== $userId) {
            abort(403);
        }

        $clients = Client::where('user_id', $userId)->orderBy('company_name')->get();

        return Inertia::render('invoice/edit', [
            'invoice' => $invoice,
            'clients' => $clients,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Invoice $invoice)
    {
        $userId = $request->user()->id;

        $invoice->load('client');
        if ($invoice->client->user_id !== $userId) {
            abort(403);
        }

        // Handle simple status update from index/view (if just status is sent)
        if ($request->has('status') && count($request->all()) === 1) {
            $validated = $request->validate([
                'status' => ['required', Rule::in(['pending', 'paid', 'void'])],
            ]);

            $invoice->update(['status' => $validated['status']]);

            return back()->with('success', 'Invoice status updated.');
        }

        // Full update
        $validated = $request->validate([
            'client_id' => ['required', 'exists:clients,id'],
            'invoice_date' => 'required|date',
            'due_date' => 'required|date', // Removed after_or_equal:invoice_date to allow flexibility during edits
            'status' => ['required', Rule::in(['pending', 'paid', 'void'])],
            'currency' => 'required|string|max:3',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.description' => 'required|string',
            'items.*.quantity' => 'required|integer|min:1',
            'items.*.unit_price' => 'required|numeric|min:0',
        ]);

        // Verify the new client (if changed) belongs to the user
        $client = Client::where('id', $validated['client_id'])
            ->where('user_id', $userId)
            ->firstOrFail();

        // Calculate total
        $totalAmount = 0;
        foreach ($validated['items'] as $item) {
            $totalAmount += $item['quantity'] * $item['unit_price'];
        }

        // Update Invoice
        $invoice->update([
            'client_id' => $validated['client_id'],
            'invoice_date' => $validated['invoice_date'],
            'due_date' => $validated['due_date'],
            'status' => $validated['status'],
            'currency' => $validated['currency'],
            'total_amount' => $totalAmount,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Sync Items: Delete existing and recreate
        $invoice->items()->delete();

        foreach ($validated['items'] as $item) {
            InvoiceItem::create([
                'invoice_id' => $invoice->id,
                'description' => $item['description'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'amount' => $item['quantity'] * $item['unit_price'],
            ]);
        }

        return redirect()->route('invoices.show', $invoice)->with('success', 'Invoice updated successfully.');
    }

    /**
     * Generate PDF
     */
    public function generatePdf(Request $request, Invoice $invoice)
    {
        $userId = $request->user()->id;

        $invoice->load('client');
        if ($invoice->client->user_id !== $userId) {
            abort(403);
        }

        $invoice->load(['client.user', 'items', 'quotation']);

        // Get company information from the user who owns the client
        $user = null;
        if ($invoice->client && $invoice->client->user) {
            $user = $invoice->client->user;
        } else {
            $user = Auth::user();
        }

        // Get company profile with fallback defaults
        $companyProfile = [
            'company_name' => ($user && isset($user->company_name)) ? $user->company_name : 'Your Company Name',
            'company_phone' => ($user && isset($user->company_phone)) ? $user->company_phone : (($user && isset($user->phone_number)) ? $user->phone_number : ''),
            'company_email' => ($user && isset($user->company_email)) ? $user->company_email : (($user && isset($user->email)) ? $user->email : ''),
            'company_website' => ($user && isset($user->company_website)) ? $user->company_website : '',
            'company_address' => ($user && isset($user->company_address)) ? $user->company_address : '',
        ];

        // Generate PDF from blade view
        $pdf = Pdf::loadView('invoice-pdf', compact('invoice', 'companyProfile'));

        // Set PDF options
        $pdf->setPaper('A4', 'portrait');
        $pdf->setOption('enable-local-file-access', true);

        // Generate filename
        $invoiceNumber = 'INV-'.$invoice->invoice_number;
        $filename = "Invoice_{$invoiceNumber}.pdf";

        // Return PDF as download
        return $pdf->download($filename);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Request $request, Invoice $invoice)
    {
        $userId = $request->user()->id;
        $invoice->load('client');
        if ($invoice->client->user_id !== $userId) {
            abort(403);
        }

        $invoice->delete();

        return redirect()->route('invoices.index')->with('success', 'Invoice deleted.');
    }

    protected function generateInvoiceNumber(int $userId): string
    {
        $latestInvoice = Invoice::whereHas('client', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->latest()->first();

        $nextNumber = $latestInvoice ? intval($latestInvoice->invoice_number) + 1 : 1;

        return str_pad($nextNumber, 6, '0', STR_PAD_LEFT);
    }
}
