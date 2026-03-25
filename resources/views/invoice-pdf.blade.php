<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice</title>
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

        .header-container {
            display: table;
            width: 100%;
            margin-bottom: 40px;
            border-bottom: 2px solid #000;
            padding-bottom: 20px;
        }

        .company-info {
            display: table-cell;
            width: 60%;
            vertical-align: top;
        }

        .invoice-title {
            display: table-cell;
            width: 40%;
            text-align: right;
            vertical-align: top;
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

        .title-text {
            font-size: 32px;
            font-weight: bold;
            color: #333;
            text-transform: uppercase;
            margin-bottom: 10px;
        }

        .invoice-meta {
            text-align: right;
            font-size: 11px;
        }

        .bill-to {
            margin-bottom: 30px;
        }

        .bill-to-title {
            font-weight: bold;
            text-transform: uppercase;
            color: #555;
            font-size: 10px;
            margin-bottom: 5px;
        }

        .items-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 11px;
        }

        .items-table th,
        .items-table td {
            border-bottom: 1px solid #ddd;
            padding: 10px 8px;
            text-align: left;
        }

        .items-table th {
            background-color: #f9f9f9;
            font-weight: bold;
            text-transform: uppercase;
            font-size: 10px;
        }

        .items-table .amount-col {
            text-align: right;
        }

        .items-table .qty-col {
            text-align: center;
        }

        .totals-section {
            width: 100%;
            margin-top: 20px;
        }

        .totals-table {
            width: 40%;
            margin-left: auto;
            border-collapse: collapse;
        }

        .totals-table td {
            padding: 5px 8px;
            text-align: right;
        }

        .totals-table .total-row {
            font-weight: bold;
            font-size: 14px;
            border-top: 2px solid #000;
        }

        .notes-section {
            margin-top: 40px;
            border-top: 1px solid #eee;
            padding-top: 20px;
        }

        .notes-title {
            font-weight: bold;
            margin-bottom: 5px;
        }

        .footer {
            position: fixed;
            bottom: 0;
            width: 100%;
            text-align: center;
            font-size: 10px;
            border-top: 1px solid #ccc;
            padding-top: 10px;
            color: #777;
        }
    </style>
</head>

<body>
    <div class="header-container">
        <div class="company-info">
            <div class="company-name">{{ $companyProfile['company_name'] ?? 'Your Company Name' }}</div>
            <div class="company-details">
                {{ $companyProfile['company_address'] ?? '' }}<br>
                @php
                    $details = [];
                    if (!empty($companyProfile['company_phone'])) {
                        $details[] = 'Tel: ' . $companyProfile['company_phone'];
                    }
                    if (!empty($companyProfile['company_email'])) {
                        $details[] = 'Email: ' . $companyProfile['company_email'];
                    }
                    if (!empty($companyProfile['company_website'])) {
                        $details[] = 'Web: ' . $companyProfile['company_website'];
                    }
                @endphp
                {!! implode('<br>', $details) !!}
            </div>
        </div>
        <div class="invoice-title">
            <div class="title-text">INVOICE</div>
            <div class="invoice-meta">
                <strong>Invoice #:</strong> INV-{{ $invoice->invoice_number }}<br>
                <strong>Date:</strong> {{ date('d F Y', strtotime($invoice->invoice_date)) }}<br>
                <strong>Due Date:</strong> {{ date('d F Y', strtotime($invoice->due_date)) }}<br>
                @if($invoice->phase_name)
                    <strong>Milestone:</strong> {{ $invoice->phase_name }} ({{ number_format((float) $invoice->phase_percentage, 2) }}%)<br>
                @endif
                @if($invoice->status !== 'pending')
                    <strong style="color: {{ $invoice->status === 'paid' ? 'green' : 'red' }}; text-transform: uppercase;">
                        Status: {{ $invoice->status }}
                    </strong>
                @endif
            </div>
        </div>
    </div>

    <div class="bill-to">
        <div class="bill-to-title">Bill To:</div>
        <strong>{{ $invoice->client->company_name }}</strong><br>
        Attn: {{ $invoice->client->supervisor_name }}<br>
        {{ $invoice->client->company_email }}<br>
        {{ $invoice->client->company_phone_number }}
        @if($invoice->client->company_address)
            <br>{{ $invoice->client->company_address }}
        @endif
    </div>

    <table class="items-table">
        <thead>
            <tr>
                <th style="width: 5%;">#</th>
                <th style="width: 50%;">Description</th>
                <th style="width: 10%;" class="qty-col">Qty</th>
                <th style="width: 15%;" class="amount-col">Price</th>
                <th style="width: 20%;" class="amount-col">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($invoice->items as $index => $item)
                <tr>
                    <td>{{ $loop->iteration }}</td>
                    <td>{{ $item->description }}</td>
                    <td class="qty-col">{{ $item->quantity }}</td>
                    <td class="amount-col">{{ number_format($item->unit_price, 2) }}</td>
                    <td class="amount-col">{{ number_format($item->amount, 2) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals-section">
        <table class="totals-table">
            <tr>
                <td>Subtotal</td>
                <td>{{ $invoice->currency }} {{ number_format($invoice->total_amount, 2) }}</td>
            </tr>
            <!-- Add tax rows here if needed -->
            <tr class="total-row">
                <td>Total</td>
                <td>{{ $invoice->currency }} {{ number_format($invoice->total_amount, 2) }}</td>
            </tr>
        </table>
    </div>

    @if($invoice->notes)
        <div class="notes-section">
            <div class="notes-title">Notes:</div>
            <div>{!! nl2br(e($invoice->notes)) !!}</div>
        </div>
    @endif

    <div class="footer">
        Thank you for your business!
    </div>
</body>

</html>