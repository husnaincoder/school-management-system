<?php

namespace App\Services\Timetable;

use App\Models\ClassRoom;
use App\Models\ClassSectionGroupSubject;
use App\Models\TeacherAvailability;
use App\Models\TimeSlot;
use App\Models\Timetable;
use App\Models\TimetableEnter;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class TimetableConflictService
{
    /**
     * Validate a full set of timetable entries (grid save).
     * Same-timetable uniqueness is checked in-batch; DB checks are against other timetables only.
     *
     * @param  list<array{day:string,time_slot_id:int,class_section_group_subject_id?:int|null,teacher_id?:int|null,class_room_id?:int|null,id?:int|null}>  $entries
     * @return list<string>
     */
    public function validateEntries(Timetable $timetable, array $entries): array
    {
        $errors = [];
        $slotIds = collect($entries)->pluck('time_slot_id')->filter()->unique()->values();
        $slots = TimeSlot::query()->whereIn('id', $slotIds)->get()->keyBy('id');

        $teacherNames = [];
        $roomNames = [];

        $seenClassSlots = [];
        $seenTeacherSlots = [];
        $seenRoomSlots = [];

        $assignedEntries = [];
        foreach ($entries as $entry) {
            $subjectId = (int) ($entry['class_section_group_subject_id'] ?? 0);
            if ($subjectId <= 0) {
                continue;
            }
            $assignedEntries[] = $entry;
        }

        foreach ($assignedEntries as $entry) {
            $day = (string) ($entry['day'] ?? '');
            $slotId = (int) ($entry['time_slot_id'] ?? 0);
            $teacherId = ! empty($entry['teacher_id']) ? (int) $entry['teacher_id'] : null;
            $roomId = ! empty($entry['class_room_id']) ? (int) $entry['class_room_id'] : null;

            $slot = $slots->get($slotId);
            $slotLabel = $slot?->name ?: ('Slot #'.$slotId);
            $dayLabel = ucfirst($day);
            $slotType = $slot?->slot_type ?? ($slot?->is_break ? 'break' : 'period');

            if ($slot && in_array($slotType, ['break', 'lunch', 'assembly'], true) || ($slot && $slot->is_break)) {
                if (in_array($slotType, ['break', 'lunch'], true) || $slot->is_break) {
                    $errors[] = "{$dayLabel} {$slotLabel}: break/lunch slots cannot have class assignments.";
                    continue;
                }
            }

            $classKey = "{$day}|{$slotId}";
            if (isset($seenClassSlots[$classKey])) {
                $errors[] = "Class conflict: this class already has a subject on {$dayLabel}, {$slotLabel}.";
            } else {
                $seenClassSlots[$classKey] = true;
            }

            if ($teacherId) {
                $teacherKey = "{$teacherId}|{$day}|{$slotId}";
                if (isset($seenTeacherSlots[$teacherKey])) {
                    $name = $this->teacherName($teacherId, $teacherNames);
                    $errors[] = "Teacher conflict: {$name} is assigned twice on {$dayLabel}, {$slotLabel}.";
                } else {
                    $seenTeacherSlots[$teacherKey] = true;
                }

                $teacherBusy = TimetableEnter::query()
                    ->with([
                        'timetable.classSectionGroup.classSection.class',
                        'timetable.classSectionGroup.classSection.section',
                        'teacher.user',
                    ])
                    ->where('teacher_id', $teacherId)
                    ->where('day', $day)
                    ->where('time_slot_id', $slotId)
                    ->where('timetable_id', '!=', $timetable->id)
                    ->first();

                if ($teacherBusy) {
                    $name = $teacherBusy->teacher?->user?->name
                        ?? $this->teacherName($teacherId, $teacherNames);
                    $className = $this->formatClassName($teacherBusy);
                    $errors[] = "Teacher conflict: {$name} is already assigned to {$className} on {$dayLabel}, {$slotLabel}.";
                }

                if ($this->teacherUnavailable($teacherId, $day, $slotId)) {
                    $name = $this->teacherName($teacherId, $teacherNames);
                    $errors[] = "Teacher unavailable: {$name} is marked unavailable on {$dayLabel}, {$slotLabel}.";
                }
            }

            if ($roomId) {
                $roomKey = "{$roomId}|{$day}|{$slotId}";
                if (isset($seenRoomSlots[$roomKey])) {
                    $roomName = $this->roomName($roomId, $roomNames);
                    $errors[] = "Room conflict: {$roomName} is assigned twice on {$dayLabel}, {$slotLabel}.";
                } else {
                    $seenRoomSlots[$roomKey] = true;
                }

                $roomBusy = TimetableEnter::query()
                    ->with([
                        'timetable.classSectionGroup.classSection.class',
                        'timetable.classSectionGroup.classSection.section',
                    ])
                    ->where('class_room_id', $roomId)
                    ->where('day', $day)
                    ->where('time_slot_id', $slotId)
                    ->where('timetable_id', '!=', $timetable->id)
                    ->first();

                if ($roomBusy) {
                    $roomName = $this->roomName($roomId, $roomNames);
                    $className = $this->formatClassName($roomBusy);
                    $errors[] = "Room conflict: {$roomName} is already occupied by {$className} on {$dayLabel}, {$slotLabel}.";
                }
            }
        }

        return array_values(array_unique($errors));
    }

    public function assertEntriesValid(Timetable $timetable, array $entries): void
    {
        $errors = $this->validateEntries($timetable, $entries);
        if ($errors !== []) {
            throw ValidationException::withMessages([
                'entries' => $errors,
            ]);
        }
    }

    public function teacherUnavailable(int $teacherId, string $day, int $timeSlotId): bool
    {
        $row = TeacherAvailability::query()
            ->where('teacher_id', $teacherId)
            ->where('day', $day)
            ->where('time_slot_id', $timeSlotId)
            ->first();

        return $row !== null && ! $row->is_available;
    }

    public function assertTimeSlotNoOverlap(string $start, string $end, ?int $ignoreId = null): void
    {
        $start = strlen($start) === 5 ? $start.':00' : $start;
        $end = strlen($end) === 5 ? $end.':00' : $end;

        $overlap = TimeSlot::query()
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->where('start_time', '<', $end)
            ->where('end_time', '>', $start)
            ->first();

        if ($overlap) {
            throw ValidationException::withMessages([
                'start_time' => "Time slot overlaps with {$overlap->name} (".$this->formatTime($overlap->start_time).' - '.$this->formatTime($overlap->end_time).').',
            ]);
        }
    }

    public function nextSlotOrder(): int
    {
        return ((int) TimeSlot::query()->max('slot_order')) + 1;
    }

    public function durationMinutes(string $start, string $end): int
    {
        $s = Carbon::createFromFormat('H:i:s', strlen($start) === 5 ? $start.':00' : $start);
        $e = Carbon::createFromFormat('H:i:s', strlen($end) === 5 ? $end.':00' : $end);

        return max(0, (int) $s->diffInMinutes($e));
    }

    /**
     * @return list<array{id:int,subject:string,required:int,assigned:int,remaining:int,complete:bool}>
     */
    public function subjectProgress(Timetable $timetable): array
    {
        $timetable->loadMissing(['timetableEnters']);
        $subjects = ClassSectionGroupSubject::with('subject')
            ->where('class_section_group_id', $timetable->class_section_group_id)
            ->get();

        $counts = $timetable->timetableEnters
            ->groupBy('class_section_group_subject_id')
            ->map->count();

        return $subjects->map(function ($csgs) use ($counts) {
            $required = (int) ($csgs->weekly_classes ?? 0);
            $assigned = (int) ($counts[$csgs->id] ?? 0);

            return [
                'id' => (int) $csgs->id,
                'subject' => $csgs->subject?->name ?? 'Subject',
                'required' => $required,
                'assigned' => $assigned,
                'remaining' => max(0, $required - $assigned),
                'complete' => $required <= 0 ? true : $assigned >= $required,
            ];
        })->values()->all();
    }

    /**
     * @return list<array{teacher_id:int,name:string,by_day:array<string,int>,total:int}>
     */
    public function teacherWorkload(Timetable $timetable): array
    {
        $timetable->loadMissing(['timetableEnters.teacher.user']);
        $byTeacher = [];

        foreach ($timetable->timetableEnters as $entry) {
            if (! $entry->teacher_id) {
                continue;
            }
            $id = (int) $entry->teacher_id;
            if (! isset($byTeacher[$id])) {
                $byTeacher[$id] = [
                    'teacher_id' => $id,
                    'name' => $entry->teacher?->user?->name ?? ('Teacher #'.$id),
                    'by_day' => array_fill_keys(TimetableEnter::DAYS, 0),
                    'total' => 0,
                ];
            }
            $byTeacher[$id]['by_day'][$entry->day] = ($byTeacher[$id]['by_day'][$entry->day] ?? 0) + 1;
            $byTeacher[$id]['total']++;
        }

        return array_values($byTeacher);
    }

    protected function formatClassName(TimetableEnter $entry): string
    {
        $entry->loadMissing(
            'timetable.classSectionGroup.classSection.class',
            'timetable.classSectionGroup.classSection.section'
        );
        $cs = $entry->timetable?->classSectionGroup?->classSection;
        $class = $cs?->class?->name ?? 'Class';
        $section = $cs?->section?->name ?? '';

        return trim($class.($section ? ' - '.$section : ''));
    }

    protected function formatTime(mixed $time): string
    {
        if (! $time) {
            return '—';
        }
        try {
            return Carbon::parse($time)->format('h:i A');
        } catch (\Throwable) {
            return (string) $time;
        }
    }

    /** @param array<int,string> $cache */
    protected function teacherName(int $id, array &$cache): string
    {
        if (! isset($cache[$id])) {
            $cache[$id] = \App\Models\Teacher::with('user:id,name')->find($id)?->user?->name
                ?? ('Teacher #'.$id);
        }

        return $cache[$id];
    }

    /** @param array<int,string> $cache */
    protected function roomName(int $id, array &$cache): string
    {
        if (! isset($cache[$id])) {
            $cache[$id] = ClassRoom::find($id)?->name ?? ('Room #'.$id);
        }

        return $cache[$id];
    }
}
