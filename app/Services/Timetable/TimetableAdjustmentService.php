<?php

namespace App\Services\Timetable;

use App\Models\Leave;
use App\Models\LeaveDay;
use App\Models\TimetableEnter;
use App\Models\TimetableAdjustment;
use App\Models\TeacherAvailability;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TimetableAdjustmentService
{
    /**
     * For an approved teacher leave: find affected timetable entries and create adjustments.
     * Handles half-day via leave_days.is_half_day (adjustment note); substitute/cancel/merge.
     * When $preferredSubstituteTeacherId is provided (from leave approval), use it for all entries; otherwise auto-find.
     */
    public function createAdjustmentsForTeacherLeave(Leave $leave, ?int $preferredSubstituteTeacherId = null): void
    {
        if (!$leave->teacher_id || $leave->status !== Leave::STATUS_APPROVED) {
            return;
        }

        $start = Carbon::parse($leave->start_date);
        $end = Carbon::parse($leave->end_date);
        $leaveDaysByDate = $leave->leaveDays->keyBy(fn ($d) => $d->leave_date->format('Y-m-d'));

        $created = 0;

        for ($date = $start->copy(); $date->lte($end); $date->addDay()) {
            $dateStr = $date->format('Y-m-d');
            $dayOfWeek = strtolower($date->format('l')); // monday, tuesday, ...

            if (!in_array($dayOfWeek, TimetableEnter::DAYS, true)) {
                continue;
            }

            $isHalfDay = isset($leaveDaysByDate[$dateStr]) && $leaveDaysByDate[$dateStr]->is_half_day;

            $entries = TimetableEnter::where('teacher_id', $leave->teacher_id)
                ->where('day', $dayOfWeek)
                ->with(['timeSlot', 'classRoom'])
                ->get();

            foreach ($entries as $entry) {
                $substituteTeacherId = $preferredSubstituteTeacherId && (int) $preferredSubstituteTeacherId !== (int) $leave->teacher_id
                    ? $preferredSubstituteTeacherId
                    : $this->findSubstitute($entry, $dayOfWeek, $leave->teacher_id);
                $action = $substituteTeacherId
                    ? TimetableAdjustment::ACTION_SUBSTITUTE
                    : TimetableAdjustment::ACTION_CANCEL;

                $note = $isHalfDay ? 'Half-day leave.' : null;
                if ($action === TimetableAdjustment::ACTION_CANCEL && $isHalfDay) {
                    $note = 'Half-day leave; class cancelled (no substitute).';
                }

                TimetableAdjustment::create([
                    'timetable_entry_id' => $entry->id,
                    'adjustment_date' => $dateStr,
                    'original_teacher_id' => $leave->teacher_id,
                    'substitute_teacher_id' => $substituteTeacherId,
                    'action' => $action,
                    'note' => $note,
                ]);
                $created++;
            }
        }

        if ($created > 0) {
            $this->notifyAffectedParties($leave, $created);
        }
    }

    /**
     * Find an available substitute for same day + time_slot (optional: same class_room).
     */
    protected function findSubstitute(TimetableEnter $entry, string $day, int $excludeTeacherId): ?int
    {
        $busyTeacherIds = TimetableEnter::query()
            ->where('day', $day)
            ->where('time_slot_id', $entry->time_slot_id)
            ->whereNotNull('teacher_id')
            ->pluck('teacher_id')
            ->all();

        $unavailableIds = TeacherAvailability::query()
            ->where('day', $day)
            ->where('time_slot_id', $entry->time_slot_id)
            ->where('is_available', false)
            ->pluck('teacher_id')
            ->all();

        $exclude = array_unique(array_merge([$excludeTeacherId], $busyTeacherIds, $unavailableIds));

        // Prefer teachers explicitly marked available for this slot.
        $av = TeacherAvailability::query()
            ->where('day', $day)
            ->where('time_slot_id', $entry->time_slot_id)
            ->where('is_available', true)
            ->whereNotIn('teacher_id', $exclude)
            ->first();

        return $av?->teacher_id;
    }

    /**
     * Placeholder: notify students/parents about cancelled or substituted classes.
     * Hook your notification channel here (email, SMS, in-app).
     */
    protected function notifyAffectedParties(Leave $leave, int $adjustmentCount): void
    {
        Log::info('Timetable adjustments created for teacher leave', [
            'leave_id' => $leave->id,
            'teacher_id' => $leave->teacher_id,
            'adjustments_count' => $adjustmentCount,
        ]);
        // TODO: Notify students/parents (e.g. Notification::send(...), or event + listener).
    }
}
