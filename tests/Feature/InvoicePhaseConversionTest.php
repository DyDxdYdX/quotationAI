<?php

use App\Models\Client;
use App\Models\Invoice;
use App\Models\InvoiceItem;
use App\Models\Quotation;
use App\Models\QuotationRequest;
use App\Models\User;

function createMilestoneQuotation(User $user): Quotation
{
    $client = Client::factory()->create([
        'user_id' => $user->id,
    ]);

    $quotationRequest = QuotationRequest::create([
        'client_id' => $client->id,
        'request_message' => [
            'problem' => 'Need phased rollout',
            'solution' => 'Build with milestone payments',
        ],
        'service_type' => 'web_development',
    ]);

    $quotationMessage = [
        'quotation' => [
            'currency' => 'RM',
            'sections' => [
                [
                    'id' => 'cost_breakdown',
                    'data' => [
                        'discovery_and_planning' => [
                            'description' => 'Discovery and planning',
                            'cost' => 4000,
                        ],
                        'development' => [
                            'description' => 'Core development',
                            'cost' => 6000,
                        ],
                    ],
                ],
                [
                    'id' => 'milestones',
                    'headers' => ['Milestone Name', 'Description', 'Percentage'],
                    'rows' => [
                        ['Discovery Completion', 'Planning signed off', '40%'],
                        ['Core Development', 'Core modules delivered', '60%'],
                    ],
                ],
            ],
        ],
    ];

    return Quotation::create([
        'client_id' => $client->id,
        'quotation_request_id' => $quotationRequest->id,
        'quotation_number' => '000001',
        'quotation_message' => json_encode($quotationMessage),
        'quotation_status' => 'approved',
    ]);
}

test('one quotation can generate multiple invoices for different phases', function () {
    $user = User::factory()->create();
    $quotation = createMilestoneQuotation($user);

    $this->actingAs($user)
        ->post(route('quotation.convert', $quotation), [
            'phase_key' => 'discovery-completion',
        ])
        ->assertRedirect();

    $this->actingAs($user)
        ->post(route('quotation.convert', $quotation), [
            'phase_key' => 'core-development',
        ])
        ->assertRedirect();

    $invoices = Invoice::where('quotation_id', $quotation->id)
        ->orderBy('phase_key')
        ->get();

    expect($invoices)->toHaveCount(2);
    expect($invoices->pluck('phase_key')->all())->toBe([
        'core-development',
        'discovery-completion',
    ]);

    $discoveryInvoice = $invoices->firstWhere('phase_key', 'discovery-completion');
    $developmentInvoice = $invoices->firstWhere('phase_key', 'core-development');

    expect((float) $discoveryInvoice->total_amount)->toBe(4000.00);
    expect((float) $developmentInvoice->total_amount)->toBe(6000.00);

    expect(InvoiceItem::where('invoice_id', $discoveryInvoice->id)->count())->toBe(1);
    expect(InvoiceItem::where('invoice_id', $developmentInvoice->id)->count())->toBe(1);
});

test('duplicate phase invoice for the same quotation is blocked', function () {
    $user = User::factory()->create();
    $quotation = createMilestoneQuotation($user);

    $firstResponse = $this->actingAs($user)
        ->post(route('quotation.convert', $quotation), [
            'phase_key' => 'discovery-completion',
        ]);

    $firstResponse->assertRedirect();

    $duplicateResponse = $this->actingAs($user)
        ->post(route('quotation.convert', $quotation), [
            'phase_key' => 'discovery-completion',
        ]);

    $duplicateResponse->assertRedirect();
    $duplicateResponse->assertSessionHas('message', 'An invoice for this phase already exists.');

    expect(Invoice::where('quotation_id', $quotation->id)->where('phase_key', 'discovery-completion')->count())->toBe(1);
});

test('conversion fails when quotation has no billable milestones', function () {
    $user = User::factory()->create();
    $client = Client::factory()->create(['user_id' => $user->id]);
    $quotationRequest = QuotationRequest::create([
        'client_id' => $client->id,
        'request_message' => [
            'problem' => 'No milestone breakdown',
            'solution' => 'No milestone table',
        ],
        'service_type' => 'web_development',
    ]);

    $quotation = Quotation::create([
        'client_id' => $client->id,
        'quotation_request_id' => $quotationRequest->id,
        'quotation_number' => '000001',
        'quotation_message' => json_encode([
            'quotation' => [
                'currency' => 'RM',
                'sections' => [
                    [
                        'id' => 'cost_breakdown',
                        'data' => [
                            'development' => [
                                'description' => 'Development cost',
                                'cost' => 10000,
                            ],
                        ],
                    ],
                ],
            ],
        ]),
        'quotation_status' => 'approved',
    ]);

    $response = $this->actingAs($user)
        ->from(route('quotation.show', $quotation))
        ->post(route('quotation.convert', $quotation), [
            'phase_key' => 'anything',
        ]);

    $response->assertRedirect(route('quotation.show', $quotation));
    $response->assertSessionHasErrors('phase_key');

    expect(Invoice::where('quotation_id', $quotation->id)->count())->toBe(0);
});
