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
        }

        .cost-table th,
        .cost-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }

        .cost-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }

        .cost-table .amount {
            text-align: right;
        }

        .cost-table .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
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
        <div class="company-name">DyDxSoft</div>
        <div class="company-details">
            Tel: +6017-776 6540 | Email: info@dydxsoft.my<br>
            Website: www.dydxsoft.my
        </div>
    </div>

    <!-- Date -->
    <div class="date-ref">
        <strong>Date:</strong> {{ date('d F Y') }}
    </div>

    <!-- Recipient -->
    <div class="recipient">
        @if($quotation->client)
        {{ $quotation->client->supervisor_name }}<br>
        <strong>{{ $quotation->client->company_name }}</strong><br>
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
        @endphp

        @if(isset($quotationData['project_overview']))
        <p><strong>Project Overview:</strong></p>
        <p>{{ $quotationData['project_overview'] }}</p>
        @endif

        @if(isset($quotationData['timeline']))
        <p><strong>Timeline:</strong> {{ $quotationData['timeline'] }}</p>
        @endif

        @if(isset($quotationData['cost_breakdown']))
        <p><strong>Cost Breakdown:</strong></p>
        <table class="cost-table">
            <thead>
                <tr>
                    <th>No.</th>
                    <th>Item</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                @php $counter = 1; @endphp
                @foreach($quotationData['cost_breakdown'] as $key => $value)
                    @if($key !== 'total')
                    <tr>
                        <td style="text-align: center;">{{ $counter++ }}</td>
                        <td>{{ ucwords(str_replace('_', ' ', $key)) }}</td>
                        <td class="amount">{{ $value }}</td>
                    </tr>
                    @endif
                @endforeach
                @if(isset($quotationData['cost_breakdown']['total']))
                <tr class="total-row">
                    <td colspan="2" style="text-align: center;"><strong>TOTAL AMOUNT</strong></td>
                    <td class="amount"><strong>{{ $quotationData['cost_breakdown']['total'] }}</strong></td>
                </tr>
                @endif
            </tbody>
        </table>
        @endif

        @if(isset($quotationData['deliverables']) && is_array($quotationData['deliverables']))
        <p><strong>Deliverables:</strong></p>
        <ul class="deliverables-list">
            @foreach($quotationData['deliverables'] as $deliverable)
            <li>{{ $deliverable }}</li>
            @endforeach
        </ul>
        @endif

        @if(isset($quotationData['payment_terms']))
        <p><strong>Payment Terms:</strong></p>
        <p>{{ $quotationData['payment_terms'] }}</p>
        @endif

        @if(isset($quotationData['support']))
        <p><strong>Support & Maintenance:</strong></p>
        <p>{{ $quotationData['support'] }}</p>
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
        DyDxSoft</p>
    </div>
</body>
</html>
