<?php

namespace App\Http\Controllers\Dashboard\Parent;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Exam;
use App\Models\Invoice;
use App\Models\ParentModel;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Services\Attendance\AttendanceReportService;
use App\Services\Exam\ExamResultExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class ParentController extends Controller
{
    public function __construct(
        protected AttendanceReportService $reportService
    ) {}

    public function index()
    {
        $parent = ParentModel::where('user_id', Auth::id())
            ->with([
                'students.user',
                'students.enrollment.classSectionGroup.classSection.class',
                'students.enrollment.classSectionGroup.classSection.section',
                'students.enrollment.classSectionGroup.classSection.academicSession',
                'students.enrollment.classSectionGroup.classSectionGroupSubjects.subject',
                'students.enrollment.classSectionGroup.classSectionGroupSubjects.teacher.user',
                'students.enrollment.classSectionGroup.classIncharges.teacher.user',
            ])
            ->first();

        if (! $parent) {
            abort(404, 'Parent profile not found.');
        }

        return Inertia::render('dashboard/parent/Index', [
            'parent' => $parent,
            'children' => $parent->students,
        ]);
    }

    public function childAttendance(Request $request, Student $student)
    {
        $parent = ParentModel::where('user_id', Auth::id())->first();
        if (! $parent || ! $parent->students()->where('id', $student->id)->exists()) {
            abort(403, 'Access denied.');
        }

        $student->load('user', 'enrollment.classSectionGroup.classSection.class', 'enrollment.classSectionGroup.classSection.section');
        $enrollment = $student->enrollment;

        if (! $enrollment) {
            return Inertia::render('dashboard/parent/ChildAttendance', [
                'student' => $student,
                'enrollment' => null,
                'dailyRecords' => null,
                'monthly' => null,
                'yearly' => null,
                'percentage' => 0,
                'academicSessions' => AcademicSession::where('is_active', true)->get(),
                'filters' => [],
            ]);
        }

        $currentSession = AcademicSession::getCurrentSession();
        $academicSessionId = $request->input('academic_session_id', $currentSession?->id);
        $dateTo = $request->input('date_to', now()->format('Y-m-d'));
        $dateFrom = $request->input('date_from', now()->subDays(30)->format('Y-m-d'));
        $year = (int) $request->input('year', now()->year);
        $month = $request->input('month') ? (int) $request->input('month') : null;

        $dailyRecords = $this->reportService->studentDailyRecords(
            $enrollment->id,
            $dateFrom,
            $dateTo,
            $academicSessionId ? (int) $academicSessionId : null,
            30
        );

        $monthly = $month
            ? $this->reportService->monthlyReportByStudent($enrollment->id, $year, $month, $academicSessionId)
            : null;
        $yearly = $this->reportService->yearlyReportByStudent($enrollment->id, $year, $academicSessionId);
        $percentage = $this->reportService->studentPercentage(
            $enrollment->id,
            $currentSession?->start_date,
            $currentSession?->end_date ?? now(),
            $academicSessionId
        );

        return Inertia::render('dashboard/parent/ChildAttendance', [
            'student' => $student,
            'enrollment' => $enrollment,
            'dailyRecords' => $dailyRecords,
            'monthly' => $monthly,
            'yearly' => $yearly,
            'percentage' => $percentage,
            'academicSessions' => AcademicSession::where('is_active', true)->get(),
            'filters' => [
                'academic_session_id' => $academicSessionId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'year' => $year,
                'month' => $month,
            ],
        ]);
    }

    public function childMarks(Student $student)
    {
        $parent = ParentModel::where('user_id', Auth::id())->first();
        if (! $parent || ! $parent->students()->where('id', $student->id)->exists()) {
            abort(403, 'Access denied.');
        }

        $student->load('user', 'enrollment.classSectionGroup.classSection.class', 'enrollment.classSectionGroup.classSection.section');

        $enrollmentIds = $student->enrollments()->pluck('id')->toArray();
        $examResults = [];
        $subjectRecordsByExam = [];

        if (! empty($enrollmentIds)) {
            $examResults = \App\Models\StudentExamResult::whereIn('student_enrollment_id', $enrollmentIds)
                ->with(['exam.examType', 'exam.academicSession', 'exam.classSectionGroup.classSection.class', 'exam.classSectionGroup.classSection.section'])
                ->orderByDesc('exam_id')
                ->get();

            $records = \App\Models\StudentExamRecord::whereIn('student_enrollment_id', $enrollmentIds)
                ->with(['examSubject.subject', 'examSubject.exam'])
                ->get();

            foreach ($records as $r) {
                $examId = $r->examSubject->exam_id ?? 0;
                if (! isset($subjectRecordsByExam[$examId])) {
                    $subjectRecordsByExam[$examId] = [];
                }
                $subjectRecordsByExam[$examId][] = [
                    'subject_name' => $r->examSubject->subject->name ?? '—',
                    'obtained_marks' => $r->obtained_marks,
                    'attendance_status' => $r->attendance_status,
                ];
            }
        }

        return Inertia::render('dashboard/parent/ChildMarks', [
            'student' => $student,
            'examResults' => $examResults,
            'subjectRecordsByExam' => $subjectRecordsByExam,
        ]);
    }

    /**
     * Download result sheet (CSV) for a child's result in this exam.
     */
    public function downloadChildResultSheet(Student $student, Exam $exam, ExamResultExportService $exportService)
    {
        $parent = ParentModel::where('user_id', Auth::id())->first();
        if (! $parent || ! $parent->students()->where('id', $student->id)->exists()) {
            abort(403, 'Access denied.');
        }

        $enrollment = StudentEnrollment::where('student_id', $student->id)
            ->where('class_section_group_id', $exam->class_section_group_id)
            ->first();
        if (! $enrollment) {
            abort(403, 'This child is not enrolled in this exam.');
        }

        return $exportService->resultSheet($exam, [$enrollment->id]);
    }

    /**
     * Download merit list (PDF) for a child's result in this exam (single-student PDF).
     */
    public function downloadChildMeritList(Student $student, Exam $exam, ExamResultExportService $exportService)
    {
        $parent = ParentModel::where('user_id', Auth::id())->first();
        if (! $parent || ! $parent->students()->where('id', $student->id)->exists()) {
            abort(403, 'Access denied.');
        }

        $enrollment = StudentEnrollment::where('student_id', $student->id)
            ->where('class_section_group_id', $exam->class_section_group_id)
            ->first();
        if (! $enrollment) {
            abort(403, 'This child is not enrolled in this exam.');
        }

        return $exportService->meritList($exam, [$enrollment->id], null);
    }

    /**
     * My Children's Fee - list all children with their invoices.
     */
    public function fee()
    {
        $parent = ParentModel::where('user_id', Auth::id())->with('students.enrollment')->first();
        if (! $parent) {
            abort(404, 'Parent profile not found.');
        }

        $children = $parent->students->map(function (Student $student) {
            $enrollmentIds = $student->enrollments()->pluck('id');
            $invoices = Invoice::with([
                'enrollment.classSectionGroup.classSection.academicSession',
                'enrollment.classSectionGroup.classSection.class',
                'enrollment.classSectionGroup.classSection.section',
            ])
                ->whereIn('student_enrollment_id', $enrollmentIds)
                ->latest('issue_date')
                ->get()
                ->map(function (Invoice $inv) {
                    $en = $inv->enrollment;
                    $csg = $en?->classSectionGroup;
                    $session = $csg && $csg->classSection && $csg->classSection->academicSession
                        ? $csg->classSection->academicSession->name : '—';
                    $class = $csg && $csg->classSection && $csg->classSection->class
                        ? $csg->classSection->class->name : '—';
                    $section = $csg && $csg->classSection && $csg->classSection->section
                        ? $csg->classSection->section->name : '—';
                    return [
                        'id' => $inv->id,
                        'invoice_no' => $inv->invoice_no,
                        'issue_date' => $inv->issue_date?->format('Y-m-d'),
                        'due_date' => $inv->due_date?->format('Y-m-d'),
                        'total_amount' => $inv->total_amount,
                        'paid_amount' => $inv->paid_amount,
                        'balance' => $inv->balance,
                        'status' => $inv->status,
                        'session' => $session,
                        'class' => $class,
                        'section' => $section,
                    ];
                });

            return [
                'id' => $student->id,
                'name' => trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')),
                'enrollment' => $student->enrollment ? [
                    'class' => $student->enrollment->classSectionGroup?->classSection?->class?->name ?? '—',
                    'section' => $student->enrollment->classSectionGroup?->classSection?->section?->name ?? '—',
                ] : null,
                'invoices' => $invoices,
            ];
        });

        return Inertia::render('dashboard/parent/ChildrenFee', [
            'children' => $children,
        ]);
    }

    public function childFees(Student $student)
    {
        $parent = ParentModel::where('user_id', Auth::id())->first();
        if (! $parent || ! $parent->students()->where('id', $student->id)->exists()) {
            abort(403, 'Access denied.');
        }

        $enrollmentIds = $student->enrollments()->pluck('id');
        $invoices = Invoice::with([
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
        ])
            ->whereIn('student_enrollment_id', $enrollmentIds)
            ->latest('issue_date')
            ->get()
            ->map(function (Invoice $inv) {
                $en = $inv->enrollment;
                $csg = $en?->classSectionGroup;
                $session = $csg && $csg->classSection && $csg->classSection->academicSession
                    ? $csg->classSection->academicSession->name : '—';
                $class = $csg && $csg->classSection && $csg->classSection->class
                    ? $csg->classSection->class->name : '—';
                $section = $csg && $csg->classSection && $csg->classSection->section
                    ? $csg->classSection->section->name : '—';
                return [
                    'id' => $inv->id,
                    'invoice_no' => $inv->invoice_no,
                    'issue_date' => $inv->issue_date?->format('Y-m-d'),
                    'due_date' => $inv->due_date?->format('Y-m-d'),
                    'total_amount' => $inv->total_amount,
                    'paid_amount' => $inv->paid_amount,
                    'balance' => $inv->balance,
                    'status' => $inv->status,
                    'session' => $session,
                    'class' => $class,
                    'section' => $section,
                ];
            });

        return Inertia::render('dashboard/parent/ChildFees', [
            'student' => $student->load('user', 'enrollment.classSectionGroup.classSection.class', 'enrollment.classSectionGroup.classSection.section'),
            'invoices' => $invoices,
        ]);
    }
}
