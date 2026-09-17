<?php

namespace App\Http\Controllers\Dashboard\Teacher;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSectionGroup;
use App\Models\FeeAssignment;
use App\Models\FeePayment;
use App\Models\Mark;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentAttendance;
use App\Models\Subject;
use App\Models\AttendanceSession;
use App\Services\Attendance\AttendanceReportService;
use App\Services\Attendance\AttendanceSessionService;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    public function __construct(
        protected AttendanceSessionService $sessionService,
        protected AttendanceReportService $reportService
    ) {}

    public function index()
    {
        $teacher = \Illuminate\Support\Facades\Auth::user();
        // Since there is no teacher_class_subjects table and it's not needed,
        // just show all subjects without class/section mapping.
        $subjects = Subject::all()->map(fn ($subject) => (object) [
            'id' => $subject->id,
            'name' => $subject->name,
            'code' => $subject->code,
            'class' => null,
            'class_section_id' => null,
        ]);

        return inertia('dashboard/teacher/Index', [
            'subjects' => $subjects,
        ]);
    }

    /**
     * Class incharge: assigned class details + student list (Name, Roll No, Admission No, Father/Mother, Contact, Attendance).
     */
    public function myStudents(Request $request)
    {
        $user = $request->user();
        $teacher = $user->teacher;
        if (! $teacher) {
            return redirect()->route('dashboard.teacher')->with('error', 'Teacher profile not found.');
        }

        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
        if ($allowedGroupIds->isEmpty()) {
            return inertia('dashboard/teacher/MyStudents', [
                'assignedClasses' => [],
                'academicSession' => null,
            ]);
        }

        $currentSession = AcademicSession::getCurrentSession();
        $sessionId = $currentSession?->id;
        $dateFrom = $currentSession?->start_date?->format('Y-m-d') ?? now()->startOfYear()->format('Y-m-d');
        $dateTo = $currentSession?->end_date?->format('Y-m-d') ?? now()->format('Y-m-d');

        $groups = ClassSectionGroup::with([
            'classSection.class',
            'classSection.section',
            'subjectGroup',
            'studentEnrollments.student.user',
            'studentEnrollments.student.parent.user',
            'classSectionGroupSubjects.subject',
            'classSectionGroupSubjects.teacher.user',
        ])
            ->whereIn('id', $allowedGroupIds->all())
            ->orderBy('id')
            ->get();

        $assignedClasses = [];
        foreach ($groups as $group) {
            $cs = $group->classSection;
            $className = $cs?->class?->name ?? '—';
            $sectionName = $cs?->section?->name ?? '—';
            $subjectGroupName = $group->subjectGroup?->name ?? '';
            $classLabel = trim("{$className} - {$sectionName}" . ($subjectGroupName ? " ({$subjectGroupName})" : '')) ?: 'Class #' . $group->id;

            $students = [];
            foreach ($group->studentEnrollments as $enrollment) {
                $student = $enrollment->student;
                if (! $student) {
                    continue;
                }
                $parent = $student->parent;
                $parentName = $parent?->user?->name ?? '—';
                $spouseName = $parent?->spouse_name ?? '';
                $fatherMother = trim($parentName . ($spouseName ? " / {$spouseName}" : '')) ?: '—';
                $contact = $parent?->user?->phone ?? $student->user?->phone ?? '—';

                $attendancePct = null;
                if ($sessionId && $currentSession) {
                    $attendancePct = $this->reportService->studentPercentage(
                        $enrollment->id,
                        $currentSession->start_date,
                        $currentSession->end_date,
                        $sessionId
                    );
                }

                $students[] = [
                    'enrollment_id' => $enrollment->id,
                    'name' => $student->full_name ?? $student->user?->name ?? '—',
                    'roll_number' => $enrollment->roll_number ?? '—',
                    'admission_number' => $student->admission_number ?? '—',
                    'father_mother_name' => $fatherMother,
                    'contact' => $contact,
                    'attendance_percentage' => $attendancePct !== null ? round($attendancePct, 1) : null,
                ];
            }

            $assignedSubjects = [];
            $subjectTeachers = [];
            foreach ($group->classSectionGroupSubjects ?? [] as $csgs) {
                $assignedSubjects[] = [
                    'subject_id' => $csgs->subject_id,
                    'name' => $csgs->subject?->name ?? '—',
                    'weekly_classes' => $csgs->weekly_classes,
                ];
                $subjectTeachers[] = [
                    'subject' => $csgs->subject?->name ?? '—',
                    'teacher_name' => $csgs->teacher?->user?->name ?? '—',
                ];
            }

            $assignedClasses[] = [
                'id' => $group->id,
                'class_name' => $className,
                'section_name' => $sectionName,
                'class_label' => $classLabel,
                'total_students' => count($students),
                'assigned_subjects' => $assignedSubjects,
                'subject_teachers' => $subjectTeachers,
                'students' => $students,
            ];
        }

        return inertia('dashboard/teacher/MyStudents', [
            'assignedClasses' => $assignedClasses,
            'academicSession' => $currentSession ? [
                'id' => $currentSession->id,
                'name' => $currentSession->name,
            ] : null,
        ]);
    }

    /**
     * Redirect to class incharge student attendance (sessions list).
     * Class incharge apni incharge class ke students ka attendance yahan se legi.
     */
    public function attendance(Request $request)
    {
        return redirect()->route('teacher.attendance.sessions');
    }

    /**
     * Teacher/Class incharge: redirect to Exams list (filtered by their assigned classes/subjects).
     * From there they can open an exam → Enter Marks, Results & Statistics, download Sheet/Merit List.
     */
    public function marks(Request $request)
    {
        return redirect()->route('academic.exams');
    }
}
