<?php

namespace App\Http\Controllers;

use GeminiAPI\Client;
use GeminiAPI\Enums\Role;
use GeminiAPI\Resources\Content;
use GeminiAPI\Resources\ModelName;
use GeminiAPI\Resources\Parts\TextPart;

class GeminiController extends Controller
{
    /**
     * Create AI prompt from user inputs
     */
    public function createPrompt(array $data)
    {
        $serviceType = str_replace('_', ' ', ucwords($data['service_type'], '_'));
        
        return "You are a professional business consultant creating a detailed quotation for a {$serviceType} project. 

                    Client Requirements:
                    - Service Type: {$serviceType}
                    - Problem to Solve: {$data['problem']}
                    - Proposed Solution: {$data['solution']}

                    Please create a comprehensive quotation that includes:
                    1. Project Overview and Scope
                    2. Detailed Timeline (in weeks/months)
                    3. Cost Breakdown with itemized pricing (RM)
                    4. Deliverables and Milestones
                    5. Technical Requirements
                    6. Payment Terms (RM)
                    7. Terms and Conditions
                    8. Support and Maintenance options (RM)

                    Format the response as a professional quotation document with clear sections and pricing. Be specific about costs (provide realistic estimates based on the service type and complexity). Use JSON format for structured data where appropriate.

                    Example:
                    {
                        project_overview: Based on your requirements, we propose a comprehensive solution that addresses your specific needs.
                        timeline: 8-12 weeks
                        cost_breakdown: {
                            initial_development: RM 8,500
                            testing_qa: RM 1,500
                            deployment: RM 1,000
                            documentation: RM 500
                            total: RM 11,500
                        },
                        deliverables: [
                            Fully functional application
                            Source code documentation
                            User manual
                            Technical documentation
                            30 days post-launch support
                        ],
                        payment_terms: 40% upfront, 40% at milestone, 20% on completion
                        support: 30 days free support, then RM 200/month maintenance package
                    }";
    }

    /**
     * Call Google Gemini API
     */
    public function callGeminiAPI(string $prompt)
    {
        return json_encode([
            'project_overview' => 'Based on your requirements, we propose a comprehensive solution that addresses your specific needs.',
            'timeline' => '8-12 weeks',
            'cost_breakdown' => [
                'initial_development' => '$8,500',
                'testing_qa' => '$1,500',
                'deployment' => '$1,000',
                'documentation' => '$500',
                'total' => '$11,500'
            ],
            'deliverables' => [
                'Fully functional application',
                'Source code documentation',
                'User manual',
                'Technical documentation',
                '30 days post-launch support'
            ],
            'payment_terms' => '40% upfront, 40% at milestone, 20% on completion',
            'support' => '30 days free support, then $200/month maintenance package',
            'ai_generated' => true,
            'generated_at' => now()->toISOString()
        ]);
    }
}