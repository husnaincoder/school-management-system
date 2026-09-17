<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSection;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\StudentEnrollment;
use App\Services\Setting\SystemSettingService;
use App\Support\PdfAssets;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Response;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\StreamedResponse;
use Throwable;

class ClassStudentReportController extends Controller
{
    public function index(Request $request)
    {
        $academicSessions = AcademicSession::orderBy('start_date', 'desc')->get(['id', 'name', 'is_active']);
        $classes = SchoolClass::orderBy('name')->get(['id', 'name', 'is_active']);
        $sections = Section::orderBy('name')->get(['id', 'name', 'is_active']);

        // Flat rows for cascading filters (include inactive so reports still work)
        $classSections = ClassSection::with([
            'class:id,name',
            'section:id,name',
        ])
            ->orderBy('academic_session_id')
            ->orderBy('class_id')
            ->get(['id', 'academic_session_id', 'class_id', 'section_id', 'is_active'])
            ->map(fn (ClassSection $cs) => [
                'id' => $cs->id,
                'academic_session_id' => (int) $cs->academic_session_id,
                'class_id' => (int) $cs->class_id,
                'section_id' => $cs->section_id !== null ? (int) $cs->section_id : null,
                'class_name' => $cs->class?->name,
                'section_name' => $cs->section?->name,
                'is_active' => (bool) $cs->is_active,
            ])
            ->values();

        $filters = $request->only(['academic_session_id', 'class_id', 'section_id']);
        $searched = $request->boolean('searched');

        $students = null;
        if ($searched) {
            $students = $this->baseQuery($request)
                ->orderBy('roll_number')
                ->orderBy('id')
                ->paginate(25)
                ->withQueryString()
                ->through(fn (StudentEnrollment $enrollment) => $this->mapRow($enrollment));
        }

        return inertia('dashboard/academic/ClassStudents', [
            'academicSessions' => $academicSessions,
            'classes' => $classes,
            'sections' => $sections,
            'classSections' => $classSections,
            'students' => $students,
            'filters' => $filters,
            'searched' => $searched,
        ]);
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $ids = $request->input('ids', []);
        $ids = is_array($ids) ? array_filter(array_map('intval', $ids)) : [];

        $query = $this->baseQuery($request)->orderBy('roll_number')->orderBy('id');
        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $rows = $query->limit(10000)->get();
        if ($rows->isEmpty()) {
            return Response::streamDownload(function () {
                echo 'No students to export.';
            }, 'class-students-empty.csv', ['Content-Type' => 'text/csv']);
        }

        $filename = 'class-students-' . now()->format('Y-m-d-His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return Response::streamDownload(function () use ($rows) {
            $out = fopen('php://output', 'w');
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'Admission No',
                'Roll No',
                'Student Name',
                'Session',
                'Class',
                'Section',
                'Father Name',
                'Date of Birth',
                'Gender',
                'Father Mobile',
            ]);

            foreach ($rows as $en) {
                $student = $en->student;
                $parentUser = $student?->parent?->user;
                $cs = $en->classSectionGroup?->classSection;

                $name = $student?->full_name ?? ($student?->user?->name ?? '—');
                $session = $cs?->academicSession?->name ?? '';
                $class = $cs?->class?->name ?? '';
                $section = $cs?->section?->name ?? '';

                fputcsv($out, [
                    $student?->admission_number ?? '',
                    $en->roll_number ?? '',
                    $name,
                    $session,
                    $class,
                    $section,
                    $parentUser?->name ?? '',
                    $student?->date_of_birth?->format('Y-m-d') ?? '',
                    $student?->gender ?? '',
                    $parentUser?->phone ?? '',
                ]);
            }

            fclose($out);
        }, $filename, $headers);
    }

    public function exportPdf(Request $request)
    {
        $ids = $request->input('ids', []);
        $ids = is_array($ids) ? array_filter(array_map('intval', $ids)) : [];

        $query = $this->baseQuery($request)->orderBy('roll_number')->orderBy('id');
        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $rows = $query->limit(3000)->get();
        if ($rows->isEmpty()) {
            return redirect()->route('academic.class-students')->with('error', 'No students to export.');
        }

        $pdfBranding = app(SystemSettingService::class)->getPdfBranding();
        $filters = $request->only(['academic_session_id', 'class_id', 'section_id']);
        $filterLabels = $this->resolveFilterLabels($request);

        try {
            PdfAssets::boostResources();
            PdfAssets::ensureFontDirectory();

            $pdf = Pdf::loadView('pdf.class-students-export', [
                'rows' => $rows,
                'schoolName' => $pdfBranding['school_name'],
                'logoSrc' => $pdfBranding['logo_src'],
                'filters' => $filters,
                'filterLabels' => $filterLabels,
                'selectedCount' => ! empty($ids) ? count($ids) : null,
            ])->setPaper('a4', 'landscape');

            return $pdf->download('class-students-' . now()->format('Y-m-d-His') . '.pdf');
        } catch (Throwable $e) {
            Log::error('Class students PDF export failed', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return redirect()
                ->route('academic.class-students', array_filter([
                    'academic_session_id' => $request->get('academic_session_id'),
                    'class_id' => $request->get('class_id'),
                    'section_id' => $request->get('section_id'),
                    'searched' => 1,
                ]))
                ->with('error', 'PDF export failed. Please try again or contact support.');
        }
    }

    public function print(StudentEnrollment $enrollment)
    {
        $enrollment->load([
            'student.user',
            'student.parent.user',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        $student = $enrollment->student;
        if (! $student) {
            return redirect()->route('academic.class-students')->with('error', 'Student not found.');
        }

        $parent = $student->parent;
        $user = $student->user;
        $parentUser = $parent?->user;
        $cs = $enrollment->classSectionGroup?->classSection;
        $group = $enrollment->classSectionGroup?->subjectGroup;

        $studentName = trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? ''));
        if ($studentName === '') {
            $studentName = $user?->name ?? 'Student';
        }

        $settings = app(SystemSettingService::class);
        $pdfBranding = $settings->getPdfBranding();

        $relation = $parent?->relation_with_student ?? 'Father';
        $isFather = strcasecmp($relation, 'Father') === 0;
        $isMother = strcasecmp($relation, 'Mother') === 0;

        $studentPhotoPath = $settings->resolveLocalFilePath($student->profile_photo);
        $parentPhotoPath = $settings->resolveLocalFilePath($parent?->photo);

        $pdfData = [
            'schoolName' => $pdfBranding['school_name'],
            'logoSrc' => $pdfBranding['logo_src'],
            'studentPhotoSrc' => PdfAssets::dataUri($studentPhotoPath, 220),
            'parentPhotoSrc' => PdfAssets::dataUri($parentPhotoPath, 220),
            'student' => [
                'name' => $studentName,
                'admission_no' => $student->admission_number ?? '—',
                'roll_no' => $enrollment->roll_number ?? $student->admission_number ?? '—',
                'class' => $cs?->class?->name ?? '—',
                'section' => $cs?->section?->name ?? '—',
                'session' => $cs?->academicSession?->name ?? '—',
                'group' => $group?->name ?? '—',
                'gender' => $student->gender ? ucfirst($student->gender) : '—',
                'admission_date' => $enrollment->admission_date?->format('d M Y') ?? '—',
                'date_of_birth' => $student->date_of_birth?->format('d M Y') ?? '—',
                'cnic' => $student->cnic ?? '—',
                'mobile' => $user?->phone ?? '—',
                'email' => $user?->email ?? '—',
                'address' => $student->address ?? '—',
                'id_card_number' => $user?->id_card_number ?? '—',
            ],
            'parent' => [
                'father_name' => $isFather ? ($parentUser?->name ?? '—') : ($isMother ? ($parent?->spouse_name ?? '—') : ($parentUser?->name ?? '—')),
                'father_phone' => $isFather || ! $isMother ? ($parentUser?->phone ?? '—') : '—',
                'father_occupation' => $isFather || ! $isMother ? ($parent?->occupation ?? '—') : '—',
                'father_cnic' => $parent?->father_cnic ?? '—',
                'mother_name' => $isMother ? ($parentUser?->name ?? '—') : ($parent?->spouse_name ?? '—'),
                'mother_phone' => '—',
                'mother_occupation' => '—',
                'guardian_name' => $parent?->spouse_name ?: ($parentUser?->name ?? '—'),
                'guardian_email' => $parentUser?->email ?? '—',
                'guardian_relation' => $relation,
                'guardian_phone' => $parentUser?->phone ?? '—',
                'guardian_occupation' => $parent?->occupation ?? '—',
                'address' => $parent?->address ?? '—',
                'city' => $parent?->city ?? '—',
                'state' => $parent?->state ?? '—',
                'postal_code' => $parent?->postal_code ?? '—',
                'country' => $parent?->country ?? '—',
            ],
        ];

        try {
            PdfAssets::boostResources();
            PdfAssets::ensureFontDirectory();

            $pdf = Pdf::loadView('pdf.student-profile', $pdfData)->setPaper('a4', 'portrait');

            $fileSlug = Str::slug($studentName) ?: 'student';
            $fileNo = $student->admission_number ?? $enrollment->roll_number ?? $enrollment->id;

            return $pdf->download($fileSlug . '_' . $fileNo . '.pdf');
        } catch (Throwable $e) {
            Log::error('Student profile PDF print failed', [
                'enrollment_id' => $enrollment->id,
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);

            return redirect()
                ->route('academic.class-students')
                ->with('error', 'Print/PDF failed. Please try again or contact support.');
        }
    }

    private function baseQuery(Request $request)
    {
        $query = StudentEnrollment::with([
            'student.user',
            'student.parent.user',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
        ])->where('status', 'active');

        if ($request->filled('academic_session_id') || $request->filled('class_id') || $request->filled('section_id')) {
            $query->whereHas('classSectionGroup.classSection', function ($q) use ($request) {
                if ($request->filled('academic_session_id')) {
                    $q->where('academic_session_id', $request->academic_session_id);
                }
                if ($request->filled('class_id')) {
                    $q->where('class_id', $request->class_id);
                }
                if ($request->filled('section_id')) {
                    $q->where('section_id', $request->section_id);
                }
            });
        }

        return $query;
    }

    private function resolveFilterLabels(Request $request): array
    {
        $labels = [];

        if ($request->filled('academic_session_id')) {
            $labels['session'] = AcademicSession::find($request->academic_session_id)?->name ?? '—';
        }
        if ($request->filled('class_id')) {
            $labels['class'] = SchoolClass::find($request->class_id)?->name ?? '—';
        }
        if ($request->filled('section_id')) {
            $labels['section'] = Section::find($request->section_id)?->name ?? '—';
        }

        return $labels;
    }

    private function mapRow(StudentEnrollment $enrollment): array
    {
        $student = $enrollment->student;
        $parent = $student?->parent;
        $cs = $enrollment->classSectionGroup?->classSection;
        $session = $cs?->academicSession?->name ?? '';
        $className = $cs?->class?->name ?? '';
        $sectionName = $cs?->section?->name ?? '';
        $classLabel = collect([$className, $sectionName])->filter()->implode(' · ');

        $name = trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? ''));
        if ($name === '') {
            $name = $student?->user?->name ?? '—';
        }

        return [
            'id' => $enrollment->id,
            'student_id' => $student?->id,
            'admission_roll' => $enrollment->roll_number ?: ($student?->admission_number ?? '—'),
            'student_name' => $name,
            'class_label' => $classLabel ?: '—',
            'session_name' => $session ?: '—',
            'father_name' => $parent?->user?->name ?? '—',
            'date_of_birth' => $student?->date_of_birth?->format('Y-m-d') ?? '—',
            'gender' => $student?->gender ? ucfirst($student->gender) : '—',
            'father_mobile' => $parent?->user?->phone ?? '—',
        ];
    }
}
