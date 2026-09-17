<?php

namespace App\Http\Controllers\Dashboard\Leave;

use App\Http\Controllers\Controller;
use App\Models\LeaveType;
use Illuminate\Http\Request;

class LeaveTypeController extends Controller
{
    public function index()
    {
        $leaveTypes = LeaveType::latest()->get();

        return inertia('dashboard/leave/LeaveTypes', [
            'leaveTypes' => $leaveTypes,
        ]);
    }

    public function create()
    {
        return redirect()->route('leave-types.index');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_paid' => 'boolean',
            'max_days' => 'nullable|integer|min:0',
            'for_students' => 'boolean',
            'for_teachers' => 'boolean',
            'for_employees' => 'boolean',
        ]);

        $validated['is_paid'] = $request->boolean('is_paid', true);
        $validated['for_students'] = $request->boolean('for_students', true);
        $validated['for_teachers'] = $request->boolean('for_teachers', true);
        $validated['for_employees'] = $request->boolean('for_employees', true);

        LeaveType::create($validated);

        return back()->with('success', 'Leave type created successfully.');
    }

    public function show($id)
    {
        return redirect()->route('leave-types.index');
    }

    public function edit($id)
    {
        return redirect()->route('leave-types.index');
    }

    public function update(Request $request, $id)
    {
        $leaveType = LeaveType::findOrFail($id);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'is_paid' => 'boolean',
            'max_days' => 'nullable|integer|min:0',
            'for_students' => 'boolean',
            'for_teachers' => 'boolean',
            'for_employees' => 'boolean',
        ]);

        $validated['is_paid'] = $request->boolean('is_paid', true);
        $validated['for_students'] = $request->boolean('for_students', true);
        $validated['for_teachers'] = $request->boolean('for_teachers', true);
        $validated['for_employees'] = $request->boolean('for_employees', true);

        $leaveType->update($validated);

        return back()->with('success', 'Leave type updated successfully.');
    }

    public function destroy($id)
    {
        $leaveType = LeaveType::findOrFail($id);
        $leaveType->delete();

        return back()->with('success', 'Leave type deleted successfully.');
    }
}
