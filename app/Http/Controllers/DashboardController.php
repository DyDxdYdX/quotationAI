<?php

namespace App\Http\Controllers;

use App\Models\Client;
use App\Models\Quotation;
use App\Models\QuotationRequest;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Basic counts
        $totalClients = Client::count();
        $totalQuotations = Quotation::count();
        $totalQuotationRequests = QuotationRequest::count();
        $pendingQuotations = Quotation::where('quotation_status', 'pending')->count();
        $approvedQuotations = Quotation::where('quotation_status', 'approved')->count();
        $rejectedQuotations = Quotation::where('quotation_status', 'rejected')->count();

        // Quotations by status for pie chart
        $quotationsByStatus = [
            ['name' => 'Pending', 'value' => $pendingQuotations, 'fill' => 'hsl(var(--chart-1))'],
            ['name' => 'Approved', 'value' => $approvedQuotations, 'fill' => 'hsl(var(--chart-2))'],
            ['name' => 'Rejected', 'value' => $rejectedQuotations, 'fill' => 'hsl(var(--chart-3))'],
        ];

        // Service types distribution
        $serviceTypesData = QuotationRequest::select('service_type', DB::raw('count(*) as count'))
            ->groupBy('service_type')
            ->get()
            ->map(function ($item, $index) {
                return [
                    'name' => ucfirst(str_replace('_', ' ', $item->service_type)),
                    'value' => $item->count,
                    'fill' => 'hsl(var(--chart-' . (($index % 5) + 1) . '))',
                ];
            });

        // Monthly quotations trend (last 6 months)
        $monthlyData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = Quotation::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();
            
            $monthlyData[] = [
                'month' => $date->format('M'),
                'quotations' => $count,
            ];
        }

        // Recent quotations
        $recentQuotations = Quotation::with(['client', 'quotationRequest'])
            ->orderBy('created_at', 'desc')
            ->limit(5)
            ->get();

        return Inertia::render('dashboard', [
            'analytics' => [
                'totalClients' => $totalClients,
                'totalQuotations' => $totalQuotations,
                'totalQuotationRequests' => $totalQuotationRequests,
                'pendingQuotations' => $pendingQuotations,
                'approvedQuotations' => $approvedQuotations,
                'rejectedQuotations' => $rejectedQuotations,
            ],
            'chartData' => [
                'quotationsByStatus' => $quotationsByStatus,
                'serviceTypesData' => $serviceTypesData,
                'monthlyData' => $monthlyData,
            ],
            'recentQuotations' => $recentQuotations,
        ]);
    }
} 