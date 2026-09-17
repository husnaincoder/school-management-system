<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSection;
use App\Models\ClassSectionGroup;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\StudentEnrollment;
use App\Services\Attendance\AttendanceExportService;
use App\Services\Attendance\AttendanceReportService;
use App\Services\Attendance\AttendanceSessionService;
use App\Services\Setting\SystemSettingService;
use App\Support\PdfAssets;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Throwable;

class AttendanceReportController extends Controller
{
    public function __construct(
        protected AttendanceReportService $reportService,
        protected AttendanceExportService $exportService,
        protected AttendanceSessionService $sessionService
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $user = $request->user();
        $allowedGroupIds = null;
        if ($user->hasRole('teacher') && $user->teacher) {
            $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($user->teacher->id)->all();
        }

        $currentSession = AcademicSession::getCurrentSession();
        $academicSessionId = $request->input('academic_session_id', $currentSession?->id);
        $dateFrom = $request->input('date_from', now()->startOfMonth()->format('Y-m-d'));
        $dateTo = $request->input('date_to', now()->format('Y-m-d'));
        $classSectionGroupId = $request->input('class_section_group_id');

        if ($allowedGroupIds !== null) {
            $classSectionGroupId = $classSectionGroupId && in_array((int) $classSectionGroupId, $allowedGroupIds, true)
                ? (int) $classSectionGroupId
                : null;
        }

        $todaySummary = $this->reportService->todaySummary($academicSessionId, $allowedGroupIds);
        $classWise = $this->reportService->classWisePercentage(
            $academicSessionId ?? 0,
            $dateFrom,
            $dateTo,
            $allowedGroupIds
        );
        $mostAbsent = $this->reportService->mostAbsentStudents(
            $academicSessionId ?? 0,
            $classSectionGroupId,
            $dateFrom,
            $dateTo,
            10,
            $allowedGroupIds
        );

        $academicSessions = AcademicSession::where('is_active', true)->orderBy('is_current', 'desc')->get();
        $classSectionGroups = $allowedGroupIds !== null
            ? ClassSectionGroup::whereIn('id', $allowedGroupIds)->with('classSection.class', 'classSection.section', 'subjectGroup')->orderBy('id')->get()
            : ClassSectionGroup::with('classSection.class', 'classSection.section', 'subjectGroup')->get();

        return Inertia::render('dashboard/attendance/ReportsIndex', [
            'todaySummary' => $todaySummary,
            'classWise' => $classWise,
            'mostAbsent' => $mostAbsent,
            'academicSessions' => $academicSessions,
            'classSectionGroups' => $classSectionGroups,
            'filters' => [
                'academic_session_id' => $academicSessionId,
                'date_from' => $dateFrom,
                'date_to' => $dateTo,
                'class_section_group_id' => $classSectionGroupId,
            ],
        ]);
    }

    public function studentReport(Request $request)
    {
        $user = $request->user();
        $allowedGroupIds = null;
        if ($user->hasRole('teacher') && $user->teacher) {
            $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($user->teacher->id)->all();
        }

        $studentEnrollmentId = $request->input('student_enrollment_id');
        $year = (int) $request->input('year', now()->year);
        $month = $request->input('month');
        $academicSessionId = $request->input('academic_session_id');
        $classId = $request->input('class_id');
        $sectionId = $request->input('section_id');

        $enrollmentsQuery = StudentEnrollment::with([
            'student.user',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ])
            ->where('status', 'active')
            ->orderBy('roll_number');

        if ($allowedGroupIds !== null) {
            $enrollmentsQuery->whereIn('class_section_group_id', $allowedGroupIds);
        }

        $enrollments = $enrollmentsQuery->get()->map(function (StudentEnrollment $en) {
            $cs = $en->classSectionGroup?->classSection;
            $studentName = trim(($en->student?->first_name ?? '').' '.($en->student?->last_name ?? ''));
            if ($studentName === '') {
                $studentName = $en->student?->user?->name ?? 'Student';
            }

            return [
                'id' => (int) $en->id,
                'roll_number' => $en->roll_number,
                'student_name' => $studentName,
                'class_section_group_id' => (int) $en->class_section_group_id,
                'academic_session_id' => $cs?->academic_session_id !== null ? (int) $cs->academic_session_id : null,
                'class_id' => $cs?->class_id !== null ? (int) $cs->class_id : null,
                'section_id' => $cs?->section_id !== null ? (int) $cs->section_id : null,
                'session_name' => $cs?->academicSession?->name,
                'class_name' => $cs?->class?->name,
                'section_name' => $cs?->section?->name,
                'group_name' => $en->classSectionGroup?->subjectGroup?->name,
            ];
        })->values();

        $classSectionsQuery = ClassSection::with(['class:id,name', 'section:id,name'])
            ->orderBy('academic_session_id')
            ->orderBy('class_id');

        if ($allowedGroupIds !== null) {
            $allowedClassSectionIds = ClassSectionGroup::whereIn('id', $allowedGroupIds)
                ->pluck('class_section_id')
                ->unique()
                ->filter()
                ->values()
                ->all();
            $classSectionsQuery->whereIn('id', $allowedClassSectionIds ?: [-1]);
        }

        $classSections = $classSectionsQuery
            ->get(['id', 'academic_session_id', 'class_id', 'section_id', 'is_active'])
            ->map(fn (ClassSection $cs) => [
                'id' => (int) $cs->id,
                'academic_session_id' => (int) $cs->academic_session_id,
                'class_id' => (int) $cs->class_id,
                'section_id' => $cs->section_id !== null ? (int) $cs->section_id : null,
                'class_name' => $cs->class?->name,
                'section_name' => $cs->section?->name,
                'is_active' => (bool) $cs->is_active,
            ])
            ->values();

        $academicSessions = AcademicSession::orderBy('start_date', 'desc')
            ->get(['id', 'name', 'is_active', 'is_current'])
            ->map(fn (AcademicSession $s) => [
                'id' => (int) $s->id,
                'name' => $s->name,
                'is_active' => (bool) $s->is_active,
                'is_current' => (bool) $s->is_current,
            ])
            ->values();

        // Pre-built cascade: session -> classes -> sections (from class sections + enrollments)
        $filterTree = $academicSessions->map(function (array $session) use ($classSections, $enrollments) {
            $sessionId = $session['id'];
            $rows = $classSections->where('academic_session_id', $sessionId)->values();

            // Ensure classes that only appear on enrollments are included
            $enrollmentRows = $enrollments->where('academic_session_id', $sessionId)->values();
            $classIds = $rows->pluck('class_id')
                ->merge($enrollmentRows->pluck('class_id'))
                ->filter()
                ->unique()
                ->values();

            $classes = $classIds->map(function ($classId) use ($rows, $enrollmentRows, $sessionId) {
                $classId = (int) $classId;
                $className = $rows->firstWhere('class_id', $classId)['class_name']
                    ?? $enrollmentRows->firstWhere('class_id', $classId)['class_name']
                    ?? ('Class #'.$classId);

                $sectionIds = $rows->where('class_id', $classId)->pluck('section_id')
                    ->merge($enrollmentRows->where('class_id', $classId)->pluck('section_id'))
                    ->filter(fn ($id) => $id !== null)
                    ->unique()
                    ->values();

                $sections = $sectionIds->map(function ($sectionId) use ($rows, $enrollmentRows, $classId) {
                    $sectionId = (int) $sectionId;
                    $sectionName = $rows->where('class_id', $classId)->firstWhere('section_id', $sectionId)['section_name']
                        ?? $enrollmentRows->where('class_id', $classId)->firstWhere('section_id', $sectionId)['section_name']
                        ?? ('Section #'.$sectionId);

                    return [
                        'id' => $sectionId,
                        'name' => $sectionName,
                    ];
                })->values()->all();

                return [
                    'id' => $classId,
                    'name' => $className,
                    'sections' => $sections,
                ];
            })->values()->all();

            return [
                'id' => $sessionId,
                'name' => $session['name'],
                'classes' => $classes,
            ];
        })->values();

        $filters = [
            'student_enrollment_id' => $studentEnrollmentId,
            'year' => $year,
            'month' => $month,
            'academic_session_id' => $academicSessionId !== null && $academicSessionId !== '' ? (int) $academicSessionId : null,
            'class_id' => $classId !== null && $classId !== '' ? (int) $classId : null,
            'section_id' => $sectionId !== null && $sectionId !== '' ? (int) $sectionId : null,
        ];

        $payload = [
            'enrollment' => null,
            'monthly' => null,
            'monthlyDays' => [],
            'yearly' => null,
            'enrollments' => $enrollments,
            'filters' => $filters,
            'academicSessions' => $academicSessions,
            'filterTree' => $filterTree,
            'classes' => SchoolClass::orderBy('name')->get(['id', 'name', 'is_active'])
                ->map(fn (SchoolClass $c) => [
                    'id' => (int) $c->id,
                    'name' => $c->name,
                    'is_active' => (bool) $c->is_active,
                ])->values(),
            'sections' => Section::orderBy('name')->get(['id', 'name', 'is_active'])
                ->map(fn (Section $s) => [
                    'id' => (int) $s->id,
                    'name' => $s->name,
                    'is_active' => (bool) $s->is_active,
                ])->values(),
            'classSections' => $classSections,
        ];

        if (! $studentEnrollmentId) {
            return Inertia::render('dashboard/attendance/StudentReport', $payload);
        }

        $enrollment = StudentEnrollment::with([
            'student.user',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ])->find($studentEnrollmentId);

        if (! $enrollment) {
            abort(404);
        }
        if ($allowedGroupIds !== null && ! in_array($enrollment->class_section_group_id, $allowedGroupIds, true)) {
            abort(403, 'You can only view student reports for your incharge class(es).');
        }

        $payload['enrollment'] = $enrollment;

        $sessionIdForReport = $academicSessionId !== null && $academicSessionId !== ''
            ? (int) $academicSessionId
            : null;

        if ($month) {
            $monthlyFull = $this->reportService->monthlyDayWiseByStudent(
                (int) $studentEnrollmentId,
                $year,
                (int) $month,
                $sessionIdForReport
            );
            $payload['monthly'] = [
                'year' => $monthlyFull['year'],
                'month' => $monthlyFull['month'],
                'month_label' => $monthlyFull['month_label'],
                'total' => $monthlyFull['total'],
                'present' => $monthlyFull['present'],
                'absent' => $monthlyFull['absent'],
                'late' => $monthlyFull['late'],
                'leave' => $monthlyFull['leave'],
                'percentage' => $monthlyFull['percentage'],
            ];
            $payload['monthlyDays'] = $monthlyFull['days'];
        } else {
            $payload['monthly'] = null;
            $payload['monthlyDays'] = [];
        }

        $payload['yearly'] = $this->reportService->yearlyReportByStudent(
            (int) $studentEnrollmentId,
            $year,
            $sessionIdForReport
        );

        return Inertia::render('dashboard/attendance/StudentReport', $payload);
    }

    /**
     * Download student monthly attendance PDF (date-wise present/absent).
     */
    public function exportStudentMonthlyPdf(Request $request)
    {
        $validated = $request->validate([
            'student_enrollment_id' => 'required|integer|exists:student_enrollments,id',
            'year' => 'required|integer|min:2020|max:2100',
            'month' => 'required|integer|min:1|max:12',
            'academic_session_id' => 'nullable|integer|exists:academic_sessions,id',
        ]);

        $user = $request->user();
        $enrollment = StudentEnrollment::with([
            'student.user',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ])->findOrFail($validated['student_enrollment_id']);

        if ($user->hasRole('teacher') && $user->teacher) {
            $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($user->teacher->id)->all();
            if (! in_array((int) $enrollment->class_section_group_id, $allowedGroupIds, true)) {
                abort(403, 'You can only export reports for your incharge class(es).');
            }
        }

        $sessionId = ! empty($validated['academic_session_id']) ? (int) $validated['academic_session_id'] : null;
        $report = $this->reportService->monthlyDayWiseByStudent(
            (int) $enrollment->id,
            (int) $validated['year'],
            (int) $validated['month'],
            $sessionId
        );

        $student = $enrollment->student;
        $studentName = trim(($student?->first_name ?? '').' '.($student?->last_name ?? ''));
        if ($studentName === '') {
            $studentName = $student?->user?->name ?? 'Student';
        }

        $cs = $enrollment->classSectionGroup?->classSection;
        $classLabel = collect([
            $cs?->academicSession?->name,
            $cs?->class?->name,
            $cs?->section?->name,
            $enrollment->classSectionGroup?->subjectGroup?->name,
        ])->filter()->implode(' · ');

        $pdfBranding = app(SystemSettingService::class)->getPdfBranding();

        try {
            PdfAssets::boostResources();
            PdfAssets::ensureFontDirectory();

            $pdf = Pdf::loadView('pdf.student-monthly-attendance', [
                'schoolName' => $pdfBranding['school_name'],
                'logoSrc' => $pdfBranding['logo_src'],
                'studentName' => $studentName,
                'rollNumber' => $enrollment->roll_number ?? '—',
                'classLabel' => $classLabel ?: '—',
                'report' => $report,
            ])->setPaper('a4', 'portrait');

            $fileSlug = Str::slug($studentName) ?: 'student';
            $filename = $fileSlug.'-attendance-'.$report['year'].'-'.str_pad((string) $report['month'], 2, '0', STR_PAD_LEFT).'.pdf';

            return $pdf->download($filename);
        } catch (Throwable $e) {
            Log::error('Student monthly attendance PDF failed', [
                'enrollment_id' => $enrollment->id,
                'message' => $e->getMessage(),
            ]);

            return redirect()
                ->route('attendance.reports.student', [
                    'student_enrollment_id' => $enrollment->id,
                    'year' => $validated['year'],
                    'month' => $validated['month'],
                    'academic_session_id' => $sessionId,
                ])
                ->with('error', 'PDF download failed. Please try again.');
        }
    }

    public function exportCsv(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'class_section_group_id' => 'nullable|exists:class_section_groups,id',
        ]);

        $classSectionGroupId = $request->class_section_group_id ? (int) $request->class_section_group_id : null;
        $this->restrictExportGroupForTeacher($request->user(), $classSectionGroupId);

        return $this->exportService->exportToCsv(
            (int) $request->academic_session_id,
            $request->date_from,
            $request->date_to,
            $classSectionGroupId
        );
    }

    /**
     * Export to Excel (CSV format, Excel-compatible; for .xlsx use Maatwebsite/Excel).
     */
    public function exportExcel(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'class_section_group_id' => 'nullable|exists:class_section_groups,id',
        ]);

        $classSectionGroupId = $request->class_section_group_id ? (int) $request->class_section_group_id : null;
        $this->restrictExportGroupForTeacher($request->user(), $classSectionGroupId);

        return $this->exportService->exportToExcel(
            (int) $request->academic_session_id,
            $request->date_from,
            $request->date_to,
            $classSectionGroupId
        );
    }

    public function exportPdf(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'date_from' => 'required|date',
            'date_to' => 'required|date|after_or_equal:date_from',
            'class_section_group_id' => 'nullable|exists:class_section_groups,id',
        ]);

        $classSectionGroupId = $request->class_section_group_id ? (int) $request->class_section_group_id : null;
        $this->restrictExportGroupForTeacher($request->user(), $classSectionGroupId);

        $html = $this->exportService->exportToPdfHtml(
            (int) $request->academic_session_id,
            $request->date_from,
            $request->date_to,
            $classSectionGroupId
        );

        return response($html, 200, [
            'Content-Type' => 'text/html; charset=UTF-8',
            'Content-Disposition' => 'inline; filename="attendance-report.pdf"',
        ]);
    }

    /**
     * Teacher incharge can only export for their incharge class(es). If teacher and no group given, abort; if group given, must be in allowed list.
     */
    protected function restrictExportGroupForTeacher($user, ?int $classSectionGroupId): void
    {
        if (! $user->hasRole('teacher') || ! $user->teacher) {
            return;
        }
        $allowedGroupIds = $this->sessionService->getClassSectionGroupIdsForTeacher($user->teacher->id)->all();
        if ($classSectionGroupId === null) {
            abort(403, 'Please select a class to export. You can only export attendance for your incharge class(es).');
        }
        if (! in_array($classSectionGroupId, $allowedGroupIds, true)) {
            abort(403, 'You can only export attendance for your incharge class(es).');
        }
    }
}
