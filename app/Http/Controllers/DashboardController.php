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
    public function index(Request $request)
    {
        $userId = $request->user()->id;
        
        // Basic counts - filter by user_id through clients
        $totalClients = Client::where('user_id', $userId)->count();
        $totalQuotations = Quotation::whereHas('client', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->count();
        $totalQuotationRequests = QuotationRequest::whereHas('client', function ($query) use ($userId) {
            $query->where('user_id', $userId);
        })->count();
        $pendingQuotations = Quotation::where('quotation_status', 'pending')
            ->whereHas('client', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })->count();
        $approvedQuotations = Quotation::where('quotation_status', 'approved')
            ->whereHas('client', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })->count();
        $rejectedQuotations = Quotation::where('quotation_status', 'rejected')
            ->whereHas('client', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })->count();

        // Quotations by status for pie chart
        $quotationsByStatus = [
            ['name' => 'Pending', 'value' => $pendingQuotations, 'fill' => 'hsl(var(--chart-4))'], // Amber/Yellow
            ['name' => 'Approved', 'value' => $approvedQuotations, 'fill' => 'hsl(var(--chart-3))'], // Green
            ['name' => 'Rejected', 'value' => $rejectedQuotations, 'fill' => 'hsl(var(--chart-5))'], // Red
        ];

        // Service types distribution - filter by user_id through clients
        $serviceTypesData = QuotationRequest::whereHas('client', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->select('service_type', DB::raw('count(*) as count'))
            ->groupBy('service_type')
            ->get()
            ->map(function ($item, $index) {
                return [
                    'name' => ucfirst(str_replace('_', ' ', $item->service_type)),
                    'value' => $item->count,
                    'fill' => 'hsl(var(--chart-' . (($index % 5) + 1) . '))',
                ];
            });

        // Monthly quotations trend (last 6 months) - filter by user_id through clients
        $monthlyData = [];
        for ($i = 5; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = Quotation::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->whereHas('client', function ($query) use ($userId) {
                    $query->where('user_id', $userId);
                })
                ->count();
            
            $monthlyData[] = [
                'month' => $date->format('M'),
                'quotations' => $count,
            ];
        }

        // Recent quotations - filter by user_id through clients
        $recentQuotations = Quotation::whereHas('client', function ($query) use ($userId) {
                $query->where('user_id', $userId);
            })
            ->with(['client', 'quotationRequest'])
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