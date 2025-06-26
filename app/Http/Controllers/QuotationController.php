<?php

namespace App\Http\Controllers;

use App\Models\Quotation;
use App\Models\Client;
use App\Models\QuotationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use App\Http\Controllers\GeminiController;

class QuotationController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $per_page = $request->input('per_page', 10);
        
        if ($per_page === 'all') {
            $quotations = Quotation::with(['client', 'quotationRequest'])
                ->orderBy('created_at', 'desc')
                ->get();
            
            $paginatedQuotations = (object) [
                'data' => $quotations,
                'current_page' => 1,
                'last_page' => 1,
                'per_page' => $quotations->count(),
                'total' => $quotations->count(),
                'from' => $quotations->count() > 0 ? 1 : null,
                'to' => $quotations->count(),
                'links' => [
                    ['url' => null, 'label' => '« Previous', 'active' => false],
                    ['url' => null, 'label' => '1', 'active' => true],
                    ['url' => null, 'label' => 'Next »', 'active' => false]
                ]
            ];
        } else {
            $paginatedQuotations = Quotation::with(['client', 'quotationRequest'])
                ->orderBy('created_at', 'desc')
                ->paginate((int) $per_page);
        }

        $clients = Client::orderBy('company_name')->get();
        $quotationRequests = QuotationRequest::orderBy('service_type')->get();

        return Inertia::render('quotation/index', [
            'quotations' => $paginatedQuotations,
            'per_page_request' => $per_page,
            'clients' => $clients,
            'quotation_requests' => $quotationRequests,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $clients = Client::orderBy('company_name')->get();
        $quotationRequests = QuotationRequest::orderBy('service_type')->get();
        
        return Inertia::render('quotation/create', [
            'clients' => $clients,
            'quotation_requests' => $quotationRequests,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'quotation_request_id' => 'required|exists:quotation_requests,id',
            'quotation_message' => 'required|string',
            'quotation_status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
        ]);

        Quotation::create($validated);

        return redirect()->route('manage-quotation')->with('success', 'Quotation created successfully.');
    }

    /**
     * Generate AI quotation based on user inputs
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'client_id' => 'required|exists:clients,id',
            'service_type' => ['required', Rule::in(['web_development', 'mobile_development', 'desktop_development', 'ai_development', 'graphic_design', 'digital_marketing', 'other'])],
            'problem' => 'required|string|max:1000',
            'solution' => 'required|string|max:1000',
        ]);

        try {
            $geminiController = new GeminiController();
            
            // Create AI prompt from user inputs
            $prompt = $geminiController->createPrompt($validated);
            
            // Save quotation request with the prompt
            $quotationRequest = QuotationRequest::create([
                'client_id' => $validated['client_id'],
                'service_type' => $validated['service_type'],
                'request_message' => json_encode([
                    'problem' => $validated['problem'],
                    'solution' => $validated['solution'],
                    'ai_prompt' => $prompt
                ])
            ]);

            // Call Google Gemini API
            $aiResponse = $geminiController->callGeminiAPI($prompt);

            // Save quotation with AI response
            $quotation = Quotation::create([
                'client_id' => $validated['client_id'],
                'quotation_request_id' => $quotationRequest->id,
                'quotation_message' => $aiResponse,
                'quotation_status' => 'pending'
            ]);

            return redirect()->route('manage-quotation')->with('success', 'AI-powered quotation generated successfully!');

        } catch (\Exception $e) {
            return back()->withErrors(['error' => 'Failed to generate quotation: ' . $e->getMessage()]);
        }
    }



    /**
     * Display the specified resource.
     */
    public function show(Quotation $quotation)
    {
        $quotation->load(['client', 'quotationRequest']);
        
        return Inertia::render('quotation/view', [
            'quotation' => $quotation,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(Quotation $quotation)
    {
        $quotation->load(['client', 'quotationRequest']);
        $clients = Client::orderBy('company_name')->get();
        $quotationRequests = QuotationRequest::orderBy('service_type')->get();
        
        return Inertia::render('quotation/edit', [
            'quotation' => $quotation,
            'clients' => $clients,
            'quotation_requests' => $quotationRequests,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Quotation $quotation)
    {
        // Handle different update scenarios
        if ($request->has('quotation_status') && count($request->all()) === 1) {
            // Quick status update from view page
            $validated = $request->validate([
                'quotation_status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
            ]);

            $quotation->update($validated);

            return redirect()->back()->with('success', 'Quotation status updated successfully.');
        } else {
            // Full form update from edit page
            $validated = $request->validate([
                'client_id' => 'required|exists:clients,id',
                'service_type' => ['required', Rule::in(['web_development', 'mobile_development', 'desktop_development', 'ai_development', 'graphic_design', 'digital_marketing', 'other'])],
                'problem' => 'nullable|string|max:1000',
                'solution' => 'nullable|string|max:1000',
                'quotation_message' => 'required|string',
                'quotation_status' => ['required', Rule::in(['pending', 'approved', 'rejected'])],
            ]);

            // Update quotation
            $quotation->update([
                'client_id' => $validated['client_id'],
                'quotation_message' => $validated['quotation_message'],
                'quotation_status' => $validated['quotation_status'],
            ]);

            // Update quotation request if it exists
            if ($quotation->quotationRequest) {
                $quotation->quotationRequest->update(['service_type' => $validated['service_type']]);
                $quotation->quotationRequest->updateRequestFields($validated['problem'],$validated['solution']
                );
            }

            return redirect()->route('manage-quotation')->with('success', 'Quotation updated successfully.');
        }
    }

    /**
     * Generate PDF for the quotation
     */
    public function generatePdf(Quotation $quotation)
    {
        $quotation->load(['client', 'quotationRequest']);
        
        return view('quotation-pdf', compact('quotation'));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Quotation $quotation)
    {
        $quotation->delete();

        return redirect()->route('manage-quotation')->with('success', 'Quotation deleted successfully.');
    }
}
