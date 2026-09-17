<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceMonthlyFreeze;
use App\Services\Attendance\AttendanceFreezeService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceFreezeController extends Controller
{
    public function __construct(
        protected AttendanceFreezeService $freezeService
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $academicSessionId = $request->get('academic_session_id');
        $freezes = $this->freezeService->list($academicSessionId);
        $academicSessions = $this->freezeService->getAcademicSessionsForSelect();

        return Inertia::render('dashboard/attendance/FreezeIndex', [
            'freezes' => $freezes,
            'academicSessions' => $academicSessions,
            'filterAcademicSessionId' => $academicSessionId,
        ]);
    }

    public function store(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'type' => 'required|in:student,teacher,employee',
        ]);

        $this->freezeService->freeze(
            (int) $validated['academic_session_id'],
            (int) $validated['year'],
            (int) $validated['month'],
            $validated['type'],
            $request->user()
        );

        return back()->with('success', 'Attendance month frozen.');
    }

    public function destroy(AttendanceMonthlyFreeze $freeze)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $this->freezeService->unfreeze($freeze);
        return back()->with('success', 'Month unfrozen.');
    }
}
