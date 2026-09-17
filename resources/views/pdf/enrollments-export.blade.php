<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Enrollments Report</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 10px; color: #333; }
        .header { margin-bottom: 12px; border-bottom: 2px solid #d97706; padding-bottom: 8px; text-align: center; }
        .logo { max-height: 50px; max-width: 160px; display: block; margin-left: auto; margin-right: auto; }
        .school-name { font-size: 16px; font-weight: bold; color: #92400e; margin-top: 2px; }
        .subtitle { font-size: 11px; color: #6b7280; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 9px; }
        th, td { border: 1px solid #e5e7eb; padding: 4px 6px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .muted { color: #6b7280; }
        .footer { margin-top: 12px; font-size: 8px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        @if(!empty($logoPath))
            <img src="{{ $logoPath }}" class="logo" alt="Logo" />
        @endif
        <div class="school-name">{{ $schoolName }}</div>
        <div class="subtitle">
            Student Enrollments
            · {{ count($enrollments) }} record(s)
            @if(!empty($selectedCount)) · Selected: {{ $selectedCount }} @endif
            · Generated {{ now()->format('d M Y H:i') }}
        </div>
        @php
            $hasFilters = !empty($filters['search']) || !empty($filters['class_section_group_id']) || !empty($filters['status']);
        @endphp
        @if($hasFilters)
            <div class="subtitle muted">
                Filters:
                @if(!empty($filters['search'])) Search: "{{ $filters['search'] }}" @endif
                @if(!empty($filters['class_section_group_id'])) · Group ID: {{ $filters['class_section_group_id'] }} @endif
                @if(!empty($filters['status'])) · Status: {{ strtoupper($filters['status']) }} @endif
            </div>
        @endif
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Student</th>
                <th>Admission No</th>
                <th>Class · Section · Group</th>
                <th>Roll No</th>
                <th>Admission Date</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($enrollments as $idx => $en)
                @php
                    $student = $en->student;
                    $user = $student?->user;
                    $csg = $en->classSectionGroup;
                    $cs = $csg?->classSection;
                    $session = $cs?->academicSession?->name ?? '';
                    $cls = $cs?->class?->name ?? '';
                    $sec = $cs?->section?->name ?? '';
                    $grp = $csg?->subjectGroup?->name ?? '';
                    $groupLabel = collect([$session, $cls, $sec, $grp])->filter()->implode(' · ');
                    $name = trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? ''));
                    if ($name === '') $name = $user?->name ?? '—';
                @endphp
                <tr>
                    <td>{{ $idx + 1 }}</td>
                    <td>{{ $name }}</td>
                    <td>{{ $student?->admission_number ?? '—' }}</td>
                    <td>{{ $groupLabel ?: '—' }}</td>
                    <td>{{ $en->roll_number ?? '—' }}</td>
                    <td>{{ $en->admission_date?->format('d M Y') ?? '—' }}</td>
                    <td>{{ strtoupper($en->status ?? '—') }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Total: {{ count($enrollments) }} enrollment(s)
    </div>
</body>
</html>

