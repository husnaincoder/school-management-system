<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Hostel;
use App\Models\Room;
use App\Models\HostelStudent;
use App\Models\Student;
use Illuminate\Http\Request;

class HostelController extends Controller
{
    public function hostels()
    {
        $hostels = Hostel::with('rooms')->get();
        return inertia('dashboard/hostel/Hostels', ['hostels' => $hostels]);
    }

    public function hostelStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'type' => 'required|in:boys,girls,mixed',
            'address' => 'nullable|string',
            'total_rooms' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        Hostel::create($validated);
        return back()->with('success', 'Hostel created.');
    }

    public function hostelUpdate(Request $request, Hostel $hostel)
    {
        $validated = $request->validate([
            'name' => 'required|string',
            'type' => 'required|in:boys,girls,mixed',
            'address' => 'nullable|string',
            'total_rooms' => 'required|integer|min:1',
            'description' => 'nullable|string',
            'is_active' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active', true);
        $hostel->update($validated);
        return back()->with('success', 'Hostel updated.');
    }

    public function rooms(Request $request)
    {
        $query = Room::with('hostel');

        if ($request->hostel_id) {
            $query->where('hostel_id', $request->hostel_id);
        }

        $rooms = $query->get();
        $hostels = Hostel::where('is_active', true)->get();

        return inertia('dashboard/hostel/Rooms', [
            'rooms' => $rooms,
            'hostels' => $hostels,
        ]);
    }

    public function roomStore(Request $request)
    {
        $validated = $request->validate([
            'hostel_id' => 'required|exists:hostels,id',
            'room_number' => 'required|string',
            'floor' => 'required|integer',
            'capacity' => 'required|integer|min:1',
            'fee_per_bed' => 'required|numeric|min:0',
            'is_active' => 'boolean',
        ]);

        Room::create($validated);
        return back()->with('success', 'Room created.');
    }

    public function students(Request $request)
    {
        $query = HostelStudent::with('student.user', 'hostel', 'room');

        if ($request->hostel_id) {
            $query->where('hostel_id', $request->hostel_id);
        }

        $students = $query->latest()->paginate(20);
        $hostels = Hostel::where('is_active', true)->get();
        $availableStudents = Student::with('user', 'class')
            ->whereDoesntHave('hostelStudent')
            ->get();

        return inertia('dashboard/hostel/Students', [
            'students' => $students,
            'hostels' => $hostels,
            'availableStudents' => $availableStudents,
        ]);
    }

    public function assignRoom(Request $request)
    {
        $validated = $request->validate([
            'student_id' => 'required|exists:students,id',
            'hostel_id' => 'required|exists:hostels,id',
            'room_id' => 'required|exists:rooms,id',
            'bed_number' => 'required|integer',
            'check_in_date' => 'required|date',
            'monthly_fee' => 'required|numeric|min:0',
        ]);

        HostelStudent::create($validated);
        return back()->with('success', 'Room assigned.');
    }
}
