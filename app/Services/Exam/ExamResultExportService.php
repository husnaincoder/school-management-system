<?php

namespace App\Services\Exam;

use App\Models\Exam;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\StudentExamRecord;
use App\Models\StudentExamResult;
use App\Services\Setting\SystemSettingService;
use App\Support\PdfAssets;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ExamResultExportService
{
    /**
     * Build CSV result sheet and return stream response.
     *
     * @param  array<int>  $enrollmentIds  Empty = all enrollments for exam's class_section_group; otherwise only these IDs.
     */
    public function resultSheet(Exam $exam, array $enrollmentIds = []): Response
    {
        $exam->load(['examSubjects.subject', 'classSectionGroup.classSection.class', 'classSectionGroup.classSection.section']);
        $classSectionGroupId = $exam->class_section_group_id;

        $enrollments = StudentEnrollment::where('class_section_group_id', $classSectionGroupId)
            ->with(['student.user'])
            ->orderBy('roll_number')
            ->get();

        if (! empty($enrollmentIds)) {
            $enrollments = $enrollments->whereIn('id', $enrollmentIds)->values();
        }

        $examSubjectIds = $exam->examSubjects->pluck('id')->toArray();
        $enrollmentIdsList = $enrollments->pluck('id')->toArray();

        $records = StudentExamRecord::whereIn('exam_subject_id', $examSubjectIds)
            ->whereIn('student_enrollment_id', $enrollmentIdsList)
            ->get();

        $recordsByKey = [];
        foreach ($records as $r) {
            $key = $r->student_enrollment_id . '_' . $r->exam_subject_id;
            $recordsByKey[$key] = $r->obtained_marks;
        }

        $results = StudentExamResult::where('exam_id', $exam->id)
            ->whereIn('student_enrollment_id', $enrollmentIdsList)
            ->get()
            ->keyBy('student_enrollment_id');

        $subjectHeaders = $exam->examSubjects->sortBy('sort_order')->map(fn ($es) => $es->subject->name ?? 'Subject#' . $es->id)->values()->all();
        $headers = array_merge(['Roll No', 'Student'], $subjectHeaders, ['Total', 'Obtained', 'Percentage', 'Grade', 'Grade Point', 'Position', 'Status']);
        $rows = [];
        $rows[] = $headers;

        foreach ($enrollments as $en) {
            $studentName = $en->student->user->name ?? $en->student->first_name . ' ' . $en->student->last_name ?? '—';
            $row = [$en->roll_number ?? '—', $studentName];
            $obtainedSum = 0;
            foreach ($exam->examSubjects->sortBy('sort_order') as $es) {
                $key = $en->id . '_' . $es->id;
                $marks = $recordsByKey[$key] ?? '';
                $row[] = $marks !== '' ? $marks : '—';
                if (is_numeric($marks)) {
                    $obtainedSum += (float) $marks;
                }
            }
            $res = $results->get($en->id);
            $row[] = $res ? $res->total_marks : '—';
            $row[] = $res ? $res->obtained_marks : '—';
            $row[] = $res ? $res->percentage . '%' : '—';
            $row[] = $res ? ($res->grade ?? '—') : '—';
            $row[] = $res && $res->grade_point !== null ? $res->grade_point : '—';
            $row[] = $res && $res->position !== null ? $res->position : '—';
            $row[] = $res ? ($res->is_passed ? 'Pass' : 'Fail') : 'Absent';
            $rows[] = $row;
        }

        $filename = 'result-sheet-' . Str::slug($exam->name) . '-' . now()->format('Y-m-d') . '.csv';
        $callback = function () use ($rows) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF));
            foreach ($rows as $row) {
                fputcsv($out, $row);
            }
            fclose($out);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="' . $filename . '"',
        ]);
    }

    /**
     * Build merit list PDF and return download response.
     *
     * @param  array<int>  $enrollmentIds  Empty = use limit by percentage; otherwise only these IDs.
     * @param  int|null  $limit  Used only when enrollmentIds is empty; default 15, max 100.
     */
    public function meritList(Exam $exam, array $enrollmentIds = [], ?int $limit = 15): Response
    {
        $limit = $limit === null ? 15 : min(max((int) $limit, 1), 100);

        $exam->load([
            'academicSession',
            'examType',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
        ]);

        $query = StudentExamResult::where('exam_id', $exam->id)
            ->with(['studentEnrollment.student.user'])
            ->orderBy('percentage', 'desc');

        if (! empty($enrollmentIds)) {
            $query->whereIn('student_enrollment_id', $enrollmentIds);
        } else {
            $query->limit($limit);
        }

        $results = $query->get();

        $classLabel = $exam->classSectionGroup && $exam->classSectionGroup->classSection
            ? ($exam->classSectionGroup->classSection->class->name ?? '') . ' - ' . ($exam->classSectionGroup->classSection->section->name ?? '')
            : 'Class';

        $html = view('pdf.merit-list', [
            'exam' => $exam,
            'results' => $results,
            'classLabel' => $classLabel,
        ])->render();

        $pdf = Pdf::loadHTML($html)->setPaper('a4', 'portrait');
        $filename = 'merit-list-' . Str::slug($exam->name) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Build printable result card PDF (subject-wise marks + totals + grade).
     *
     * @param  array<int>  $enrollmentIds  Empty = all enrollments for exam's class section group.
     */
    public function resultCards(Exam $exam, array $enrollmentIds = []): Response
    {
        $exam->load([
            'examSubjects.subject',
            'academicSession',
            'examType',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
        ]);

        $classSectionGroupId = $exam->class_section_group_id;

        $enrollments = StudentEnrollment::where('class_section_group_id', $classSectionGroupId)
            ->with([
                'student.user',
                'student.parent.user',
                'classSectionGroup.classSection.class',
                'classSectionGroup.classSection.section',
            ])
            ->orderBy('roll_number')
            ->get();

        if (! empty($enrollmentIds)) {
            $enrollments = $enrollments->whereIn('id', $enrollmentIds)->values();
        }

        $examSubjects = $exam->examSubjects->sortBy('sort_order')->values();
        $examSubjectIds = $examSubjects->pluck('id')->all();
        $enrollmentIdsList = $enrollments->pluck('id')->all();

        $records = StudentExamRecord::whereIn('exam_subject_id', $examSubjectIds)
            ->whereIn('student_enrollment_id', $enrollmentIdsList)
            ->get();

        $recordsByKey = [];
        foreach ($records as $record) {
            $recordsByKey[$record->student_enrollment_id . '_' . $record->exam_subject_id] = $record;
        }

        $results = StudentExamResult::where('exam_id', $exam->id)
            ->whereIn('student_enrollment_id', $enrollmentIdsList)
            ->get()
            ->keyBy('student_enrollment_id');

        $cs = $exam->classSectionGroup?->classSection;
        $classLabel = $cs
            ? trim(($cs->class->name ?? '') . ' - ' . ($cs->section->name ?? ''), ' -')
            : 'Class';

        $cards = [];
        foreach ($enrollments as $enrollment) {
            $student = $enrollment->student;
            $studentName = $student?->user?->name
                ?: trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? ''));
            $studentName = $studentName !== '' ? $studentName : '—';

            $enCs = $enrollment->classSectionGroup?->classSection ?? $cs;
            $subjects = [];
            $sumMax = 0.0;
            $sumObtained = 0.0;

            foreach ($examSubjects as $examSubject) {
                $max = (float) ($examSubject->total_marks ?? 0);
                $sumMax += $max;
                $key = $enrollment->id . '_' . $examSubject->id;
                $record = $recordsByKey[$key] ?? null;
                $attendance = $record?->attendance_status;
                $obtainedRaw = $record?->obtained_marks;
                $obtainedNumeric = is_numeric($obtainedRaw) ? (float) $obtainedRaw : null;

                if ($obtainedNumeric !== null) {
                    $sumObtained += $obtainedNumeric;
                }

                $subjectPct = ($obtainedNumeric !== null && $max > 0)
                    ? round(($obtainedNumeric / $max) * 100, 2) . '%'
                    : '—';

                $remarks = '';
                if ($attendance === StudentExamRecord::ATTENDANCE_ABSENT) {
                    $remarks = 'Absent';
                } elseif ($attendance === StudentExamRecord::ATTENDANCE_LEAVE) {
                    $remarks = 'Leave';
                } elseif ($obtainedNumeric !== null && $examSubject->passing_marks !== null) {
                    $remarks = $obtainedNumeric >= (float) $examSubject->passing_marks ? 'Pass' : 'Fail';
                }

                $subjects[] = [
                    'name' => $examSubject->subject->name ?? ('Subject #' . $examSubject->id),
                    'max_marks' => $max > 0 ? rtrim(rtrim(number_format($max, 2, '.', ''), '0'), '.') : '',
                    'obtained' => $obtainedNumeric !== null
                        ? rtrim(rtrim(number_format($obtainedNumeric, 2, '.', ''), '0'), '.')
                        : '',
                    'percentage' => $subjectPct === '—' ? '' : $subjectPct,
                    'remarks' => $remarks,
                ];
            }

            // Pad blank subject rows so the card matches the printed template layout.
            while (count($subjects) < 7) {
                $subjects[] = [
                    'name' => '',
                    'max_marks' => '',
                    'obtained' => '',
                    'percentage' => '',
                    'remarks' => '',
                ];
            }

            $result = $results->get($enrollment->id);
            $totalMax = $result?->total_marks !== null ? (float) $result->total_marks : $sumMax;
            $totalObtained = $result?->obtained_marks !== null ? (float) $result->obtained_marks : $sumObtained;
            $percentage = $result?->percentage !== null
                ? rtrim(rtrim(number_format((float) $result->percentage, 2, '.', ''), '0'), '.') . '%'
                : ($totalMax > 0 ? round(($totalObtained / $totalMax) * 100, 2) . '%' : '—');

            $status = $result
                ? ($result->is_passed ? 'Pass' : 'Fail')
                : ($sumObtained > 0 || count(array_filter($subjects, fn ($s) => $s['obtained'] !== '—')) > 0 ? '—' : 'Absent');

            $grade = $result?->grade ?: '—';
            $position = $result?->position !== null ? $this->ordinal((int) $result->position) : '—';

            $cards[] = [
                'student_name' => $studentName,
                'father_name' => $this->resolveFatherName($student),
                'class_name' => $enCs?->class?->name ?? '—',
                'section_name' => $enCs?->section?->name ?? '—',
                'roll_number' => $enrollment->roll_number ?? '—',
                'subjects' => $subjects,
                'total_max' => rtrim(rtrim(number_format($totalMax, 2, '.', ''), '0'), '.') ?: '0',
                'total_obtained' => rtrim(rtrim(number_format($totalObtained, 2, '.', ''), '0'), '.') ?: '0',
                'percentage' => $percentage,
                'grade' => $grade,
                'position' => $position,
                'status' => $status,
                'overall_remarks' => '',
            ];
        }

        if ($cards === []) {
            abort(404, 'No students found to print result cards.');
        }

        $branding = app(SystemSettingService::class)->getPdfBranding();
        $typeName = trim((string) ($exam->examType?->name ?? ''));
        $cardTitle = $typeName !== '' ? $typeName . ' Result Card' : 'Annual Result Card';

        $addressParts = array_filter([
            trim((string) config('school.address', '')),
            trim((string) config('school.phone', '')) !== ''
                ? 'Cell # ' . trim((string) config('school.phone'))
                : '',
        ]);
        $schoolAddress = implode(' ', $addressParts);

        PdfAssets::boostResources();
        PdfAssets::ensureFontDirectory();

        $pdf = Pdf::loadView('pdf.result-card', [
            'exam' => $exam,
            'cards' => $cards,
            'schoolName' => $branding['school_name'] ?? config('app.name', 'School'),
            'logoSrc' => $branding['logo_src'] ?? null,
            'schoolAddress' => $schoolAddress,
            'classLabel' => $classLabel,
            'cardTitle' => $cardTitle,
        ])->setPaper('a4', 'portrait');

        $filename = 'result-cards-' . Str::slug($exam->name) . '-' . now()->format('Y-m-d') . '.pdf';

        return $pdf->download($filename);
    }

    private function resolveFatherName(?Student $student): string
    {
        $parent = $student?->parent;
        if (! $parent) {
            return '—';
        }

        $relation = $parent->relation_with_student ?? 'Father';
        $parentUser = $parent->user;

        if ($relation === 'Father') {
            return $parentUser?->name ?? '—';
        }

        if ($relation === 'Mother') {
            return $parent->spouse_name ?: '—';
        }

        return $parentUser?->name ?? $parent->spouse_name ?? '—';
    }

    private function ordinal(int $number): string
    {
        if ($number <= 0) {
            return (string) $number;
        }

        $mod100 = $number % 100;
        if ($mod100 >= 11 && $mod100 <= 13) {
            return $number . 'th';
        }

        return $number . match ($number % 10) {
            1 => 'st',
            2 => 'nd',
            3 => 'rd',
            default => 'th',
        };
    }

}
