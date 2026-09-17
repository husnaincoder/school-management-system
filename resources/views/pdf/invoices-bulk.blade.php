<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Invoices</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #333; }
        .page-block { page-break-after: always; }
        .page-block:last-child { page-break-after: auto; }
        .header { margin-bottom: 12px; border-bottom: 2px solid #d97706; padding-bottom: 8px; text-align: center; }
        .logo { max-height: 50px; max-width: 160px; display: block; margin-left: auto; margin-right: auto; }
        .school-name { font-size: 16px; font-weight: bold; color: #92400e; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin: 4px 0; font-size: 10px; }
        th, td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .text-right { text-align: right; }
        .totals { margin-top: 8px; width: 240px; margin-left: auto; }
    </style>
</head>
<body>
    @foreach($pages as $page)
        <div class="page-block">
            <div class="header">
                @if(!empty($page['logoPath']))
                    <img src="{{ $page['logoPath'] }}" class="logo" alt="Logo" />
                @endif
                <div class="school-name">{{ $page['schoolName'] }}</div>
                <div style="font-size: 9px; color: #6b7280;">Fee Invoice</div>
            </div>
            <table style="width: 100%; margin-bottom: 6px; border: none;"><tr style="border: none;">
                <td style="text-align: left; border: none;"><strong>Invoice No:</strong> {{ $page['invoice']->invoice_no }}</td>
                <td style="text-align: right; border: none;">
                    <strong>Issue:</strong> {{ $page['invoice']->issue_date?->format('d M Y') }}
                    | <strong>Due:</strong> {{ $page['invoice']->due_date?->format('d M Y') }}
                    | <strong>Status:</strong> {{ strtoupper($page['invoice']->status) }}
                </td>
            </tr></table>
            <div style="margin-bottom: 6px;">
                <strong>Student:</strong> {{ $page['label'] }}
                <br><strong>Session / Class / Section:</strong> {{ $page['session'] }} · {{ $page['class'] }} · {{ $page['section'] }}
            </div>
            <table>
                <thead>
                    <tr><th>#</th><th>Fee Type</th><th>Description</th><th class="text-right">Amount</th></tr>
                </thead>
                <tbody>
                    @foreach($page['invoice']->items as $idx => $item)
                        <tr>
                            <td>{{ $idx + 1 }}</td>
                            <td>{{ $item->feeType?->name ?? '—' }}</td>
                            <td>{{ $item->description ?? '—' }}</td>
                            <td class="text-right">{{ number_format($item->amount, 2) }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
            <table class="totals">
                <tr><td>Total</td><td class="text-right">{{ number_format($page['invoice']->total_amount, 2) }}</td></tr>
                <tr><td>Fine</td><td class="text-right">{{ number_format($page['invoice']->fine_amount, 2) }}</td></tr>
                <tr><td>Paid</td><td class="text-right">{{ number_format($page['invoice']->paid_amount, 2) }}</td></tr>
                <tr style="font-weight: bold;"><td>Balance</td><td class="text-right">{{ number_format($page['invoice']->balance, 2) }}</td></tr>
            </table>
            @if($page['invoice']->payments && $page['invoice']->payments->isNotEmpty())
                <div style="margin-top: 12px;"><strong>Payments</strong></div>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Method</th>
                            <th>Transaction ID</th>
                            <th class="text-right">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($page['invoice']->payments as $p)
                            <tr>
                                <td>{{ $p->payment_date?->format('d M Y') }}</td>
                                <td>{{ ucfirst($p->method) }}</td>
                                <td>{{ $p->transaction_id ?? '—' }}</td>
                                <td class="text-right">{{ number_format($p->amount, 2) }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>
    @endforeach
</body>
</html>
