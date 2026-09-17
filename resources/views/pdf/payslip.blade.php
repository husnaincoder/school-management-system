<!DOCTYPE html>
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>Salary Slip - {{ $employeeName }}</title>
    <style>
        /* A4 = 210mm. Left 8mm + right 10mm => content ~192mm (slightly more right padding). */
        @page {
            size: A4 portrait;
            margin: 8mm 10mm 8mm 8mm;
        }

        * { box-sizing: border-box; }

        html, body {
            margin: 0;
            padding: 0;
            width: 192mm;
        }

        body {
            font-family: DejaVu Sans, sans-serif;
            font-size: 11px;
            color: #111;
            background: #fff;
        }

        .slip {
            width: 192mm;
            border: 1.5px solid #222;
            padding: 12px 14px 14px 14px;
            position: relative;
            min-height: 270mm;
        }

        .content { position: relative; z-index: 1; width: 100%; }

        .header {
            text-align: center;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1.5px solid #222;
            width: 100%;
        }
        .header-logo {
            max-height: 72px;
            max-width: 160px;
            display: block;
            margin: 0 auto 6px auto;
        }
        .school-name {
            font-size: 18px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            line-height: 1.2;
        }
        .school-address {
            font-size: 10px;
            color: #333;
            margin-top: 3px;
        }
        .doc-title {
            margin-top: 8px;
            font-size: 16px;
            font-weight: bold;
            text-decoration: underline;
            letter-spacing: 1px;
        }

        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 12px 0 10px;
            table-layout: fixed;
        }
        .info-table td {
            border: none;
            vertical-align: top;
            padding: 3px 10px 3px 4px;
            font-size: 11px;
            width: 50%;
        }
        .info-label { font-weight: bold; }

        .attendance-title {
            margin: 12px 0 4px;
            font-size: 11px;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.4px;
        }
        .att-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
            table-layout: fixed;
        }
        .att-table td {
            border: 1px solid #ccc;
            padding: 5px 8px;
            width: 25%;
            font-size: 10px;
        }
        .att-label { color: #444; }

        .table-wrap {
            position: relative;
            margin-top: 4px;
            min-height: 180px;
            width: 100%;
        }
        .table-watermark {
            position: absolute;
            top: 30px;
            left: 50%;
            width: 260px;
            height: 260px;
            margin-left: -130px;
            opacity: 0.14;
            z-index: 0;
        }

        .pay-table {
            width: 100%;
            border-collapse: collapse;
            position: relative;
            z-index: 1;
            background: transparent;
            table-layout: fixed;
        }
        .pay-table th,
        .pay-table td {
            border: 1px solid #222;
            padding: 6px 10px;
            vertical-align: top;
        }
        .pay-table th {
            background: #f3f4f6;
            font-weight: bold;
            text-align: center;
            font-size: 11px;
        }
        .col-name { width: 30%; }
        .col-amt { width: 20%; text-align: right; }
        .text-right { text-align: right; }
        .totals-row td { font-weight: bold; background: #fafafa; }
        .net-row td {
            font-weight: bold;
            background: #fef3c7;
            font-size: 12px;
        }

        .net-block {
            margin-top: 12px;
            text-align: center;
            width: 100%;
        }
        .net-number {
            font-size: 20px;
            font-weight: bold;
            letter-spacing: 0.5px;
        }
        .net-words {
            margin-top: 4px;
            font-size: 11px;
            font-style: italic;
            color: #222;
        }

        .sign-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 36px;
            table-layout: fixed;
        }
        .sign-table td {
            border: none;
            width: 50%;
            text-align: center;
            padding: 0 20px;
            font-size: 11px;
        }
        .sign-line {
            border-top: 1px solid #222;
            margin: 0 auto 6px;
            width: 70%;
            height: 1px;
        }

        .footer-note {
            margin-top: 22px;
            text-align: center;
            font-size: 9px;
            color: #555;
            width: 100%;
        }
    </style>
</head>
<body>
@php
    $allowances = $items->where('type', 'allowance')->values();
    $deductions = $items->where('type', 'deduction')->values();
    $rows = max($allowances->count() + 1, $deductions->count(), 1);
    $totalEarnings = (float) $payroll->basic_salary + (float) $payroll->total_allowances;
    $totalDeductions = (float) $payroll->total_deductions;
    $monthLabel = \Carbon\Carbon::createFromDate((int) $payroll->year, (int) $payroll->month, 1)->format('F Y');
@endphp

<div class="slip">
    <div class="content">
        <div class="header">
            @if(!empty($logoSrc))
                <img src="{{ $logoSrc }}" class="header-logo" alt="Logo" />
            @endif
            <div class="school-name">{{ $schoolName ?? config('app.name', 'School') }}</div>
            @if(!empty($schoolAddress))
                <div class="school-address">{{ $schoolAddress }}</div>
            @endif
            <div class="doc-title">Payslip</div>
        </div>

        <table class="info-table" width="100%">
            <tr>
                <td width="50%"><span class="info-label">Date of Joining</span> : {{ $joiningDate ?? '—' }}</td>
                <td width="50%"><span class="info-label">Employee Name</span> : {{ $employeeName }}</td>
            </tr>
            <tr>
                <td><span class="info-label">Pay Period</span> : {{ $monthLabel }}</td>
                <td><span class="info-label">Designation</span> : {{ $designation ?? ($staffType ?? '—') }}</td>
            </tr>
            <tr>
                <td><span class="info-label">Worked Days</span> : {{ $attendance['present_days'] ?? 0 }} / {{ $attendance['working_days'] ?? 0 }}</td>
                <td><span class="info-label">Department</span> : {{ $department ?? '—' }}</td>
            </tr>
            <tr>
                <td><span class="info-label">Staff ID</span> : {{ $employeeId ?: '—' }}</td>
                <td><span class="info-label">Status</span> : {{ ucfirst($status ?? $payroll->status ?? 'generated') }}</td>
            </tr>
        </table>

        <div class="attendance-title">Attendance Summary</div>
        <table class="att-table" width="100%">
            <tr>
                <td width="25%"><span class="att-label">Working</span><br><strong>{{ $attendance['working_days'] ?? 0 }}</strong></td>
                <td width="25%"><span class="att-label">Present</span><br><strong>{{ $attendance['present_days'] ?? 0 }}</strong></td>
                <td width="25%"><span class="att-label">Absent</span><br><strong>{{ $attendance['absent_days'] ?? 0 }}</strong></td>
                <td width="25%"><span class="att-label">Late</span><br><strong>{{ $attendance['late_days'] ?? 0 }}</strong></td>
            </tr>
            <tr>
                <td><span class="att-label">Paid Leave</span><br><strong>{{ $attendance['paid_leave_days'] ?? 0 }}</strong></td>
                <td><span class="att-label">Unpaid Leave</span><br><strong>{{ $attendance['unpaid_leave_days'] ?? 0 }}</strong></td>
                <td><span class="att-label">Overtime Hours</span><br><strong>{{ number_format($attendance['overtime_hours'] ?? 0, 2) }}</strong></td>
                <td><span class="att-label">Leave Deduction</span><br><strong>{{ number_format($payroll->leave_deduction_amount ?? 0, 2) }}</strong></td>
            </tr>
        </table>

        <div class="table-wrap">
            @if(!empty($logoSrc))
                <img src="{{ $logoSrc }}" class="table-watermark" alt="" />
            @endif

            <table class="pay-table" width="100%">
                <thead>
                    <tr>
                        <th class="col-name" width="30%">Earnings</th>
                        <th class="col-amt" width="20%">Amount</th>
                        <th class="col-name" width="30%">Deductions</th>
                        <th class="col-amt" width="20%">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    @for($i = 0; $i < $rows; $i++)
                        @php
                            if ($i === 0) {
                                $earnName = 'Basic Salary';
                                $earnAmt = (float) $payroll->basic_salary;
                            } else {
                                $allow = $allowances->get($i - 1);
                                $earnName = $allow?->name;
                                $earnAmt = $allow ? (float) $allow->amount : null;
                            }
                            $ded = $deductions->get($i);
                            $dedName = $ded?->name;
                            $dedAmt = $ded ? (float) $ded->amount : null;
                        @endphp
                        <tr>
                            <td>{{ $earnName ?? '' }}</td>
                            <td class="text-right">{{ $earnAmt !== null ? number_format($earnAmt, 2) : '' }}</td>
                            <td>{{ $dedName ?? '' }}</td>
                            <td class="text-right">{{ $dedAmt !== null ? number_format($dedAmt, 2) : '' }}</td>
                        </tr>
                    @endfor
                    <tr class="totals-row">
                        <td>Total Earnings</td>
                        <td class="text-right">{{ number_format($totalEarnings, 2) }}</td>
                        <td>Total Deductions</td>
                        <td class="text-right">{{ number_format($totalDeductions, 2) }}</td>
                    </tr>
                    <tr class="net-row">
                        <td colspan="3" class="text-right">Net Pay</td>
                        <td class="text-right">{{ number_format((float) $payroll->net_salary, 2) }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="net-block">
            <div class="net-number">{{ number_format((float) $payroll->net_salary, 2) }}</div>
            <div class="net-words">{{ $amountInWords ?? '' }}</div>
        </div>

        <table class="sign-table" width="100%">
            <tr>
                <td width="50%">
                    <div class="sign-line"></div>
                    Employer Signature
                </td>
                <td width="50%">
                    <div class="sign-line"></div>
                    Employee Signature
                </td>
            </tr>
        </table>

        <div class="footer-note">This is a system generated payslip</div>
    </div>
</div>
</body>
</html>
