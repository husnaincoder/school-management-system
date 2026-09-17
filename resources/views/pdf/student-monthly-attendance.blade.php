<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Monthly Attendance - {{ $studentName }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #222; margin: 0; padding: 0; }
        .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 10px; margin-bottom: 14px; }
        .logo { max-height: 60px; max-width: 150px; display: block; margin: 0 auto 6px auto; }
        .school-name { font-size: 18px; font-weight: bold; color: #92400e; margin: 0; }
        .title { font-size: 13px; color: #374151; margin-top: 4px; }
        .meta { margin-bottom: 12px; }
        .meta table { width: 100%; border-collapse: collapse; }
        .meta td { padding: 3px 0; vertical-align: top; }
        .meta .label { width: 28%; color: #6b7280; }
        .summary { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
        .summary th, .summary td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: center; }
        .summary th { background: #fff7ed; font-size: 10px; color: #92400e; }
        .summary td { font-weight: bold; font-size: 13px; }
        .present { color: #15803d; }
        .absent { color: #b91c1c; }
        .late { color: #d97706; }
        .leave { color: #4b5563; }
        table.days { width: 100%; border-collapse: collapse; font-size: 10px; }
        table.days th, table.days td { border: 1px solid #e5e7eb; padding: 5px 6px; text-align: left; }
        table.days th { background: #f9fafb; font-weight: 600; }
        .badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-size: 9px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-present { background: #dcfce7; color: #166534; }
        .badge-absent { background: #fee2e2; color: #991b1b; }
        .badge-late { background: #ffedd5; color: #9a3412; }
        .badge-leave { background: #f3f4f6; color: #374151; }
        .footer { margin-top: 14px; font-size: 8px; color: #9ca3af; text-align: center; }
        .empty { color: #6b7280; font-style: italic; padding: 12px 0; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoSrc))
            <img src="{{ $logoSrc }}" class="logo" alt="Logo" />
        @endif
        <p class="school-name">{{ $schoolName }}</p>
        <div class="title">Student Monthly Attendance Report</div>
    </div>

    <div class="meta">
        <table>
            <tr>
                <td class="label">Student</td>
                <td><strong>{{ $studentName }}</strong></td>
            </tr>
            <tr>
                <td class="label">Roll No</td>
                <td>{{ $rollNumber }}</td>
            </tr>
            <tr>
                <td class="label">Class</td>
                <td>{{ $classLabel }}</td>
            </tr>
            <tr>
                <td class="label">Month</td>
                <td><strong>{{ $report['month_label'] }}</strong></td>
            </tr>
        </table>
    </div>

    <table class="summary">
        <thead>
            <tr>
                <th>Total</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Late</th>
                <th>Leave</th>
                <th>%</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>{{ $report['total'] }}</td>
                <td class="present">{{ $report['present'] }}</td>
                <td class="absent">{{ $report['absent'] }}</td>
                <td class="late">{{ $report['late'] }}</td>
                <td class="leave">{{ $report['leave'] }}</td>
                <td>{{ $report['percentage'] }}%</td>
            </tr>
        </tbody>
    </table>

    <h3 style="font-size: 12px; margin: 0 0 8px 0;">Date-wise Attendance</h3>

    @if(empty($report['days']))
        <p class="empty">No attendance records found for this month.</p>
    @else
        <table class="days">
            <thead>
                <tr>
                    <th style="width: 8%;">#</th>
                    <th style="width: 22%;">Date</th>
                    <th style="width: 18%;">Day</th>
                    <th style="width: 18%;">Status</th>
                    <th>Remarks</th>
                </tr>
            </thead>
            <tbody>
                @foreach($report['days'] as $idx => $day)
                    @php
                        $status = $day['status'] ?? '';
                        $badgeClass = match ($status) {
                            'present' => 'badge-present',
                            'absent' => 'badge-absent',
                            'late' => 'badge-late',
                            'leave' => 'badge-leave',
                            default => 'badge-leave',
                        };
                    @endphp
                    <tr>
                        <td>{{ $idx + 1 }}</td>
                        <td>{{ $day['date_label'] }}</td>
                        <td>{{ $day['day_name'] }}</td>
                        <td>
                            <span class="badge {{ $badgeClass }}">{{ $day['status_label'] }}</span>
                        </td>
                        <td>{{ $day['remarks'] ?: '—' }}</td>
                    </tr>
                @endforeach
            </tbody>
        </table>
    @endif

    <div class="footer">
        Generated {{ now()->format('d M Y H:i') }} · {{ $schoolName }}
    </div>
</body>
</html>
