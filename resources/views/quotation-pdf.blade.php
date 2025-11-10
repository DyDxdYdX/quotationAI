<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Quotation</title>
    <style>
        @page {
            margin: 20mm;
            size: A4;
        }

        body {
            font-family: 'Times New Roman', serif;
            font-size: 12px;
            line-height: 1.6;
            color: #000;
            margin: 0;
            padding: 0;
        }

        .letterhead {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }

        .company-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            text-transform: uppercase;
        }

        .company-details {
            font-size: 11px;
            line-height: 1.4;
        }

        .date-ref {
            text-align: right;
            margin-bottom: 30px;
        }

        .recipient {
            margin-bottom: 30px;
        }

        .subject {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 20px;
            text-align: center;
        }

        .salutation {
            margin-bottom: 20px;
        }

        .content {
            text-align: justify;
            margin-bottom: 20px;
        }

        .content p {
            margin-bottom: 15px;
        }

        .cost-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
            page-break-inside: avoid;
        }

        .cost-table th,
        .cost-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
            word-wrap: break-word;
        }

        .cost-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }

        .cost-table .amount {
            text-align: right;
            white-space: nowrap;
        }

        .cost-table .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }

        .cost-table td.description {
            font-size: 10px;
            max-width: 300px;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 10px;
            margin-top: 20px;
            text-decoration: underline;
        }

        .deliverables-list {
            margin: 15px 0;
            padding-left: 0;
        }

        .deliverables-list li {
            margin-bottom: 5px;
            list-style-type: none;
            position: relative;
            padding-left: 20px;
        }

        .deliverables-list li:before {
            content: "•";
            position: absolute;
            left: 0;
        }

        .closing {
            margin-top: 30px;
        }

        .signature-section {
            margin-top: 50px;
        }

        .signature-line {
            border-bottom: 1px solid #000;
            width: 200px;
            margin-bottom: 5px;
        }

        .terms-section {
            margin-top: 30px;
            page-break-inside: avoid;
        }

        .terms-title {
            font-weight: bold;
            text-decoration: underline;
            margin-bottom: 10px;
        }

        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <!-- Letterhead -->
    <div class="letterhead">
        <div class="company-name">{{ $companyProfile['company_name'] ?? 'Your Company Name' }}</div>
        <div class="company-details">
            @php
                $details = [];
                if (!empty($companyProfile['company_phone'])) {
                    $details[] = 'Tel: ' . $companyProfile['company_phone'];
                }
                if (!empty($companyProfile['company_email'])) {
                    $details[] = 'Email: ' . $companyProfile['company_email'];
                }
                if (!empty($companyProfile['company_website'])) {
                    $details[] = 'Website: ' . $companyProfile['company_website'];
                }
            @endphp
            @if(count($details) > 0)
                {{ implode(' | ', array_slice($details, 0, 2)) }}
                @if(count($details) > 2)
                    <br>{{ $details[2] }}
                @endif
            @endif
        </div>
    </div>

    <!-- Date and Quotation Number -->
    <div class="date-ref">
        <strong>Quotation No.:</strong> QTN-{{ str_pad($quotation->id, 6, '0', STR_PAD_LEFT) }}<br>
        <strong>Date:</strong> {{ date('d F Y', strtotime($quotation->created_at)) }}<br>
        @if($quotation->start_date)
        <strong>Project Start Date:</strong> {{ date('d F Y', strtotime($quotation->start_date)) }}<br>
        @endif
        @if($quotation->end_date)
        <strong>Project End Date:</strong> {{ date('d F Y', strtotime($quotation->end_date)) }}<br>
        @elseif($quotation->start_date)
        <strong>Project End Date:</strong> To be determined (duration suggested in timeline)<br>
        @endif
        @if($quotation->start_date && $quotation->end_date)
            @php
                $start = new DateTime($quotation->start_date);
                $end = new DateTime($quotation->end_date);
                $diff = $start->diff($end);
                $weeks = ceil($diff->days / 7);
                $months = $diff->m + ($diff->y * 12);
            @endphp
            <strong>Project Duration:</strong> 
            @if($months > 0)
                {{ $months }} month(s) ({{ $weeks }} weeks)
            @else
                {{ $weeks }} week(s)
            @endif
        @endif
    </div>

    <!-- Recipient -->
    <div class="recipient">
        @if($quotation->client)
        {{ $quotation->client->supervisor_name }}<br>
        <strong>{{ $quotation->client->company_name }}</strong><br>
        @if($quotation->client->company_registration_number)
        Registration No.: {{ $quotation->client->company_registration_number }}<br>
        @endif
        Email: {{ $quotation->client->company_email }}<br>
        Tel: {{ $quotation->client->company_phone_number }}
        @endif
    </div>

    <!-- Subject -->
    <div class="subject">
        <strong>SUBJECT: QUOTATION FOR 
        @if($quotation->quotationRequest)
            {{ strtoupper(str_replace('_', ' ', $quotation->quotationRequest->service_type)) }} SERVICES
        @endif
        </strong>
    </div>

    <!-- Salutation -->
    <div class="salutation">
        <strong>Dear Sir/Madam,</strong>
    </div>

    <!-- Content -->
    <div class="content">
        <p>With reference to your request for a quotation, we are pleased to submit our proposal as follows:</p>

        @php
            $quotationData = is_string($quotation->quotation_message) 
                ? json_decode($quotation->quotation_message, true) 
                : $quotation->quotation_message;
            
            // Check if this is the new structured format
            $isStructuredFormat = isset($quotationData['quotation']) && isset($quotationData['quotation']['sections']) && is_array($quotationData['quotation']['sections']);
            
            // Check if this is the new text format
            $isTextFormat = !$isStructuredFormat && isset($quotationData['format']) && $quotationData['format'] === 'text' && isset($quotationData['content']);
            $content = $isTextFormat ? $quotationData['content'] : null;
            
            // Extract JSON from markdown code blocks
            function extractJsonFromContent($text) {
                if (preg_match('/```json\s*([\s\S]*?)\s*```/', $text, $matches)) {
                    $json = json_decode($matches[1], true);
                    return $json;
                }
                return null;
            }
            
            // Parse markdown sections
            function parseMarkdownSection($content, $sectionNumber, $sectionTitle) {
                // More flexible pattern - match section number and partial title
                // Handles variations like "**1. PROJECT OVERVIEW AND SCOPE**" or "**1. PROJECT OVERVIEW**"
                $titleWords = explode(' ', $sectionTitle);
                $titlePattern = implode('.*', array_map('preg_quote', $titleWords));
                
                // Try exact match first
                $pattern = '/\*\*' . preg_quote($sectionNumber, '/') . '\.\s*' . preg_quote($sectionTitle, '/') . '\*\*([\s\S]*?)(?=\*\*\d+\.|$)/i';
                if (preg_match($pattern, $content, $matches)) {
                    return trim($matches[1]);
                }
                
                // Try flexible match with key words
                $pattern = '/\*\*' . preg_quote($sectionNumber, '/') . '\.\s*.*?' . $titlePattern . '.*?\*\*([\s\S]*?)(?=\*\*\d+\.|$)/i';
                if (preg_match($pattern, $content, $matches)) {
                    return trim($matches[1]);
                }
                
                // Try just section number
                $pattern = '/\*\*' . preg_quote($sectionNumber, '/') . '\.\s*[^*]+\*\*([\s\S]*?)(?=\*\*\d+\.|$)/i';
                if (preg_match($pattern, $content, $matches)) {
                    return trim($matches[1]);
                }
                
                return null;
            }
            
            // Parse markdown table
            function parseMarkdownTable($text) {
                $lines = explode("\n", $text);
                $tableLines = [];
                $inTable = false;
                
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    if (strpos($trimmed, '|') !== false && !preg_match('/^\|\s*:?-+:?\s*\|$/', $trimmed)) {
                        $tableLines[] = $trimmed;
                        $inTable = true;
                    } elseif ($inTable && empty($trimmed)) {
                        break;
                    }
                }
                
                if (count($tableLines) < 2) return null;
                
                $headers = array_map('trim', explode('|', $tableLines[0]));
                $headers = array_filter($headers);
                $headers = array_values($headers);
                
                $rows = [];
                for ($i = 1; $i < count($tableLines); $i++) {
                    $values = array_map('trim', explode('|', $tableLines[$i]));
                    $values = array_filter($values);
                    $values = array_values($values);
                    
                    if (count($values) >= count($headers)) {
                        $row = [];
                        foreach ($headers as $idx => $header) {
                            $row[$header] = isset($values[$idx]) ? $values[$idx] : '';
                        }
                        $rows[] = $row;
                    }
                }
                
                return ['headers' => $headers, 'rows' => $rows];
            }
            
            // Parse markdown list
            function parseMarkdownList($text) {
                $items = [];
                $lines = explode("\n", $text);
                
                foreach ($lines as $line) {
                    $trimmed = trim($line);
                    if (preg_match('/^\s*[\*\-\•]\s+(.+)$/', $trimmed, $matches)) {
                        $items[] = trim($matches[1]);
                    }
                }
                
                return $items;
            }
            
            // Render text with basic markdown formatting (bold, lists)
            function renderMarkdownText($text) {
                // Split into blocks (paragraphs, lists, etc.)
                $blocks = preg_split('/\n\n+/', $text);
                $output = '';
                
                foreach ($blocks as $block) {
                    $block = trim($block);
                    if (empty($block)) continue;
                    
                    // Check if it's a list
                    if (preg_match('/^\s*[\*\-\•]/m', $block)) {
                        $items = parseMarkdownList($block);
                        if (count($items) > 0) {
                            $output .= '<ul class="deliverables-list">';
                            foreach ($items as $item) {
                                // Convert **bold** to <strong>bold</strong> then escape HTML
                                $item = preg_replace('/\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*/', '<strong>$1</strong>', $item);
                                // Escape HTML but allow <strong> tags - use ENT_NOQUOTES to preserve & as &
                                $item = htmlspecialchars($item, ENT_NOQUOTES, 'UTF-8');
                                $item = str_replace(['&lt;strong&gt;', '&lt;/strong&gt;'], ['<strong>', '</strong>'], $item);
                                $output .= '<li>' . nl2br($item) . '</li>';
                            }
                            $output .= '</ul>';
                        }
                    }
                    // Check if it's a table (skip, handled separately)
                    elseif (strpos($block, '|') !== false && preg_match('/\|.+\|/', $block)) {
                        // Skip tables here, they're handled separately
                        continue;
                    }
                    // Regular paragraph
                    else {
                        // Convert **bold** to <strong>bold</strong> then escape HTML
                        $block = preg_replace('/\*\*([^*]+(?:\*(?!\*)[^*]*)*)\*\*/', '<strong>$1</strong>', $block);
                        // Escape HTML but allow <strong> tags - use ENT_NOQUOTES to preserve & as &
                        $block = htmlspecialchars($block, ENT_NOQUOTES, 'UTF-8');
                        $block = str_replace(['&lt;strong&gt;', '&lt;/strong&gt;'], ['<strong>', '</strong>'], $block);
                        $output .= '<p>' . nl2br($block) . '</p>';
                    }
                }
                
                return $output;
            }
            
            // Format currency
            function formatCurrency($amount, $currency = 'RM') {
                return $currency . ' ' . number_format($amount, 2, '.', ',');
            }
            
            // Calculate total from cost breakdown (system-controlled)
            function calculateTotal($costBreakdown) {
                $total = 0;
                if (isset($costBreakdown['cost_breakdown']) && is_array($costBreakdown['cost_breakdown'])) {
                    foreach ($costBreakdown['cost_breakdown'] as $key => $value) {
                        if (is_array($value) && isset($value['cost'])) {
                            $total += (float) $value['cost'];
                        }
                    }
                }
                return $total;
            }
            
            // Render cost breakdown table (system calculates total)
            function renderCostBreakdownTable($costBreakdown, $currency = 'RM') {
                if (!isset($costBreakdown['cost_breakdown']) || !is_array($costBreakdown['cost_breakdown'])) {
                    return '';
                }
                
                $output = '<table class="cost-table"><thead><tr><th>No.</th><th>Item</th><th>Description</th><th class="amount">Amount (' . $currency . ')</th></tr></thead><tbody>';
                $counter = 1;
                $total = 0;
                
                foreach ($costBreakdown['cost_breakdown'] as $key => $item) {
                    if (is_array($item) && isset($item['cost'])) {
                        $itemName = ucwords(str_replace('_', ' ', $key));
                        $description = isset($item['description']) ? htmlspecialchars($item['description']) : '';
                        $cost = (float) $item['cost'];
                        $total += $cost;
                        
                        $output .= '<tr>';
                        $output .= '<td style="text-align: center;">' . $counter++ . '</td>';
                        $output .= '<td>' . htmlspecialchars($itemName) . '</td>';
                        $output .= '<td class="description">' . $description . '</td>';
                        $output .= '<td class="amount">' . formatCurrency($cost, $currency) . '</td>';
                        $output .= '</tr>';
                    }
                }
                
                // System calculates total
                $output .= '<tr class="total-row">';
                $output .= '<td colspan="3" style="text-align: right; padding-right: 20px;"><strong>SUBTOTAL</strong></td>';
                $output .= '<td class="amount"><strong>' . formatCurrency($total, $currency) . '</strong></td>';
                $output .= '</tr>';
                
                // Calculate SST (6%)
                $sst = $total * 0.06;
                $output .= '<tr>';
                $output .= '<td colspan="3" style="text-align: right; padding-right: 20px;">SST (6%)</td>';
                $output .= '<td class="amount">' . formatCurrency($sst, $currency) . '</td>';
                $output .= '</tr>';
                
                // Grand total
                $grandTotal = $total + $sst;
                    $output .= '<tr class="total-row">';
                $output .= '<td colspan="3" style="text-align: right; padding-right: 20px;"><strong>TOTAL AMOUNT (INCLUDING SST)</strong></td>';
                $output .= '<td class="amount"><strong>' . formatCurrency($grandTotal, $currency) . '</strong></td>';
                    $output .= '</tr>';
                
                $output .= '</tbody></table>';
                return $output;
            }
        @endphp

        @if($isStructuredFormat)
            {{-- New Structured Format --}}
            @php
                $meta = $quotationData['meta'] ?? [];
                $quotation = $quotationData['quotation'] ?? [];
                $sections = $quotation['sections'] ?? [];
                $title = $quotation['title'] ?? 'Quotation';
                $currency = $quotation['currency'] ?? 'RM';
            @endphp

            {{-- Project Overview --}}
            @foreach($sections as $section)
                @if($section['type'] === 'markdown' && isset($section['content']))
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">{{ $section['title'] }}</h3>
                        {!! renderMarkdownText($section['content']) !!}
                    </div>
                @elseif($section['type'] === 'table' && isset($section['headers']) && isset($section['rows']))
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">{{ $section['title'] }}</h3>
                        <table class="cost-table">
                            <thead>
                                <tr>
                                    @foreach($section['headers'] as $header)
                                        <th>{{ $header }}</th>
                                    @endforeach
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($section['rows'] as $row)
                                    <tr>
                                        @foreach($row as $cell)
                                            <td>{!! htmlspecialchars($cell, ENT_NOQUOTES, 'UTF-8') !!}</td>
                                        @endforeach
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @elseif($section['type'] === 'object' && isset($section['data']))
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">{{ $section['title'] }}</h3>
                        @php
                            $costBreakdown = [
                                'currency' => $currency,
                                'cost_breakdown' => $section['data']
                            ];
                        @endphp
                        {!! renderCostBreakdownTable($costBreakdown, $currency) !!}
                    </div>
                @elseif($section['type'] === 'list' && isset($section['items']))
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">{{ $section['title'] }}</h3>
                        <ul class="deliverables-list">
                            @foreach($section['items'] as $item)
                                <li>{!! htmlspecialchars($item, ENT_NOQUOTES, 'UTF-8') !!}</li>
                            @endforeach
                        </ul>
                    </div>
                @elseif($section['type'] === 'key_value' && isset($section['data']))
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">{{ $section['title'] }}</h3>
                        <table class="cost-table">
                            <tbody>
                                @foreach($section['data'] as $key => $value)
                                    <tr>
                                        <td style="font-weight: bold; width: 40%;">{{ $key }}</td>
                                        <td>{!! htmlspecialchars($value, ENT_NOQUOTES, 'UTF-8') !!}</td>
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    </div>
                @elseif($section['type'] === 'accordion' && isset($section['items']))
                    <div style="margin-bottom: 20px;">
                        <h3 class="section-title">{{ $section['title'] }}</h3>
                        @foreach($section['items'] as $item)
                            <div style="margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
                                <p style="font-weight: bold; margin-bottom: 5px;">{!! htmlspecialchars($item['name'] ?? '', ENT_NOQUOTES, 'UTF-8') !!}</p>
                                @if(isset($item['availability']))
                                    <p style="font-size: 10px; color: #666; margin-bottom: 5px;"><strong>Availability:</strong> {!! htmlspecialchars($item['availability'], ENT_NOQUOTES, 'UTF-8') !!}</p>
                                @endif
                                @if(isset($item['description']))
                                    <p style="font-size: 11px;">{!! htmlspecialchars($item['description'], ENT_NOQUOTES, 'UTF-8') !!}</p>
                                @endif
                            </div>
                        @endforeach
                    </div>
                @endif
            @endforeach

        @elseif($isTextFormat && $content)
            {{-- New Text Format --}}
            @php
                // Extract JSON cost breakdown
                $costBreakdownJson = extractJsonFromContent($content);
                
                // Parse sections - try multiple variations
                $projectOverview = parseMarkdownSection($content, '1', 'PROJECT OVERVIEW') 
                    ?? parseMarkdownSection($content, '1', 'OVERVIEW');
                $timelineSection = parseMarkdownSection($content, '2', 'TIMELINE')
                    ?? parseMarkdownSection($content, '2', 'DETAILED TIMELINE');
                $costBreakdownSection = parseMarkdownSection($content, '3', 'COST')
                    ?? parseMarkdownSection($content, '3', 'COST BREAKDOWN');
                $deliverablesSection = parseMarkdownSection($content, '4', 'DELIVERABLES')
                    ?? parseMarkdownSection($content, '4', 'MILESTONES');
                $technicalRequirements = parseMarkdownSection($content, '5', 'TECHNICAL')
                    ?? parseMarkdownSection($content, '5', 'TECHNICAL REQUIREMENTS');
                $paymentTerms = parseMarkdownSection($content, '6', 'PAYMENT')
                    ?? parseMarkdownSection($content, '6', 'PAYMENT TERMS');
                $supportSection = parseMarkdownSection($content, '7', 'SUPPORT')
                    ?? parseMarkdownSection($content, '7', 'MAINTENANCE')
                    ?? parseMarkdownSection($content, '8', 'SUPPORT');
            @endphp

            {{-- Project Overview --}}
            @if($projectOverview)
                <div style="margin-bottom: 20px;">
                    <h3 class="section-title">1. PROJECT OVERVIEW AND SCOPE</h3>
                    {!! renderMarkdownText($projectOverview) !!}
                </div>
            @endif

            {{-- Timeline --}}
            @if($timelineSection)
                <div style="margin-bottom: 20px;">
                    <h3 class="section-title">2. DETAILED TIMELINE</h3>
                    @php
                        $timelineTable = parseMarkdownTable($timelineSection);
                    @endphp
                    @if($timelineTable)
                        <table class="cost-table">
                            <thead>
                                <tr>
                                    @foreach($timelineTable['headers'] as $header)
                                        <th>{{ $header }}</th>
                                    @endforeach
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($timelineTable['rows'] as $row)
                                    <tr>
                                        @foreach($timelineTable['headers'] as $header)
                                            <td>{!! htmlspecialchars($row[$header] ?? '', ENT_NOQUOTES, 'UTF-8') !!}</td>
                                        @endforeach
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @else
                        {!! renderMarkdownText($timelineSection) !!}
                    @endif
                </div>
            @endif

            {{-- Cost Breakdown (System calculates totals) --}}
            @if($costBreakdownJson && isset($costBreakdownJson['cost_breakdown']))
                <div style="margin-bottom: 20px;">
                    <h3 class="section-title">3. COST BREAKDOWN</h3>
                    {!! renderCostBreakdownTable($costBreakdownJson, $costBreakdownJson['currency'] ?? 'RM') !!}
                </div>
            @endif

            {{-- Deliverables and Milestones --}}
            @if($deliverablesSection)
                <div style="margin-bottom: 20px;">
                    <h3 class="section-title">4. DELIVERABLES AND MILESTONES</h3>
                    @php
                        // Extract deliverables list
                        $deliverablesList = parseMarkdownList($deliverablesSection);
                        // Extract milestones table if exists
                        $milestonesTable = null;
                        if (strpos($deliverablesSection, 'Milestones') !== false || strpos($deliverablesSection, 'MILESTONES') !== false) {
                            $milestonesTable = parseMarkdownTable($deliverablesSection);
                        }
                    @endphp
                    
                    @if(count($deliverablesList) > 0)
                        <p><strong>Deliverables:</strong></p>
                        <ul class="deliverables-list">
                            @foreach($deliverablesList as $item)
                                <li>{!! htmlspecialchars($item, ENT_NOQUOTES, 'UTF-8') !!}</li>
                            @endforeach
                        </ul>
                    @endif
                    
                    @if($milestonesTable)
                        <p style="margin-top: 15px;"><strong>Milestones:</strong></p>
                        <table class="cost-table">
                            <thead>
                                <tr>
                                    @foreach($milestonesTable['headers'] as $header)
                                        <th>{{ $header }}</th>
                                    @endforeach
                                </tr>
                            </thead>
                            <tbody>
                                @foreach($milestonesTable['rows'] as $row)
                                    <tr>
                                        @foreach($milestonesTable['headers'] as $header)
                                            <td>{!! htmlspecialchars($row[$header] ?? '', ENT_NOQUOTES, 'UTF-8') !!}</td>
                                        @endforeach
                                    </tr>
                                @endforeach
                            </tbody>
                        </table>
                    @endif
                </div>
            @endif

            {{-- Technical Requirements --}}
            @if($technicalRequirements)
                <div style="margin-bottom: 20px;">
                    <h3 class="section-title">5. TECHNICAL REQUIREMENTS</h3>
                    {!! renderMarkdownText($technicalRequirements) !!}
                </div>
            @endif

            {{-- Payment Terms --}}
            @if($paymentTerms)
                <div style="margin-bottom: 20px;">
                    <h3 class="section-title">6. PAYMENT TERMS</h3>
                    {!! renderMarkdownText($paymentTerms) !!}
                </div>
            @endif

            {{-- Support and Maintenance --}}
            @if($supportSection)
                <div style="margin-bottom: 20px;">
                    <h3 class="section-title">7. SUPPORT AND MAINTENANCE OPTIONS</h3>
                    {!! renderMarkdownText($supportSection) !!}
                </div>
            @endif

        @else
            {{-- Old JSON Format (Backward Compatibility) --}}
            @php
            function formatFieldName($key) {
                return ucwords(str_replace('_', ' ', $key));
            }
            
            function isMetaField($key) {
                    $metaFields = ['ai_generated', 'generated_at', 'format', 'error', 'error_message', 'note'];
                return in_array($key, $metaFields);
            }
            
            function renderObject($data, $depth = 0) {
                if (!is_array($data)) return '';
                
                $output = '';
                foreach ($data as $key => $value) {
                    if (isMetaField($key) || is_null($value)) continue;
                    
                    $output .= '<div style="margin-bottom: 15px;">';
                    $output .= '<p><strong>' . formatFieldName($key) . ':</strong></p>';
                    
                    if (is_array($value)) {
                            if (isset($value['cost_breakdown']) || (strpos(strtolower($key), 'cost') !== false && !array_is_list($value))) {
                                $output .= renderCostBreakdownTable($value);
                            } elseif (array_is_list($value)) {
                                $output .= '<ul class="deliverables-list">';
                                foreach ($value as $item) {
                                    $output .= '<li>' . htmlspecialchars(is_array($item) ? json_encode($item) : $item) . '</li>';
                                }
                                $output .= '</ul>';
                        } else {
                            $output .= renderObject($value, $depth + 1);
                        }
                    } else {
                        $output .= '<p>' . htmlspecialchars($value) . '</p>';
                    }
                    $output .= '</div>';
                }
                return $output;
            }
        @endphp

        {!! renderObject($quotationData) !!}
        @endif
    </div>

    <!-- Terms and Conditions -->
    <div class="terms-section">
        <div class="terms-title">TERMS AND CONDITIONS:</div>
        <p>1. This quotation is valid for 30 days from the date of issue.</p>
        <p>2. Prices stated are exclusive of 6% SST.</p>
        <p>3. Payment shall be made within 30 days from the invoice date.</p>
        <p>4. Any changes to the scope of work will incur additional charges.</p>
    </div>

    <!-- Closing -->
    <div class="closing">
        <p>Thank you for your attention and we look forward to working with you.</p>
    </div>

    <!-- Signature -->
    <div class="signature-section">
        <p>Yours sincerely,</p>
        <br><br>
        <div class="signature-line"></div>
        <p><strong>Manager</strong><br>
        {{ $companyProfile['company_name'] ?? 'Your Company Name' }}</p>
    </div>
</body>
</html>
