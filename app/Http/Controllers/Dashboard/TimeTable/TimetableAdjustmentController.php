<?php

namespace App\Http\Controllers\Dashboard\TimeTable;

use App\Http\Controllers\Controller;
use App\Models\TimetableAdjustment;
use App\Models\TimetableEnter;
use App\Models\Teacher;
use Carbon\Carbon;
use Illuminate\Http\Request;

class TimetableAdjustmentController extends Controller
{
    public function index(Request $request)
    {
        $query = TimetableAdjustment::with([
            'timetableEnter.timetable.classSectionGroup.classSection.class',
            'timetableEnter.timetable.classSectionGroup.classSection.section',
            'timetableEnter.timeSlot',
            'timetableEnter.classSectionGroupSubject.subject',
            'originalTeacher.user',
            'substituteTeacher.user',
            'mergedIntoTimetableEnter.timeSlot',
            'mergedIntoTimetableEnter.classSectionGroupSubject.subject',
        ]);
        if ($request->filled('adjustment_date')) {
            $query->whereDate('adjustment_date', $request->adjustment_date);
        }
        if ($request->filled('original_teacher_id')) {
            $query->where('original_teacher_id', $request->original_teacher_id);
        }
        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        $adjustments = $query->orderBy('adjustment_date')->orderBy('id')->get();

        $dayOfWeek = fn ($date) => strtolower(Carbon::parse($date)->format('l'));
        $adjustments->each(function (TimetableAdjustment $adj) use ($dayOfWeek) {
            $te = $adj->timetableEnter;
            if (!$te) {
                $adj->merge_target_options = [];
                return;
            }
            $day = $dayOfWeek($adj->adjustment_date);
            $options = TimetableEnter::with(['timeSlot', 'classSectionGroupSubject.subject'])
                ->where('timetable_id', $te->timetable_id)
                ->where('day', $day)
                ->where('id', '!=', $adj->timetable_entry_id)
                ->orderBy('time_slot_id')
                ->get()
                ->map(function (TimetableEnter $entry) {
                    $slot = $entry->timeSlot;
                    $sub = $entry->classSectionGroupSubject?->subject;
                    $slotName = $slot?->name ?? 'Slot #' . $entry->time_slot_id;
                    $subjectName = $sub?->name ?? '—';
                    return ['id' => $entry->id, 'label' => $slotName . ' – ' . $subjectName];
                })
                ->values()
                ->toArray();
            $adj->merge_target_options = $options;
        });

        $teachers = Teacher::with('user:id,name')->get()->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name ?? 'Teacher #' . $t->id]);

        $adjustmentsForFrontend = $adjustments->map(function (TimetableAdjustment $adj) {
            $arr = $adj->toArray();
            $arr['merge_target_options'] = $adj->merge_target_options ?? [];
            return $arr;
        });

        return inertia('dashboard/academic/TimetableAdjustments', [
            'adjustments' => $adjustmentsForFrontend,
            'teachers' => $teachers,
            'filterDate' => $request->adjustment_date,
            'filterTeacherId' => $request->original_teacher_id,
            'filterAction' => $request->action,
        ]);
    }

    public function update(Request $request, TimetableAdjustment $timetableAdjustment)
    {
        $validated = $request->validate([
            'substitute_teacher_id' => ['nullable', 'exists:teachers,id'],
            'merged_into_timetable_entry_id' => ['nullable', 'exists:timetable_enters,id'],
            'action' => ['nullable', 'in:substitute,cancel,merge'],
            'note' => ['nullable', 'string', 'max:1000'],
        ]);

        if (array_key_exists('action', $validated)) {
            $timetableAdjustment->action = $validated['action'];
            if ($validated['action'] === TimetableAdjustment::ACTION_MERGE) {
                $timetableAdjustment->substitute_teacher_id = null;
            } elseif ($validated['action'] === TimetableAdjustment::ACTION_SUBSTITUTE) {
                $timetableAdjustment->merged_into_timetable_entry_id = null;
            } elseif ($validated['action'] === TimetableAdjustment::ACTION_CANCEL) {
                $timetableAdjustment->substitute_teacher_id = null;
                $timetableAdjustment->merged_into_timetable_entry_id = null;
            }
        }
        if (array_key_exists('substitute_teacher_id', $validated)) {
            $timetableAdjustment->substitute_teacher_id = $validated['substitute_teacher_id'] ?: null;
            if ($timetableAdjustment->substitute_teacher_id) {
                $timetableAdjustment->action = TimetableAdjustment::ACTION_SUBSTITUTE;
                $timetableAdjustment->merged_into_timetable_entry_id = null;
            }
        }
        if (array_key_exists('merged_into_timetable_entry_id', $validated)) {
            $timetableAdjustment->merged_into_timetable_entry_id = $validated['merged_into_timetable_entry_id'] ?: null;
            if ($timetableAdjustment->merged_into_timetable_entry_id) {
                $timetableAdjustment->action = TimetableAdjustment::ACTION_MERGE;
                $timetableAdjustment->substitute_teacher_id = null;
            }
        }
        if (array_key_exists('note', $validated)) {
            $timetableAdjustment->note = $validated['note'];
        }
        $timetableAdjustment->save();

        return back()->with('success', 'Adjustment updated.');
    }
}
