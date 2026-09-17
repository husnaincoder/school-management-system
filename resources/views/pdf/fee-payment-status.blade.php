<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Fee Payment Status</title>
    <style>
        @page { margin: 10mm; }
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #111; }
        .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 8px; margin-bottom: 12px; }
        .logo { max-height: 48px; max-width: 120px; display: block; margin: 0 auto 4px; }
        .school-name { font-size: 16px; font-weight: bold; color: #92400e; }
        .title { font-size: 13px; font-weight: bold; margin-top: 4px; }
        .meta { margin-bottom: 10px; }
        .meta td { padding: 2px 8px 2px 0; }
        .summary { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .summary th, .summary td { border: 1px solid #e5e7eb; padding: 5px 6px; text-align: center; }
        .summary th { background: #fff7ed; color: #92400e; font-size: 9px; }
        table.rows { width: 100%; border-collapse: collapse; }
        table.rows th, table.rows td { border: 1px solid #e5e7eb; padding: 4px 5px; text-align: left; }
        table.rows th { background: #f9fafb; font-size: 9px; text-transform: uppercase; }
        .text-right { text-align: right; }
        .paid { color: #15803d; font-weight: bold; }
        .unpaid { color: #b91c1c; font-weight: bold; }
        .partial { color: #b45309; font-weight: bold; }
        .no_invoice { color: #6b7280; font-weight: bold; }
        .footer { margin-top: 10px; font-size: 8px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoSrc))
            <img src="{{ $logoSrc }}" class="logo" alt="Logo" />
        @endif
        <div class="school-name">{{ $schoolName }}</div>
        <div class="title">Fee Payment Status Report</div>
    </div>

    <table class="meta">
        <tr>
            <td><strong>Billing Month:</strong> {{ $meta['billing_month'] ?? ($filters['billing_month'] ?? '—') }}</td>
            <td><strong>Session:</strong> {{ $meta['session_name'] ?? '—' }}</td>
            <td><strong>Class:</strong> {{ $meta['class_name'] ?? '—' }}</td>
            <td><strong>Section:</strong> {{ $meta['section_name'] ?? '—' }}</td>
        </tr>
    </table>

    <table class="summary">
        <thead>
            <tr>
                <th>Students</th>
                <th>Paid</th>
                <th>Partial</th>
                <th>Unpaid</th>
                <th>No Invoice</th>
                <th>Total Paid</th>
                <th>Total Balance</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $summary['total_students'] ?? 0 }}</td>
                <td class="paid">{{ $summary['paid'] ?? 0 }}</td>
                <td class="partial">{{ $summary['partial'] ?? 0 }}</td>
                <td class="unpaid">{{ $summary['unpaid'] ?? 0 }}</td>
                <td class="no_invoice">{{ $summary['no_invoice'] ?? 0 }}</td>
                <td>{{ number_format((float) ($summary['total_paid'] ?? 0), 2) }}</td>
                <td>{{ number_format((float) ($summary['total_balance'] ?? 0), 2) }}</td>
            </tr>
        </tbody>
    </table>

    <table class="rows">
        <thead>
            <tr>
                <th>#</th>
                <th>Roll</th>
                <th>Student</th>
                <th>Class</th>
                <th>Section</th>
                <th>Invoice</th>
                <th class="text-right">Total</th>
                <th class="text-right">Paid</th>
                <th class="text-right">Balance</th>
                <th>Due Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @forelse($rows as $i => $row)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>{{ $row['roll_number'] }}</td>
                    <td>{{ $row['student_name'] }}</td>
                    <td>{{ $row['class_name'] }}</td>
                    <td>{{ $row['section_name'] }}</td>
                    <td>{{ $row['invoice_no'] }}</td>
                    <td class="text-right">{{ number_format((float) $row['total_amount'], 2) }}</td>
                    <td class="text-right">{{ number_format((float) $row['paid_amount'], 2) }}</td>
                    <td class="text-right">{{ number_format((float) $row['balance'], 2) }}</td>
                    <td>{{ $row['due_date'] ?? '—' }}</td>
                    <td class="{{ $row['status'] }}">{{ $row['status_label'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="11" style="text-align:center; color:#6b7280;">No students found for selected filters.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <div class="footer">Generated on {{ now()->format('d M Y H:i') }}</div>
</body>
</html>
