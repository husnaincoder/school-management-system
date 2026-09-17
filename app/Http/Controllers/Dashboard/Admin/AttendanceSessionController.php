<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\MarkStudentAttendanceRequest;
use App\Http\Requests\Attendance\StoreAttendanceSessionRequest;
use App\Http\Requests\Attendance\UpdateAttendanceSessionRequest;
use App\Models\AcademicSession;
use App\Models\AttendanceSession;
use App\Models\ClassSectionGroup;
use App\Models\Employee;
use App\Models\Teacher;
use App\Services\Attendance\AttendanceSessionService;
use App\Services\Attendance\StudentAttendanceService;
use App\Services\Attendance\TeacherAttendanceService;
use App\Services\Attendance\EmployeeAttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceSessionController extends Controller
{
    public function __construct(
        protected AttendanceSessionService $sessionService,
        protected StudentAttendanceService $studentAttendanceService,
        protected TeacherAttendanceService $teacherAttendanceService,
        protected EmployeeAttendanceService $employeeAttendanceService
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', AttendanceSession::class);

        $filters = $request->only(['type', 'academic_session_id', 'class_section_group_id', 'date_from', 'date_to']);
        // Only restrict to teacher's incharge sessions when user is teacher/class_incharge AND not admin/super_admin
        $user = $request->user();
        $teacherId = null;
        if (($user->hasRole('teacher') || $user->hasRole('class_incharge')) && $user->teacher
            && ! $user->hasRole('super_admin') && ! $user->hasRole('admin')) {
            $teacherId = $user->teacher->id;
        }
        $sessions = $this->sessionService->getPaginated($filters, 15, $teacherId);

        $academicSessions = AcademicSession::orderBy('is_current', 'desc')->get();
        $classSectionGroups = ClassSectionGroup::with([
            'classSection.class',
            'classSection.section',
            'classSection.academicSession',
            'subjectGroup',
        ])->orderBy('id')->get();

        return Inertia::render('dashboard/attendance/SessionsIndex', [
            'sessions' => $sessions,
            'academicSessions' => $academicSessions,
            'classSectionGroups' => $classSectionGroups,
            'filters' => $filters,
        ]);
    }

    public function create()
    {
        $this->authorize('create', AttendanceSession::class);

        $academicSessions = AcademicSession::where('is_active', true)->orderBy('is_current', 'desc')->get();
        $query = ClassSectionGroup::with([
            'classSection.class',
            'classSection.section',
            'classSection.academicSession',
            'subjectGroup',
        ])->orderBy('id');

        $user = request()->user();
        if ($user->hasRole('teacher') && $user->teacher) {
            $allowedIds = $this->sessionService->getClassSectionGroupIdsForTeacher($user->teacher->id);
            if ($allowedIds->isNotEmpty()) {
                $query->whereIn('id', $allowedIds);
            }
        }
        $classSectionGroups = $query->get();

        return Inertia::render('dashboard/attendance/SessionCreate', [
            'academicSessions' => $academicSessions,
            'classSectionGroups' => $classSectionGroups,
        ]);
    }

    public function store(StoreAttendanceSessionRequest $request)
    {
        $validated = $request->validated();
        $this->sessionService->create($validated);

        return redirect()->route('attendance.sessions.index')->with('success', 'Attendance session created.');
    }

    public function show(AttendanceSession $attendanceSession)
    {
        $this->authorize('view', $attendanceSession);

        $attendanceSession->load([
            'academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        return Inertia::render('dashboard/attendance/SessionShow', [
            'session' => $attendanceSession,
        ]);
    }

    public function edit(AttendanceSession $attendanceSession)
    {
        $this->authorize('update', $attendanceSession);

        $attendanceSession->load('academicSession', 'classSectionGroup');
        $academicSessions = AcademicSession::where('is_active', true)->orderBy('is_current', 'desc')->get();
        $classSectionGroups = ClassSectionGroup::with([
            'classSection.class',
            'classSection.section',
            'classSection.academicSession',
            'subjectGroup',
        ])->orderBy('id')->get();

        return Inertia::render('dashboard/attendance/SessionEdit', [
            'session' => $attendanceSession,
            'academicSessions' => $academicSessions,
            'classSectionGroups' => $classSectionGroups,
        ]);
    }

    public function update(UpdateAttendanceSessionRequest $request, AttendanceSession $attendanceSession)
    {
        $validated = $request->validated();
        $this->sessionService->update($attendanceSession, $validated);

        return redirect()->route('attendance.sessions.index')->with('success', 'Attendance session updated.');
    }

    public function mark(AttendanceSession $attendanceSession)
    {
        $this->authorize('markAttendance', $attendanceSession);

        $attendanceSession->load([
            'academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        $list = [];
        $records = [];

        if ($attendanceSession->type === 'student') {
            if (empty($attendanceSession->class_section_group_id)) {
                return redirect()->route('attendance.sessions.index')->with('error', 'Student attendance session must have a class section group.');
            }
            $enrollments = $this->studentAttendanceService->getEnrollmentsForSession($attendanceSession);
            foreach ($enrollments as $en) {
                $list[] = [
                    'id' => 'enrollment_' . $en->id,
                    'enrollment_id' => $en->id,
                    'label' => $en->student->user->name ?? $en->student->full_name ?? '—',
                    'roll_number' => $en->roll_number,
                ];
            }
            $records = $this->studentAttendanceService->getExistingRecords($attendanceSession)->toArray();
        } elseif ($attendanceSession->type === 'teacher') {
            $teachers = Teacher::with('user')->where('is_active', true)->orderBy('id')->get();
            foreach ($teachers as $t) {
                $list[] = [
                    'id' => 'teacher_' . $t->id,
                    'teacher_id' => $t->id,
                    'label' => $t->user->name ?? '—',
                ];
            }
            $records = $attendanceSession->teacherAttendances()->get()->keyBy('teacher_id')->toArray();
        } else {
            $employees = Employee::with('user')->where('status', 'active')->orderBy('id')->get();
            foreach ($employees as $e) {
                $list[] = [
                    'id' => 'employee_' . $e->id,
                    'employee_id' => $e->id,
                    'label' => $e->user->name ?? '—',
                ];
            }
            $records = $attendanceSession->employeeAttendances()->get()->keyBy('employee_id')->toArray();
        }

        return Inertia::render('dashboard/attendance/MarkAttendance', [
            'session' => $attendanceSession,
            'list' => $list,
            'records' => $records,
        ]);
    }

    public function markStore(MarkStudentAttendanceRequest $request, AttendanceSession $attendanceSession)
    {
        $validated = $request->validated();

        if ($attendanceSession->type === 'student') {
            try {
                $this->studentAttendanceService->saveAttendances(
                    $attendanceSession,
                    $validated['attendances'],
                    $request->user()
                );
            } catch (\RuntimeException $e) {
                return back()->with('error', $e->getMessage());
            }
        } elseif ($attendanceSession->type === 'teacher') {
            try {
                $this->teacherAttendanceService->saveAttendances(
                    $attendanceSession,
                    $validated['attendances'],
                    $request->user()
                );
            } catch (\RuntimeException $e) {
                return back()->with('error', $e->getMessage());
            }
        } else {
            try {
                $this->employeeAttendanceService->saveAttendances(
                    $attendanceSession,
                    $validated['attendances'],
                    $request->user()
                );
            } catch (\RuntimeException $e) {
                return back()->with('error', $e->getMessage());
            }
        }

        return back()->with('success', 'Attendance saved.');
    }

    public function bulkMarkPresent(Request $request, AttendanceSession $attendanceSession)
    {
        $this->authorize('markAttendance', $attendanceSession);

        if ($attendanceSession->type !== 'student') {
            return back()->with('error', 'Bulk mark present is only for student attendance.');
        }

        try {
            $this->studentAttendanceService->bulkMarkPresent($attendanceSession, $request->user());
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'All marked present.');
    }

    public function lock(AttendanceSession $attendanceSession)
    {
        $this->authorize('lockUnlock', $attendanceSession);
        $this->sessionService->lock($attendanceSession);
        return back()->with('success', 'Session locked.');
    }

    public function unlock(AttendanceSession $attendanceSession)
    {
        $this->authorize('lockUnlock', $attendanceSession);
        $this->sessionService->unlock($attendanceSession);
        return back()->with('success', 'Session unlocked.');
    }

    public function destroy(AttendanceSession $attendanceSession)
    {
        $this->authorize('delete', $attendanceSession);
        $attendanceSession->delete();
        return redirect()->route('attendance.sessions.index')->with('success', 'Attendance session deleted.');
    }
}
