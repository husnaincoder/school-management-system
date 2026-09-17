<?php

namespace App\Http\Controllers\Dashboard\TimeTable;

use App\Http\Controllers\Controller;
use App\Models\Teacher;
use App\Models\TeacherAvailability;
use App\Models\TimeSlot;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TeacherAvailabilityController extends Controller
{
    public function index(Request $request)
    {
        $teachers = Teacher::with('user:id,name')->get()
            ->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name ?? 'Teacher #'.$t->id]);
        $timeSlots = TimeSlot::orderBy('slot_order')->orderBy('start_time')->get();
        $days = TeacherAvailability::DAYS;

        $selectedTeacherId = $request->filled('teacher_id')
            ? (int) $request->teacher_id
            : ($teachers->first()['id'] ?? null);

        $matrix = [];
        if ($selectedTeacherId) {
            $rows = TeacherAvailability::query()
                ->where('teacher_id', $selectedTeacherId)
                ->get();
            foreach ($rows as $row) {
                $matrix[$row->day][$row->time_slot_id] = (bool) $row->is_available;
            }
        }

        $availabilities = TeacherAvailability::with('teacher.user', 'timeSlot')
            ->when($request->filled('teacher_id'), fn ($q) => $q->where('teacher_id', $request->teacher_id))
            ->when($request->filled('day'), fn ($q) => $q->where('day', $request->day))
            ->orderBy('teacher_id')->orderBy('day')->orderBy('time_slot_id')
            ->get();

        return inertia('dashboard/academic/TeacherAvailabilities', [
            'availabilities' => $availabilities,
            'teachers' => $teachers,
            'timeSlots' => $timeSlots,
            'days' => $days,
            'filterTeacherId' => $selectedTeacherId,
            'filterDay' => $request->day,
            'matrix' => $matrix,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'day' => 'required|in:'.implode(',', TeacherAvailability::DAYS),
            'time_slot_id' => 'required|exists:time_slots,id',
            'is_available' => 'boolean',
        ]);
        $validated['is_available'] = $request->boolean('is_available');
        $validated['class_room_id'] = null;

        TeacherAvailability::updateOrCreate(
            [
                'teacher_id' => $validated['teacher_id'],
                'day' => $validated['day'],
                'time_slot_id' => $validated['time_slot_id'],
            ],
            [
                'is_available' => $validated['is_available'],
                'class_room_id' => null,
            ]
        );

        return back()->with('success', 'Availability saved.');
    }

    public function update(Request $request, TeacherAvailability $teacherAvailability)
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'day' => 'required|in:'.implode(',', TeacherAvailability::DAYS),
            'time_slot_id' => 'required|exists:time_slots,id',
            'is_available' => 'boolean',
        ]);
        $validated['is_available'] = $request->boolean('is_available');
        $validated['class_room_id'] = null;
        $teacherAvailability->update($validated);

        return back()->with('success', 'Availability updated.');
    }

    public function destroy(TeacherAvailability $teacherAvailability)
    {
        $teacherAvailability->delete();

        return back()->with('success', 'Availability removed.');
    }

    /**
     * Bulk save weekly availability matrix for one teacher.
     * Payload: cells: [{ day, time_slot_id, is_available }]
     * Only stores unavailable (or explicit) rows; available cells can omit = default available.
     */
    public function syncWeek(Request $request)
    {
        $validated = $request->validate([
            'teacher_id' => 'required|exists:teachers,id',
            'cells' => 'required|array',
            'cells.*.day' => ['required', Rule::in(TeacherAvailability::DAYS)],
            'cells.*.time_slot_id' => 'required|exists:time_slots,id',
            'cells.*.is_available' => 'required|boolean',
        ]);

        DB::transaction(function () use ($validated) {
            $teacherId = (int) $validated['teacher_id'];
            TeacherAvailability::where('teacher_id', $teacherId)->delete();

            foreach ($validated['cells'] as $cell) {
                // Persist both available and unavailable so weekly grid is explicit.
                TeacherAvailability::create([
                    'teacher_id' => $teacherId,
                    'day' => $cell['day'],
                    'time_slot_id' => $cell['time_slot_id'],
                    'class_room_id' => null,
                    'is_available' => (bool) $cell['is_available'],
                ]);
            }
        });

        return back()->with('success', 'Weekly availability saved.');
    }
}
