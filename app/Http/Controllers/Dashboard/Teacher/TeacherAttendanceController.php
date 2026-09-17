<?php

namespace App\Http\Controllers\Dashboard\Teacher;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\MarkStudentAttendanceRequest;
use App\Models\AcademicSession;
use App\Models\AttendanceSession;
use App\Models\ClassSectionGroup;
use App\Services\Attendance\AttendanceSessionService;
use App\Services\Attendance\StudentAttendanceService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherAttendanceController extends Controller
{
    public function __construct(
        protected AttendanceSessionService $sessionService,
        protected StudentAttendanceService $studentAttendanceService
    ) {}

    /**
     * List student attendance sessions for class incharge's groups only.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }

        $teacherId = $teacher->id;
        $filters = $request->only(['academic_session_id', 'class_section_group_id', 'date_from', 'date_to']);
        $filters['type'] = 'student'; // only student sessions for class incharge
        $sessions = $this->sessionService->getPaginated($filters, 15, $teacherId);

        $academicSessions = AcademicSession::orderBy('is_current', 'desc')->get();
        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($teacherId);
        $classSectionGroups = ClassSectionGroup::with([
            'classSection.class',
            'classSection.section',
            'classSection.academicSession',
            'subjectGroup',
        ])->whereIn('id', $allowedGroupIds)->orderBy('id')->get();

        return Inertia::render('dashboard/attendance/SessionsIndex', [
            'sessions' => $sessions,
            'academicSessions' => $academicSessions,
            'classSectionGroups' => $classSectionGroups,
            'filters' => $filters,
            'forTeacher' => true,
            'routes' => [
                'index' => 'teacher.attendance.sessions',
                'mark' => 'teacher.attendance.sessions.mark',
                'markStore' => 'teacher.attendance.sessions.mark.store',
                'bulkMarkPresent' => 'teacher.attendance.sessions.bulk-mark-present',
            ],
        ]);
    }

    /**
     * Show mark attendance page for a student session (only if teacher is class incharge).
     */
    public function mark(Request $request, AttendanceSession $attendanceSession)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher || ! $this->sessionService->teacherCanAccessSession($attendanceSession, $teacher->id)) {
            abort(403, 'You can only mark attendance for your incharge class.');
        }
        if ($attendanceSession->type !== 'student') {
            return redirect()->route('teacher.attendance.sessions')->with('error', 'Only student attendance can be marked here.');
        }
        if ($attendanceSession->is_locked) {
            return Inertia::render('dashboard/attendance/MarkAttendance', [
                'session' => $attendanceSession->load([
                    'academicSession',
                    'classSectionGroup.classSection.class',
                    'classSectionGroup.classSection.section',
                    'classSectionGroup.subjectGroup',
                ]),
                'list' => [],
                'records' => [],
                'forTeacher' => true,
                'routes' => [
                    'index' => 'teacher.attendance.sessions',
                    'markStore' => 'teacher.attendance.sessions.mark.store',
                    'bulkMarkPresent' => 'teacher.attendance.sessions.bulk-mark-present',
                ],
            ]);
        }

        if (empty($attendanceSession->class_section_group_id)) {
            return redirect()->route('teacher.attendance.sessions')->with('error', 'Session must have a class section group.');
        }

        $enrollments = $this->studentAttendanceService->getEnrollmentsForSession($attendanceSession);
        $list = [];
        foreach ($enrollments as $en) {
            $list[] = [
                'id' => 'enrollment_' . $en->id,
                'enrollment_id' => $en->id,
                'label' => $en->student->user->name ?? $en->student->full_name ?? '—',
                'roll_number' => $en->roll_number,
            ];
        }
        $records = $this->studentAttendanceService->getExistingRecords($attendanceSession)->toArray();

        $attendanceSession->load([
            'academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        return Inertia::render('dashboard/attendance/MarkAttendance', [
            'session' => $attendanceSession,
            'list' => $list,
            'records' => $records,
            'forTeacher' => true,
            'routes' => [
                'index' => 'teacher.attendance.sessions',
                'markStore' => 'teacher.attendance.sessions.mark.store',
                'bulkMarkPresent' => 'teacher.attendance.sessions.bulk-mark-present',
            ],
        ]);
    }

    public function markStore(MarkStudentAttendanceRequest $request, AttendanceSession $attendanceSession)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher || ! $this->sessionService->teacherCanAccessSession($attendanceSession, $teacher->id)) {
            abort(403, 'You can only mark attendance for your incharge class.');
        }
        if ($attendanceSession->type !== 'student') {
            return back()->with('error', 'Only student attendance can be marked here.');
        }

        $validated = $request->validated();
        try {
            $this->studentAttendanceService->saveAttendances(
                $attendanceSession,
                $validated['attendances'],
                $request->user()
            );
        } catch (\RuntimeException $e) {
            return back()->with('error', $e->getMessage());
        }

        return redirect()->route('teacher.attendance.sessions')->with('success', 'Attendance saved.');
    }

    public function bulkMarkPresent(Request $request, AttendanceSession $attendanceSession)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher || ! $this->sessionService->teacherCanAccessSession($attendanceSession, $teacher->id)) {
            abort(403, 'You can only mark attendance for your incharge class.');
        }
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
}
