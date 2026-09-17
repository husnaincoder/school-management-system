<?php

namespace App\Http\Controllers\Dashboard\TimeTable;

use App\Http\Controllers\Controller;
use App\Models\ClassRoom;
use App\Models\TimetableEnter;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ClassRoomController extends Controller
{
    public function index()
    {
        $classRooms = ClassRoom::orderBy('name')->get();

        return inertia('dashboard/academic/ClassRooms', [
            'classRooms' => $classRooms,
            'roomTypes' => ClassRoom::ROOM_TYPES,
            'facilityOptions' => ClassRoom::FACILITIES,
        ]);
    }

    public function store(Request $request)
    {
        ClassRoom::create($this->validated($request));

        return back()->with('success', 'Class room created.');
    }

    public function update(Request $request, ClassRoom $classRoom)
    {
        $classRoom->update($this->validated($request, $classRoom->id));

        return back()->with('success', 'Class room updated.');
    }

    public function destroy(ClassRoom $classRoom)
    {
        if (TimetableEnter::where('class_room_id', $classRoom->id)->exists()) {
            return back()->with('error', 'Cannot delete: this room is assigned in one or more timetables.');
        }

        $classRoom->delete();

        return back()->with('success', 'Class room deleted.');
    }

    protected function validated(Request $request, ?int $ignoreId = null): array
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('class_rooms', 'name')->ignore($ignoreId),
            ],
            'code' => [
                'nullable',
                'string',
                'max:50',
                Rule::unique('class_rooms', 'code')->ignore($ignoreId),
            ],
            'building' => 'nullable|string|max:100',
            'floor' => 'nullable|string|max:50',
            'room_type' => ['nullable', Rule::in(ClassRoom::ROOM_TYPES)],
            'capacity' => 'nullable|integer|min:1',
            'is_lab' => 'boolean',
            'is_active' => 'boolean',
            'facilities' => 'nullable|array',
            'facilities.*' => Rule::in(ClassRoom::FACILITIES),
        ]);

        $validated['room_type'] = $validated['room_type'] ?? 'classroom';
        $validated['is_lab'] = in_array($validated['room_type'], ['laboratory', 'computer_lab'], true)
            || $request->boolean('is_lab');
        $validated['is_active'] = $request->has('is_active') ? $request->boolean('is_active') : true;
        $validated['facilities'] = $validated['facilities'] ?? [];
        $validated['code'] = $validated['code'] ?: null;

        return $validated;
    }
}
