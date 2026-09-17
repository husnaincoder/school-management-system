<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Class Students</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #333; }
        .header { margin-bottom: 12px; border-bottom: 2px solid #d97706; padding-bottom: 8px; text-align: center; }
        .logo { max-height: 50px; max-width: 160px; display: block; margin-left: auto; margin-right: auto; }
        .school-name { font-size: 16px; font-weight: bold; color: #92400e; margin-top: 2px; }
        .subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9px; }
        th, td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .footer { margin-top: 12px; font-size: 8px; color: #9ca3af; text-align: center; }
        .muted { color: #6b7280; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoSrc))
            <img src="{{ $logoSrc }}" class="logo" alt="Logo" />
        @endif
        <div class="school-name">{{ $schoolName }}</div>
        @php
            $hasFilterLabels = !empty($filterLabels['session']) || !empty($filterLabels['class']) || !empty($filterLabels['section']);
        @endphp
        @if($hasFilterLabels)
            <div class="subtitle" style="margin-top: 6px; font-size: 11px; color: #374151;">
                @if(!empty($filterLabels['session']))
                    <strong>Session:</strong> {{ $filterLabels['session'] }}
                @endif
                @if(!empty($filterLabels['class']))
                    @if(!empty($filterLabels['session'])) · @endif
                    <strong>Class:</strong> {{ $filterLabels['class'] }}
                @endif
                @if(!empty($filterLabels['section']))
                    @if(!empty($filterLabels['session']) || !empty($filterLabels['class'])) · @endif
                    <strong>Section:</strong> {{ $filterLabels['section'] }}
                @endif
            </div>
        @endif
        <div class="subtitle">
            Class Students · {{ count($rows) }} record(s)
            @if(!empty($selectedCount)) · Selected: {{ $selectedCount }} @endif
            · Generated {{ now()->format('d M Y H:i') }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Admission No</th>
                <th>Roll No</th>
                <th>Student</th>
                <th>Session</th>
                <th>Class</th>
                <th>Section</th>
                <th>Father</th>
                <th>DOB</th>
                <th>Gender</th>
                <th>Father Mobile</th>
            </tr>
        </thead>
        <tbody>
            @foreach($rows as $idx => $en)
                @php
                    $student = $en->student;
                    $parentUser = $student?->parent?->user;
                    $cs = $en->classSectionGroup?->classSection;
                    $name = $student?->full_name ?? ($student?->user?->name ?? '—');
                @endphp
                <tr>
                    <td>{{ $idx + 1 }}</td>
                    <td>{{ $student?->admission_number ?? '—' }}</td>
                    <td>{{ $en->roll_number ?? '—' }}</td>
                    <td>{{ $name }}</td>
                    <td>{{ $cs?->academicSession?->name ?? '—' }}</td>
                    <td>{{ $cs?->class?->name ?? '—' }}</td>
                    <td>{{ $cs?->section?->name ?? '—' }}</td>
                    <td>{{ $parentUser?->name ?? '—' }}</td>
                    <td>{{ $student?->date_of_birth?->format('d M Y') ?? '—' }}</td>
                    <td>{{ $student?->gender ? ucfirst($student->gender) : '—' }}</td>
                    <td>{{ $parentUser?->phone ?? '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">Total: {{ count($rows) }} student(s)</div>
</body>
</html>

