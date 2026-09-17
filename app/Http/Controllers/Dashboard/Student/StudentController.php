<?php

namespace App\Http\Controllers\Dashboard\Student;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\Exam;
use App\Models\Invoice;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentExamRecord;
use App\Models\StudentExamResult;
use App\Services\Attendance\AttendanceReportService;
use App\Services\Exam\ExamResultExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class StudentController extends Controller
{
    public function __construct(
        protected AttendanceReportService $reportService
    ) {}

    public function index()
    {
        $user = Auth::user();
        $student = Student::where('user_id', $user->id)
            ->with([
                'user',
                'enrollment.classSectionGroup.classSection.class',
                'enrollment.classSectionGroup.classSection.section',
                'enrollment.classSectionGroup.classSection.academicSession',
                'enrollment.classSectionGroup.classSectionGroupSubjects.subject',
                'enrollment.classSectionGroup.classSectionGroupSubjects.teacher.user',
                'enrollment.classSectionGroup.classIncharges.teacher.user',
                'parent.user',
            ])
            ->first();

        if (! $student) {
            return Inertia::render('dashboard/student/Index', [
                'student' => null,
                'profilePending' => true,
                'userName' => $user->name,
                'attendanceStats' => ['present' => 0, 'absent' => 0, 'late' => 0, 'leave' => 0, 'percentage' => 0],
                'marks' => [],
                'feeStats' => ['totalFee' => 0, 'totalPaid' => 0, 'pending' => 0],
            ]);
        }

        $enrollment = $student->enrollment;
        $currentSession = $enrollment?->classSectionGroup?->classSection?->academicSession ?? AcademicSession::getCurrentSession();
        $attendanceStats = ['present' => 0, 'absent' => 0, 'late' => 0, 'leave' => 0, 'percentage' => 0];

        if ($enrollment && $currentSession) {
            $year = (int) now()->format('Y');
            $yearly = $this->reportService->yearlyReportByStudent(
                $enrollment->id,
                $year,
                $currentSession->id
            );
            $attendanceStats = [
                'present' => $yearly['present'],
                'absent' => $yearly['absent'],
                'late' => $yearly['late'],
                'leave' => $yearly['leave'],
                'percentage' => $yearly['percentage'],
            ];
        }

        return Inertia::render('dashboard/student/Index', [
            'student' => $student,
            'currentAcademicSession' => $currentSession ? ['id' => $currentSession->id, 'name' => $currentSession->name] : null,
            'profilePending' => false,
            'userName' => $user->name,
            'attendanceStats' => $attendanceStats,
            'marks' => [],
            'feeStats' => [
                'totalFee' => 0,
                'totalPaid' => 0,
                'pending' => 0,
            ],
        ]);
    }

    public function attendance(Request $request)
    {
        $user = Auth::user();
        $student = Student::where('user_id', $user->id)->with('enrollment')->first();

        if (! $student) {
            return redirect()->route('dashboard.student')->with('error', 'Student profile not set up yet.');
        }

        $enrollment = $student->enrollment;
        if (! $enrollment) {
            return Inertia::render('dashboard/student/Attendance', [
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

        return Inertia::render('dashboard/student/Attendance', [
            'enrollment' => $enrollment->load('classSectionGroup.classSection.class', 'classSectionGroup.classSection.section'),
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

    public function marks()
    {
        $user = Auth::user();
        $student = Student::where('user_id', $user->id)->first();

        if (! $student) {
            return redirect()->route('dashboard.student')->with('error', 'Student profile not set up yet.');
        }

        $enrollmentIds = $student->enrollments()->pluck('id')->toArray();
        if (empty($enrollmentIds)) {
            return Inertia::render('dashboard/student/Marks', [
                'examResults' => [],
                'subjectRecordsByExam' => [],
            ]);
        }

        $examResults = StudentExamResult::whereIn('student_enrollment_id', $enrollmentIds)
            ->with(['exam.examType', 'exam.academicSession', 'exam.classSectionGroup.classSection.class', 'exam.classSectionGroup.classSection.section'])
            ->orderByDesc('exam_id')
            ->get();

        $records = StudentExamRecord::whereIn('student_enrollment_id', $enrollmentIds)
            ->with(['examSubject.subject', 'examSubject.exam'])
            ->get();

        $subjectRecordsByExam = [];
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

        return Inertia::render('dashboard/student/Marks', [
            'examResults' => $examResults,
            'subjectRecordsByExam' => $subjectRecordsByExam,
        ]);
    }

    /**
     * Download result sheet (CSV) for the current student's result in this exam.
     */
    public function downloadResultSheet(Exam $exam, ExamResultExportService $exportService)
    {
        $user = Auth::user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            abort(403, 'Student profile not found.');
        }

        $enrollment = StudentEnrollment::where('student_id', $student->id)
            ->where('class_section_group_id', $exam->class_section_group_id)
            ->first();
        if (! $enrollment) {
            abort(403, 'You are not enrolled in this exam.');
        }

        return $exportService->resultSheet($exam, [$enrollment->id]);
    }

    /**
     * Download merit list (PDF) for the current student's result in this exam (single-student PDF).
     */
    public function downloadMeritList(Exam $exam, ExamResultExportService $exportService)
    {
        $user = Auth::user();
        $student = Student::where('user_id', $user->id)->first();
        if (! $student) {
            abort(403, 'Student profile not found.');
        }

        $enrollment = StudentEnrollment::where('student_id', $student->id)
            ->where('class_section_group_id', $exam->class_section_group_id)
            ->first();
        if (! $enrollment) {
            abort(403, 'You are not enrolled in this exam.');
        }

        return $exportService->meritList($exam, [$enrollment->id], null);
    }

    public function fees()
    {
        $user = Auth::user();
        $student = Student::where('user_id', $user->id)->with('enrollment')->first();

        if (! $student) {
            return redirect()->route('dashboard.student')->with('error', 'Student profile not set up yet.');
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

        return Inertia::render('dashboard/student/Fees', [
            'invoices' => $invoices,
        ]);
    }
}
