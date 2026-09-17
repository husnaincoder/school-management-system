<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\FeeStructure;
use App\Models\FeeAssignment;
use App\Models\Student;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use Illuminate\Http\Request;

class FeeController extends Controller
{
    public function feeStructure(Request $request)
    {
        $query = FeeStructure::with('class', 'academicSession');

        if ($request->academic_session_id) {
            $query->where('academic_session_id', $request->academic_session_id);
        }

        if ($request->class_id) {
            $query->where('class_id', $request->class_id);
        }

        $feeStructures = $query->orderBy('class_id')->get();
        $classes = SchoolClass::all();
        $sessions = AcademicSession::all();

        return inertia('dashboard/accountant/fee/Structure', [
            'feeStructures' => $feeStructures,
            'classes' => $classes,
            'sessions' => $sessions,
        ]);
    }

    public function feeStructureStore(Request $request)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'class_id' => 'required|exists:classes,id',
            'fee_type' => 'required|string',
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);

        FeeStructure::create($validated);

        return back()->with('success', 'Fee structure created successfully.');
    }

    public function feeAssign(Request $request)
    {
        $classes = SchoolClass::with('sections')->get();
        $sessions = AcademicSession::all();

        $query = FeeAssignment::with('student.user', 'feeStructure.class', 'academicSession');

        if ($request->class_id) {
            $query->whereHas('student', fn($q) => $q->where('class_id', $request->class_id));
        }

        if ($request->academic_session_id) {
            $query->where('academic_session_id', $request->academic_session_id);
        }

        $assignments = $query->latest()->paginate(20);

        return inertia('dashboard/accountant/fee/Assign', [
            'assignments' => $assignments,
            'classes' => $classes,
            'sessions' => $sessions,
        ]);
    }

    public function feeCollection(Request $request)
    {
        $payments = new \Illuminate\Pagination\LengthAwarePaginator([], 0, 20);
        $totalCollected = 0;

        return inertia('dashboard/accountant/fee/Collection', [
            'payments' => $payments,
            'totalCollected' => $totalCollected,
        ]);
    }

    public function collectFee(Request $request)
    {
        return back()->with('error', 'Fee payment collection is not configured.');
    }
}
