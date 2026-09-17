<?php

namespace App\Http\Controllers\Dashboard\TimeSlot;

use App\Http\Controllers\Controller;
use App\Models\TimeSlot;
use App\Models\TimetableEnter;
use App\Services\Timetable\TimetableConflictService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TimeSlotController extends Controller
{
    public function __construct(protected TimetableConflictService $conflicts) {}

    public function index()
    {
        $timeSlots = TimeSlot::orderBy('slot_order')->orderBy('start_time')->get();

        return inertia('dashboard/academic/TimeSlots', [
            'timeSlots' => $timeSlots,
            'slotTypes' => TimeSlot::TYPES,
            'nextOrder' => $this->conflicts->nextSlotOrder(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $this->validated($request);
        $this->conflicts->assertTimeSlotNoOverlap($validated['start_time'], $validated['end_time']);

        if (! $request->filled('slot_order')) {
            $validated['slot_order'] = $this->conflicts->nextSlotOrder();
        }

        TimeSlot::create($validated);

        return back()->with('success', 'Time slot created.');
    }

    public function update(Request $request, TimeSlot $timeSlot)
    {
        $validated = $this->validated($request);
        $this->conflicts->assertTimeSlotNoOverlap($validated['start_time'], $validated['end_time'], $timeSlot->id);
        $timeSlot->update($validated);

        return back()->with('success', 'Time slot updated.');
    }

    public function destroy(TimeSlot $timeSlot)
    {
        if (TimetableEnter::where('time_slot_id', $timeSlot->id)->exists()) {
            return back()->with('error', 'Cannot delete: this time slot is used in one or more timetables.');
        }

        $timeSlot->delete();

        return back()->with('success', 'Time slot deleted.');
    }

    protected function validated(Request $request): array
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_time' => 'required|date_format:H:i',
            'end_time' => 'required|date_format:H:i|after:start_time',
            'slot_order' => 'nullable|integer|min:0',
            'slot_type' => ['nullable', Rule::in(TimeSlot::TYPES)],
            'is_break' => 'boolean',
            'is_active' => 'boolean',
        ]);

        if (strlen($validated['start_time']) === 5) {
            $validated['start_time'] .= ':00';
        }
        if (strlen($validated['end_time']) === 5) {
            $validated['end_time'] .= ':00';
        }

        $validated['slot_type'] = $validated['slot_type'] ?? ($request->boolean('is_break') ? 'break' : 'period');
        $validated['is_break'] = in_array($validated['slot_type'], ['break', 'lunch'], true) || $request->boolean('is_break');
        $validated['is_active'] = $request->has('is_active') ? $request->boolean('is_active') : true;
        $validated['slot_order'] = isset($validated['slot_order']) ? (int) $validated['slot_order'] : null;

        return $validated;
    }
}
