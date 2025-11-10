<?php

namespace App\Http\Controllers;

use App\Models\Client;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClientController extends Controller
{

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $perPageRequest = $request->get('per_page', 10);
        $search = $request->get('search', '');
        $perPage = $perPageRequest;
        
        $query = Client::with(['quotationRequests', 'quotations']);
        
        // Apply search filter
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('company_name', 'like', '%' . $search . '%')
                    ->orWhere('supervisor_name', 'like', '%' . $search . '%')
                    ->orWhere('company_email', 'like', '%' . $search . '%')
                    ->orWhere('company_phone_number', 'like', '%' . $search . '%')
                    ->orWhere('company_city', 'like', '%' . $search . '%')
                    ->orWhere('company_address', 'like', '%' . $search . '%')
                    ->orWhere('company_registration_number', 'like', '%' . $search . '%');
            });
        }
        
        if ($perPageRequest == 'all') {
            $perPage = $query->count() ?: 1;
        }
        
        $clients = $query->orderBy('company_name', 'asc')->paginate($perPage);
        
        // Add query parameters to pagination links
        $clients->appends([
            'per_page' => $perPageRequest,
            'search' => $search
        ]);
        
        return Inertia::render('client/index', [
            'clients' => $clients,
            'per_page_request' => $perPageRequest,
            'search_request' => $search
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'supervisor_name' => 'required|string|max:255',
            'company_phone_number' => 'required|string|max:255',
            'company_email' => 'required|string|email|max:255',
            'company_name' => 'required|string|max:255',
            'company_address' => 'required|string|max:255',
            'company_city' => 'required|string|max:255',
            'company_registration_number' => 'required|string|max:255',
        ]);

        try {
            $data = $request->all();
            $data['user_id'] = $request->user()->id;
            $client = Client::create($data);
            return redirect()->back()->with('success', 'Client created successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to create client: ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show($id)
    {
        try {
            $client = Client::with(['quotationRequests', 'quotations'])->findOrFail($id);
            return response()->json($client);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 404);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, Client $client)
    {
        $request->validate([
            'supervisor_name' => 'required|string|max:255',
            'company_phone_number' => 'required|string|max:255',
            'company_email' => 'required|string|email|max:255',
            'company_name' => 'required|string|max:255',
            'company_address' => 'required|string|max:255',
            'company_city' => 'required|string|max:255',
            'company_registration_number' => 'required|string|max:255',
        ]);

        try {
            $client->update($request->all());
            return redirect()->back()->with('success', 'Client updated successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to update client: ' . $e->getMessage());
        }
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Client $client)
    {
        try {
            $client->delete();
            return redirect()->back()->with('success', 'Client deleted successfully');
        } catch (\Exception $e) {
            return redirect()->back()->with('error', 'Failed to delete client: ' . $e->getMessage());
        }
    }
}
