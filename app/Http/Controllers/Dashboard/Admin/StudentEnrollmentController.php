<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\ClassSectionGroup;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class StudentEnrollmentController extends Controller
{
    /**
     * List enrollments. Pass unenrolled students and class section groups for create form.
     */
    public function index(Request $request)
    {
        $enrollments = $this->baseQuery($request)->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate(15);

        $enrolledStudentIds = StudentEnrollment::pluck('student_id')->toArray();
        $studentsWithoutEnrollment = Student::with('user')
            ->whereNotIn('id', $enrolledStudentIds)
            ->orderBy('id')
            ->get();

        $classSectionGroups = ClassSectionGroup::with(
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'subjectGroup'
        )->orderBy('class_section_id')->orderBy('subject_group_id')->get();

        return inertia('dashboard/academic/Enrollments', [
            'enrollments' => $enrollments,
            'studentsWithoutEnrollment' => $studentsWithoutEnrollment,
            'classSectionGroups' => $classSectionGroups,
            'filters' => $request->only(['search', 'class_section_group_id', 'status']),
        ]);
    }

    /**
     * Show single enrollment.
     */
    public function show(StudentEnrollment $enrollment)
    {
        $enrollment->load([
            'student.user',
            'student.parent.user',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);
        return inertia('dashboard/academic/EnrollmentShow', ['enrollment' => $enrollment]);
    }

    /**
     * Create enrollment – student must not already have an active enrollment.
     * Soft-deleted enrollments are restored and updated (unique student_id includes trashed rows).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_id' => [
                'required',
                'exists:students,id',
                Rule::unique('student_enrollments', 'student_id')->whereNull('deleted_at'),
            ],
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'roll_number' => 'nullable|string|max:50',
            'admission_date' => 'nullable|date',
            'status' => 'nullable|string|in:active,promoted,left',
        ]);

        $validated['status'] = $validated['status'] ?? 'active';

        if (blank($validated['roll_number'] ?? null)) {
            $group = ClassSectionGroup::find($validated['class_section_group_id']);
            if ($group) {
                $validated['roll_number'] = \App\Services\Student\StudentRollNumberService::nextForGroup($group);
            }
        }

        $wasRestored = StudentEnrollment::withTrashed()
            ->where('student_id', $validated['student_id'])
            ->onlyTrashed()
            ->exists();

        StudentEnrollment::enrollOrRestore($validated);

        return back()->with(
            'success',
            $wasRestored ? 'Enrollment restored successfully.' : 'Enrollment created successfully.'
        );
    }

    /**
     * Update enrollment.
     */
    public function update(Request $request, StudentEnrollment $enrollment)
    {
        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'roll_number' => 'nullable|string|max:50',
            'admission_date' => 'nullable|date',
            'status' => 'nullable|string|in:active,promoted,left',
        ]);

        $enrollment->update($validated);

        return back()->with('success', 'Enrollment updated.');
    }

    /**
     * Soft delete enrollment.
     */
    public function destroy(StudentEnrollment $enrollment)
    {
        $enrollment->delete();
        return back()->with('success', 'Enrollment removed.');
    }

    public function exportCsv(Request $request): StreamedResponse
    {
        $ids = $request->input('ids', []);
        $ids = is_array($ids) ? array_filter(array_map('intval', $ids)) : [];

        $query = $this->baseQuery($request)->orderBy('created_at', 'desc');
        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $enrollments = $query->limit(10000)->get();
        if ($enrollments->isEmpty()) {
            return Response::streamDownload(function () {
                echo 'No enrollments to export.';
            }, 'enrollments-empty.csv', ['Content-Type' => 'text/csv']);
        }

        $filename = 'enrollments-' . now()->format('Y-m-d-His') . '.csv';
        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ];

        return Response::streamDownload(function () use ($enrollments) {
            $out = fopen('php://output', 'w');
            // Excel-friendly UTF-8 BOM
            fwrite($out, "\xEF\xBB\xBF");

            fputcsv($out, [
                'Student',
                'Admission No',
                'Email',
                'Session',
                'Class',
                'Section',
                'Group',
                'Roll No',
                'Admission Date',
                'Status',
            ]);

            foreach ($enrollments as $en) {
                $student = $en->student;
                $user = $student?->user;
                $csg = $en->classSectionGroup;
                $cs = $csg?->classSection;
                $session = $cs?->academicSession?->name ?? '';
                $cls = $cs?->class?->name ?? '';
                $sec = $cs?->section?->name ?? '';
                $grp = $csg?->subjectGroup?->name ?? '';

                $name = trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? ''));
                if ($name === '') {
                    $name = $user?->name ?? '';
                }

                fputcsv($out, [
                    $name,
                    $student?->admission_number ?? '',
                    $user?->email ?? '',
                    $session,
                    $cls,
                    $sec,
                    $grp,
                    $en->roll_number ?? '',
                    $en->admission_date?->format('Y-m-d') ?? '',
                    $en->status ?? '',
                ]);
            }

            fclose($out);
        }, $filename, $headers);
    }

    public function exportPdf(Request $request)
    {
        $ids = $request->input('ids', []);
        $ids = is_array($ids) ? array_filter(array_map('intval', $ids)) : [];

        $query = $this->baseQuery($request)->orderBy('created_at', 'desc');
        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        }

        $enrollments = $query->limit(2000)->get();
        if ($enrollments->isEmpty()) {
            return redirect()->route('academic.enrollments')->with('error', 'No enrollments to export.');
        }

        $schoolName = config('school.name', 'School');
        $logoPath = null;
        $logoRel = config('school.logo_path');
        if ($logoRel && is_file(public_path($logoRel))) {
            $logoPath = public_path($logoRel);
        }

        $filters = $request->only(['search', 'class_section_group_id', 'status']);
        $pdf = Pdf::loadView('pdf.enrollments-export', [
            'enrollments' => $enrollments,
            'schoolName' => $schoolName,
            'logoPath' => $logoPath,
            'filters' => $filters,
            'selectedCount' => ! empty($ids) ? count($ids) : null,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('enrollments-' . now()->format('Y-m-d-His') . '.pdf');
    }

    private function baseQuery(Request $request)
    {
        $query = StudentEnrollment::with([
            'student.user',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        if ($request->filled('class_section_group_id')) {
            $query->where('class_section_group_id', $request->class_section_group_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $search = $request->search;
            $query->whereHas('student', function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('admission_number', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
            });
        }

        return $query;
    }
}
