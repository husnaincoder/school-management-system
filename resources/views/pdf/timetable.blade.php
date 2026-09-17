<?php

use App\Models\TimeSlot;
use App\Models\TimetableEnter;

/** @var \App\Models\Timetable $timetable */
/** @var \Illuminate\Support\Collection $timeSlots */
/** @var array $days */
/** @var array $grid */
$class = $timetable->classSectionGroup?->classSection;
$classLabel = trim(($class?->class?->name ?? '').' - '.($class?->section?->name ?? ''));
$sessionName = $timetable->academicSession?->name ?? '';
$title = $timetable->name ?: $classLabel;
?>
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Timetable - {{ $title }}</title>
    <style>
        body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111; }
        h1 { font-size: 18px; margin: 0 0 4px; text-align: center; }
        h2 { font-size: 13px; margin: 0 0 12px; text-align: center; font-weight: normal; color: #444; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 6px 4px; vertical-align: top; }
        th { background: #f3f3f3; font-size: 10px; text-transform: uppercase; }
        .slot { width: 90px; font-weight: bold; background: #fafafa; }
        .break { background: #fff7e6; text-align: center; font-style: italic; color: #666; }
        .sub { display: block; font-weight: bold; }
        .meta { display: block; color: #444; font-size: 9px; margin-top: 2px; }
    </style>
</head>
<body>
    <h1>Weekly Class Timetable</h1>
    <h2>{{ $title }} · {{ $sessionName }}</h2>
    <table>
        <thead>
            <tr>
                <th>Time</th>
                @foreach ($days as $day)
                    <th>{{ ucfirst($day) }}</th>
                @endforeach
            </tr>
        </thead>
        <tbody>
            @foreach ($timeSlots as $slot)
                @php
                    $isBreak = $slot->is_break || in_array($slot->slot_type ?? '', ['break', 'lunch'], true);
                @endphp
                <tr>
                    <td class="slot">
                        {{ $slot->name }}<br>
                        <span style="font-weight:normal;font-size:9px;">{{ $slot->time_range_label }}</span>
                    </td>
                    @foreach ($days as $day)
                        @if ($isBreak)
                            <td class="break">{{ strtoupper($slot->slot_type ?? 'break') }}</td>
                        @else
                            @php $e = $grid[$slot->id][$day] ?? null; @endphp
                            <td>
                                @if ($e)
                                    <span class="sub">{{ $e->classSectionGroupSubject?->subject?->name ?? '—' }}</span>
                                    <span class="meta">{{ $e->teacher?->user?->name ?? '—' }}</span>
                                    <span class="meta">{{ $e->classRoom?->name ?? '—' }}</span>
                                @else
                                    —
                                @endif
                            </td>
                        @endif
                    @endforeach
                </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
