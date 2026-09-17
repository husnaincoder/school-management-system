<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Expenses Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #333; }
        .header { margin-bottom: 12px; border-bottom: 2px solid #d97706; padding-bottom: 8px; text-align: center; }
        .logo { max-height: 50px; max-width: 160px; display: block; margin-left: auto; margin-right: auto; }
        .school-name { font-size: 16px; font-weight: bold; color: #92400e; margin-top: 2px; }
        .subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9px; }
        th, td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .text-right { text-align: right; }
        .footer { margin-top: 12px; font-size: 8px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoPath))
            <img src="{{ $logoPath }}" class="logo" alt="Logo" />
        @endif
        <div class="school-name">{{ $schoolName }}</div>
        <div class="subtitle">Expenses Report · {{ count($expenses) }} record(s) · Generated {{ now()->format('d M Y H:i') }}</div>
    </div>
    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Expense Number</th>
                <th>Date</th>
                <th>Category</th>
                <th>Vendor</th>
                <th class="text-right">Total</th>
                <th class="text-right">Paid</th>
                <th class="text-right">Due</th>
                <th>Status</th>
                <th>Notes</th>
            </tr>
        </thead>
        <tbody>
            @foreach($expenses as $idx => $e)
                <tr>
                    <td>{{ $idx + 1 }}</td>
                    <td>{{ $e->expense_number }}</td>
                    <td>{{ $e->expense_date?->format('d M Y') }}</td>
                    <td>{{ $e->category?->name ?? '—' }}</td>
                    <td>{{ $e->vendor?->name ?? '—' }}</td>
                    <td class="text-right">{{ number_format($e->total_amount, 2) }}</td>
                    <td class="text-right">{{ number_format($e->paid_amount, 2) }}</td>
                    <td class="text-right">{{ number_format($e->due_amount, 2) }}</td>
                    <td>{{ strtoupper($e->status) }}</td>
                    <td>{{ Str::limit($e->notes, 30) }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
    <div class="footer">
        Total: {{ count($expenses) }} expense(s) · Grand Total: {{ number_format($expenses->sum('total_amount'), 2) }}
    </div>
</body>
</html>
