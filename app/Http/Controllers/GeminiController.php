<?php

namespace App\Http\Controllers;

use GeminiAPI\Client;
use GeminiAPI\Enums\Role;
use GeminiAPI\Resources\Content;
use GeminiAPI\Resources\ModelName;
use GeminiAPI\Resources\Parts\TextPart;
use Exception;
use Illuminate\Support\Facades\Log;

class GeminiController extends Controller
{
    /**
     * Create AI prompt from user inputs
     * 
     * AI should generate:
     * - Descriptive content (project overview, scope descriptions, summaries)
     * - Item descriptions and service breakdowns
     * - Suggested pricing ranges (but NOT final totals - system will calculate)
     * - Timeline estimates and milestones descriptions
     * - Technical requirements descriptions
     * - Support options descriptions
     * 
     * AI should NOT generate:
     * - Final quotation numbers, totals, or tax calculations (system will handle)
     * - Approval/signature sections (system templates)
     * - Document metadata (IDs, dates, codes - system will add)
     * - Legal terms & conditions (system will use pre-approved templates)
     */
    public function createPrompt(array $data)
    {
        $serviceType = str_replace('_', ' ', ucwords($data['service_type'], '_'));
        
        // Handle project dates
        $startDate = !empty($data['start_date']) ? date('F j, Y', strtotime($data['start_date'])) : null;
        $endDate = !empty($data['end_date']) ? date('F j, Y', strtotime($data['end_date'])) : null;
        $hasEndDate = !empty($endDate);
        $hasStartDate = !empty($startDate);
        
        $dateContext = '';
        if ($hasStartDate) {
            $dateContext = "PROJECT TIMELINE:\n";
            $dateContext .= "- Project Start Date: {$startDate}\n";
            if ($hasEndDate) {
                $dateContext .= "- Project End Date: {$endDate}\n";
                // Calculate duration
                $start = new \DateTime($data['start_date']);
                $end = new \DateTime($data['end_date']);
                $diff = $start->diff($end);
                $weeks = ceil($diff->days / 7);
                $months = $diff->m + ($diff->y * 12);
                if ($months > 0) {
                    $dateContext .= "- Project Duration: Approximately {$months} month(s) (" . ($weeks) . " weeks)\n";
                } else {
                    $dateContext .= "- Project Duration: Approximately {$weeks} week(s)\n";
                }
            } else {
                $dateContext .= "- Project End Date: NOT SPECIFIED - You must suggest an appropriate project duration based on the scope and requirements.\n";
                $dateContext .= "  IMPORTANT: Since no end date is provided, you MUST include a suggested duration estimate in your timeline section.\n";
                $dateContext .= "  Calculate the duration based on:\n";
                $dateContext .= "  - The complexity of the problem\n";
                $dateContext .= "  - The scope of the solution\n";
                $dateContext .= "  - Industry standards for {$serviceType} projects\n";
                $dateContext .= "  - Include this duration estimate in the timeline table with specific phase durations\n";
            }
        }
        
        return "You are a professional business consultant helping to create a quotation draft for a {$serviceType} project.

{$dateContext}

IMPORTANT RULES - WHAT YOU SHOULD GENERATE:

✅ YOU SHOULD GENERATE:
1. **Project Overview & Scope** - Write descriptive text explaining the project scope, objectives, and approach.
2. **Item Descriptions** - Create detailed descriptions for each service/item that will be included in the quotation.
3. **Suggested Pricing** - Suggest INDIVIDUAL item prices (as numbers, not final totals). The system will calculate totals, taxes, and final amounts.
4. **Timeline Descriptions** - Describe project phases, duration estimates, and milestone descriptions.
5. **Technical Requirements** - Describe technical specifications, platforms, technologies needed.
6. **Deliverables Descriptions** - List and describe what will be delivered.
7. **Support Options** - Describe support and maintenance options available.

❌ YOU SHOULD NOT GENERATE:
- Final quotation totals or tax calculations (system handles this)
- Quotation numbers, IDs, or document metadata (system adds these)
- Legal terms & conditions (system uses pre-approved templates)
- Approval/signature sections (system templates)
- Payment schedule percentages (system calculates based on milestones)

CLIENT REQUIREMENTS:
- Service Type: {$serviceType}
- Problem to Solve: {$data['problem']}
- Proposed Solution: {$data['solution']}" . ($hasStartDate ? "\n- Project Start Date: {$startDate}" . ($hasEndDate ? "\n- Project End Date: {$endDate}" : "\n- Project End Date: TO BE DETERMINED (you must suggest appropriate duration)") : '') . "

RESPONSE FORMAT:
You MUST respond with ONLY valid JSON (no markdown code blocks, no explanations, just pure JSON). The JSON structure must be:

{
  \"quotation\": {
    \"title\": \"[Project Title]\",
    \"currency\": \"RM\",
    \"sections\": [
      {
        \"id\": \"overview\",
        \"title\": \"1. Project Overview and Scope\",
        \"type\": \"markdown\",
        \"content\": \"[Detailed project overview text explaining how the solution addresses the client's problem]\"
      },
      {
        \"id\": \"timeline\",
        \"title\": \"2. Detailed Timeline\",
        \"type\": \"table\",
        \"headers\": [\"Phase\", \"Estimated Duration (Weeks)\", \"Start Date (Est.)\", \"End Date (Est.)\", \"Milestone Description\"],
        \"rows\": [
          [\"Discovery & Planning\", \"2\", \"" . ($hasStartDate ? date('M d, Y', strtotime($data['start_date'])) : 'TBD') . "\", \"" . ($hasStartDate && $hasEndDate ? date('M d, Y', strtotime($data['end_date'])) : 'TBD') . "\", \"In-depth requirement gathering and project planning\"],
          [\"Development\", \"4-6\", \"TBD\", \"TBD\", \"Core development work\"]
        ]
      },
      {
        \"id\": \"cost_breakdown\",
        \"title\": \"3. Cost Breakdown\",
        \"type\": \"object\",
        \"data\": {
          \"discovery_and_planning\": {
            \"description\": \"Detailed description of this service item\",
            \"cost\": 3000
          },
          \"development\": {
            \"description\": \"Detailed description of development work\",
            \"cost\": 12000
          }
        }
      },
      {
        \"id\": \"deliverables\",
        \"title\": \"4. Deliverables and Milestones\",
        \"type\": \"list\",
        \"items\": [
          \"Fully functional application\",
          \"Source code documentation\",
          \"User manual\",
          \"Technical documentation\"
        ]
      },
      {
        \"id\": \"milestones\",
        \"title\": \"Project Milestone Payments\",
        \"type\": \"table\",
        \"headers\": [\"Milestone Name\", \"Description\", \"Percentage\"],
        \"rows\": [
          [\"Discovery Completion\", \"Requirements finalized and project plan approved\", \"15%\"],
          [\"Core Development\", \"Key modules developed and functional\", \"25%\"],
          [\"Final Delivery\", \"System deployed and UAT passed\", \"15%\"]
        ]
      },
      {
        \"id\": \"technical_requirements\",
        \"title\": \"5. Technical Requirements\",
        \"type\": \"key_value\",
        \"data\": {
          \"Backend Framework\": \"Laravel / Django / Node.js\",
          \"Frontend Framework\": \"React / Vue.js / Angular\",
          \"Database\": \"PostgreSQL / MySQL\",
          \"Hosting\": \"AWS / Azure / GCP\"
        }
      },
      {
        \"id\": \"payment_terms\",
        \"title\": \"6. Payment Terms\",
        \"type\": \"markdown\",
        \"content\": \"Payment will be structured based on project milestones. An initial advance payment is required to formally commence work.\"
      },
      {
        \"id\": \"support_packages\",
        \"title\": \"7. Support and Maintenance Options\",
        \"type\": \"accordion\",
        \"items\": [
          {
            \"name\": \"Standard Support Package\",
            \"availability\": \"Business hours (Monday - Friday, 9 AM - 5 PM)\",
            \"description\": \"Includes access to technical support team for bug resolution and general inquiries. Periodic system health checks.\"
          },
          {
            \"name\": \"Premium Support Package\",
            \"availability\": \"24/7 for critical issues, extended business hours for general inquiries\",
            \"description\": \"Offers all benefits of Standard Package, plus extended support hours, guaranteed response times, and proactive monitoring.\"
          },
          {
            \"name\": \"Comprehensive Maintenance & Evolution Package\",
            \"availability\": \"Dedicated account management, priority support\",
            \"description\": \"Top-tier package with strategy sessions, planned updates for new feature development, and integration support.\"
          }
        ]
      }
    ]
  }
}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting, no code blocks
- All section types must match exactly: \"markdown\", \"table\", \"object\", \"list\", \"key_value\", \"accordion\"
- Cost breakdown data should have keys like \"discovery_and_planning\", \"development\", etc. with \"description\" and \"cost\" fields
- Table rows must be arrays of strings matching the headers
- List items are simple string arrays
- Key-value data is an object with string keys and values
- Accordion items have \"name\", \"availability\", and \"description\" fields
- Be specific and detailed in all descriptions
" . (!$hasEndDate && $hasStartDate ? "\nCRITICAL: Since no end date was provided, you MUST:\n- Calculate and suggest an appropriate project duration based on the scope\n- Fill in the timeline table with realistic start and end dates for each phase\n- Ensure the final end date in your timeline reflects the total suggested duration\n- The duration should be reasonable based on the problem complexity and solution scope" : '') . "
";
    }

    /**
     * Call Google Gemini API
     */
    public function callGeminiAPI(string $prompt)
    {
        try {
            // Check if API key is configured
            $apiKey = env('GEMINI_API_KEY');
            if (!$apiKey) {
                throw new Exception('Gemini API key not configured');
            }

            // Initialize Gemini client
            $client = new Client($apiKey);

            $systemInstruction = "You are a professional business consultant helping create quotation drafts. 
            
Your role is to generate STRUCTURED JSON DATA for quotation items. 

CRITICAL REQUIREMENTS:
- You MUST respond with ONLY valid JSON (no markdown, no explanations, no code blocks)
- The JSON must follow the exact structure specified in the prompt
- Generate detailed, professional descriptions for services and deliverables
- Suggest individual item prices (as numbers only, no currency symbols)
- Do NOT calculate totals, taxes, or final amounts (the system handles calculations)
- Do NOT include quotation numbers, dates, or document IDs (system adds these)
- Do NOT write legal terms (system uses pre-approved templates)
- Focus on clear, professional descriptions that help clients understand the value proposition
- Ensure all section types are exactly: \"markdown\", \"table\", \"object\", \"list\", \"key_value\", or \"accordion\"
- Validate that your JSON is valid and parseable";

            $response = $client->withV1BetaVersion()
                ->generativeModel(ModelName::GEMINI_2_5_FLASH)
                ->withSystemInstruction($systemInstruction)
                ->generateContent(
                    new TextPart($prompt),
                );

            // Get the generated text from the response
            $generatedText = $response->text();
            
            // Clean the response - remove markdown code blocks if present
            $cleanedText = $generatedText;
            
            // Remove markdown code blocks (```json ... ```)
            $cleanedText = preg_replace('/```json\s*/i', '', $cleanedText);
            $cleanedText = preg_replace('/```\s*$/i', '', $cleanedText);
            $cleanedText = trim($cleanedText);
            
            // Try to extract JSON from the response
            $jsonData = null;
            $parseError = null;
            
            try {
                // Try to parse as JSON
                $jsonData = json_decode($cleanedText, true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new Exception('JSON parse error: ' . json_last_error_msg());
                }
                
                // Validate structure
                if (!isset($jsonData['quotation'])) {
                    throw new Exception('Missing "quotation" key in response');
                }
                
                if (!isset($jsonData['quotation']['sections']) || !is_array($jsonData['quotation']['sections'])) {
                    throw new Exception('Missing or invalid "sections" array in quotation');
                }
                
                // Structure the response with meta information
                $structuredResponse = [
                    'meta' => [
                        'ai_generated' => true,
                        'generated_at' => now()->format('c'),
                        'note' => 'AI-generated descriptive content. System adds metadata, totals, and templates for legal terms.',
                        'version' => '1.0'
                    ],
                    'quotation' => $jsonData['quotation']
                ];
                
                // Ensure title and currency are set
                if (!isset($structuredResponse['quotation']['title'])) {
                    $structuredResponse['quotation']['title'] = $jsonData['quotation']['title'] ?? 'Project Quotation';
                }
                if (!isset($structuredResponse['quotation']['currency'])) {
                    $structuredResponse['quotation']['currency'] = $jsonData['quotation']['currency'] ?? 'RM';
                }
                
                return json_encode($structuredResponse, JSON_PRETTY_PRINT);
                
            } catch (Exception $e) {
                $parseError = $e->getMessage();
                Log::error('Failed to parse Gemini JSON response: ' . $parseError . ' | Raw response: ' . substr($cleanedText, 0, 500));
                
                // Throw exception to indicate failure
                throw new Exception('Failed to generate quotation: ' . $parseError);
            }
        } catch (Exception $e) {
            Log::error('Gemini API Error: ' . $e->getMessage());
            
            // Re-throw the exception to be handled by the calling controller
            throw new Exception('Failed to generate quotation: ' . $e->getMessage());
        }
    }
}