<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Merit List - {{ $exam->name ?? 'Exam' }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #333; }
        .header { margin-bottom: 16px; border-bottom: 2px solid #d97706; padding-bottom: 10px; text-align: center; }
        .title { font-size: 16px; font-weight: bold; color: #92400e; }
        .subtitle { font-size: 11px; color: #666; margin-top: 4px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th, td { border: 1px solid #e5e7eb; padding: 6px 8px; text-align: left; }
        th { background: #f9fafb; font-weight: 600; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .position { font-weight: 600; color: #b45309; }
    </style>
</head>
<body>
    <div class="header">
        <div class="title">Merit List</div>
        <div class="subtitle">{{ $exam->name ?? 'Exam' }} · {{ $exam->examType->name ?? '' }} · {{ $classLabel }}</div>
        @if($exam->academicSession)
            <div class="subtitle">{{ $exam->academicSession->name }}</div>
        @endif
    </div>
    <table>
        <thead>
            <tr>
                <th class="text-center" style="width: 60px;">Position</th>
                <th>Roll No</th>
                <th>Student Name</th>
                <th class="text-right">Total</th>
                <th class="text-right">Obtained</th>
                <th class="text-right">Percentage</th>
                <th class="text-center">Grade</th>
            </tr>
        </thead>
        <tbody>
            @foreach($results as $index => $r)
                @php
                    $en = $r->studentEnrollment ?? $r->student_enrollment;
                    $student = $en->student ?? null;
                    $name = '—';
                    if ($student) {
                        $name = ($student->user && $student->user->name)
                            ? $student->user->name
                            : (trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) ?: '—');
                    }
                @endphp
                <tr>
                    <td class="text-center position">{{ $r->position ?? ($index + 1) }}</td>
                    <td>{{ $en->roll_number ?? '—' }}</td>
                    <td>{{ $name }}</td>
                    <td class="text-right">{{ $r->total_marks }}</td>
                    <td class="text-right">{{ $r->obtained_marks }}</td>
                    <td class="text-right">{{ $r->percentage }}%</td>
                    <td class="text-center">{{ $r->grade ?? '—' }}</td>
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
