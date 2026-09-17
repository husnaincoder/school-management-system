<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Date Sheet — {{ $exam->name }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #1f2937; }
        .header { text-align: center; margin-bottom: 18px; }
        .header img { max-height: 56px; margin-bottom: 6px; }
        .school { font-size: 18px; font-weight: bold; color: #b45309; }
        .title { font-size: 15px; font-weight: bold; margin-top: 8px; }
        .meta { color: #4b5563; margin-top: 4px; font-size: 11px; }
        table { width: 100%; border-collapse: collapse; margin-top: 14px; }
        th, td { border: 1px solid #d1d5db; padding: 7px 8px; text-align: left; }
        th { background: #fff7ed; color: #92400e; font-size: 10px; text-transform: uppercase; }
        .note { margin-top: 14px; font-size: 10px; color: #6b7280; }
        .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: center; }
    </style>
</head>
<body>
    <div class="header">
        @if (!empty($logoSrc))
            <img src="{{ $logoSrc }}" alt="Logo">
        @endif
        <div class="school">{{ $schoolName }}</div>
        <div class="title">Examination Date Sheet</div>
        <div class="meta">
            {{ $exam->name }}
            @if ($exam->examType) — {{ $exam->examType->name }} @endif
            <br>
            {{ $exam->academicSession?->name ?? '' }}
            @if ($classLabel) · {{ $classLabel }} @endif
            <br>
            {{ optional($exam->start_date)->format('d M Y') }} – {{ optional($exam->end_date)->format('d M Y') }}
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Subject</th>
                <th>Time</th>
                <th>Room</th>
                <th>Subject Teacher</th>
                <th>Invigilator</th>
                <th>Marks</th>
            </tr>
        </thead>
        <tbody>
            @forelse ($rows as $i => $row)
                <tr>
                    <td>{{ $i + 1 }}</td>
                    <td>
                        @if (!empty($row['exam_date']))
                            {{ \Carbon\Carbon::parse($row['exam_date'])->format('d M Y') }}
                        @else
                            —
                        @endif
                    </td>
                    <td>{{ $row['subject_name'] }}</td>
                    <td>
                        @if (!empty($row['start_time']) || !empty($row['end_time']))
                            {{ $row['start_time'] ?? '—' }} – {{ $row['end_time'] ?? '—' }}
                        @else
                            —
                        @endif
                    </td>
                    <td>{{ $row['room'] ?: '—' }}</td>
                    <td>{{ $row['subject_teacher_name'] ?: '—' }}</td>
                    <td>{{ $row['invigilator_name'] ?: '—' }}</td>
                    <td>{{ $row['total_marks'] }} / Pass {{ $row['passing_marks'] }}</td>
                </tr>
            @empty
                <tr>
                    <td colspan="8" style="text-align:center;">No subjects on date sheet.</td>
                </tr>
            @endforelse
        </tbody>
    </table>

    <p class="note">
        Subject Teacher = class subject assignment teacher.
        Invigilator = exam hall supervisor (may be different).
    </p>
    <div class="footer">Generated on {{ now()->format('d M Y H:i') }}</div>
</body>
</html>
