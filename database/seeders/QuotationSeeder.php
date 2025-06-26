<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Client;
use App\Models\QuotationRequest;
use App\Models\Quotation;

class QuotationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create sample clients
        $clients = [
            [
                'supervisor_name' => 'John Smith',
                'company_phone_number' => '+1-555-0101',
                'company_email' => 'john@techcorp.com',
                'company_name' => 'TechCorp Solutions',
                'company_address' => '123 Tech Street',
                'company_city' => 'San Francisco',
            ],
            [
                'supervisor_name' => 'Sarah Johnson',
                'company_phone_number' => '+1-555-0102',
                'company_email' => 'sarah@digitalworks.com',
                'company_name' => 'Digital Works Inc',
                'company_address' => '456 Digital Ave',
                'company_city' => 'New York',
            ],
            [
                'supervisor_name' => 'Mike Wilson',
                'company_phone_number' => '+1-555-0103',
                'company_email' => 'mike@innovate.com',
                'company_name' => 'Innovate Systems',
                'company_address' => '789 Innovation Blvd',
                'company_city' => 'Austin',
            ],
        ];

        foreach ($clients as $clientData) {
            Client::create($clientData);
        }

        // Create sample quotation requests
        $quotationRequests = [
            [
                'client_id' => 1,
                'service_type' => 'web_development',
                'request_message' => json_encode([
                    'description' => 'Need a modern e-commerce website with payment integration',
                    'budget' => '$10,000 - $15,000',
                    'timeline' => '3 months'
                ]),
            ],
            [
                'client_id' => 2,
                'service_type' => 'mobile_development',
                'request_message' => json_encode([
                    'description' => 'iOS and Android app for food delivery service',
                    'budget' => '$25,000 - $35,000',
                    'timeline' => '6 months'
                ]),
            ],
            [
                'client_id' => 3,
                'service_type' => 'graphic_design',
                'request_message' => json_encode([
                    'description' => 'Complete redesign of existing web application',
                    'budget' => '$5,000 - $8,000',
                    'timeline' => '2 months'
                ]),
            ],
            [
                'client_id' => 1,
                'service_type' => 'digital_marketing',
                'request_message' => json_encode([
                    'description' => 'Improve search engine rankings for company website',
                    'budget' => '$2,000 - $3,000',
                    'timeline' => '1 month'
                ]),
            ],
            [
                'client_id' => 2,
                'service_type' => 'ai_development',
                'request_message' => json_encode([
                    'description' => 'Migrate on-premise infrastructure to AWS',
                    'budget' => '$15,000 - $20,000',
                    'timeline' => '4 months'
                ]),
            ],
        ];

        foreach ($quotationRequests as $requestData) {
            QuotationRequest::create($requestData);
        }

        // Create sample quotations
        $quotations = [
            [
                'client_id' => 1,
                'quotation_request_id' => 1,
                'quotation_message' => json_encode([
                    'project_cost' => '$12,500',
                    'timeline' => '10-12 weeks',
                    'deliverables' => [
                        'Responsive e-commerce website',
                        'Payment gateway integration',
                        'Admin dashboard',
                        'User authentication system',
                        '3 months support'
                    ],
                    'terms' => '50% upfront, 50% on completion'
                ]),
                'quotation_status' => 'pending',
            ],
            [
                'client_id' => 2,
                'quotation_request_id' => 2,
                'quotation_message' => json_encode([
                    'project_cost' => '$28,000',
                    'timeline' => '20-24 weeks',
                    'deliverables' => [
                        'Native iOS app',
                        'Native Android app',
                        'Backend API',
                        'Admin panel',
                        'Payment integration',
                        '6 months support'
                    ],
                    'terms' => '30% upfront, 40% at milestone, 30% on completion'
                ]),
                'quotation_status' => 'approved',
            ],
            [
                'client_id' => 3,
                'quotation_request_id' => 3,
                'quotation_message' => json_encode([
                    'project_cost' => '$6,800',
                    'timeline' => '6-8 weeks',
                    'deliverables' => [
                        'UX research and analysis',
                        'Wireframes and prototypes',
                        'High-fidelity designs',
                        'Design system documentation',
                        '2 revision rounds'
                    ],
                    'terms' => '50% upfront, 50% on completion'
                ]),
                'quotation_status' => 'rejected',
            ],
            [
                'client_id' => 1,
                'quotation_request_id' => 4,
                'quotation_message' => json_encode([
                    'project_cost' => '$2,500',
                    'timeline' => '4 weeks',
                    'deliverables' => [
                        'SEO audit report',
                        'Keyword optimization',
                        'Content optimization',
                        'Technical SEO fixes',
                        'Monthly reports'
                    ],
                    'terms' => '100% upfront'
                ]),
                'quotation_status' => 'pending',
            ],
            [
                'client_id' => 2,
                'quotation_request_id' => 5,
                'quotation_message' => json_encode([
                    'project_cost' => '$18,500',
                    'timeline' => '14-16 weeks',
                    'deliverables' => [
                        'Infrastructure assessment',
                        'Migration strategy',
                        'AWS setup and configuration',
                        'Data migration',
                        'Performance optimization',
                        '3 months support'
                    ],
                    'terms' => '25% upfront, 50% at milestone, 25% on completion'
                ]),
                'quotation_status' => 'approved',
            ],
        ];

        foreach ($quotations as $quotationData) {
            Quotation::create($quotationData);
        }
    }
}
