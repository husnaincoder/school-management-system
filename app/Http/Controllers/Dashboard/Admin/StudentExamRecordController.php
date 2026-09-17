<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\StudentEnrollment;
use App\Models\StudentExamRecord;
use Illuminate\Http\Request;

class StudentExamRecordController extends Controller
{
    use AuthorizesExamAccess;

    /**
     * Marks entry page for an exam: list enrollments (students) and exam subjects, with grid of obtained_marks and attendance_status.
     */
    public function marksEntry(Exam $exam)
    {
        $this->authorizeExamForTeacher($exam);

        $exam->load([
            'academicSession',
            'examType',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'examSubjects.subject',
        ]);

        $classSectionGroupId = $exam->class_section_group_id;
        $enrollments = StudentEnrollment::where('class_section_group_id', $classSectionGroupId)
            ->with(['student.user'])
            ->orderBy('roll_number')
            ->get();

        $examSubjectIds = $exam->examSubjects->pluck('id')->toArray();
        $enrollmentIds = $enrollments->pluck('id')->toArray();

        $records = StudentExamRecord::whereIn('exam_subject_id', $examSubjectIds)
            ->whereIn('student_enrollment_id', $enrollmentIds)
            ->get();

        $recordsByKey = [];
        foreach ($records as $r) {
            $key = $r->exam_subject_id . '_' . $r->student_enrollment_id;
            $recordsByKey[$key] = [
                'obtained_marks' => $r->obtained_marks !== null ? (float) $r->obtained_marks : '',
                'attendance_status' => $r->attendance_status,
            ];
        }

        return inertia('dashboard/academic/ExamMarksEntry', [
            'exam' => $exam,
            'enrollments' => $enrollments,
            'recordsByKey' => $recordsByKey,
        ]);
    }

    /**
     * Bulk create/update student exam records for this exam.
     */
    public function storeBulk(Request $request, Exam $exam)
    {
        $this->authorizeExamForTeacher($exam);

        $validated = $request->validate([
            'records' => 'required|array',
            'records.*.exam_subject_id' => 'required|exists:exam_subjects,id',
            'records.*.student_enrollment_id' => 'required|exists:student_enrollments,id',
            'records.*.obtained_marks' => 'nullable|numeric|min:0',
            'records.*.attendance_status' => 'required|in:present,absent,leave',
        ]);

        $examSubjectIds = $exam->examSubjects->pluck('id')->toArray();

        foreach ($validated['records'] as $row) {
            if (! in_array((int) $row['exam_subject_id'], $examSubjectIds, true)) {
                continue;
            }

            $obtainedMarks = isset($row['obtained_marks']) && $row['obtained_marks'] !== '' && $row['obtained_marks'] !== null
                ? (float) $row['obtained_marks']
                : null;

            StudentExamRecord::updateOrCreate(
                [
                    'exam_subject_id' => $row['exam_subject_id'],
                    'student_enrollment_id' => $row['student_enrollment_id'],
                ],
                [
                    'obtained_marks' => $obtainedMarks,
                    'attendance_status' => $row['attendance_status'],
                ]
            );
        }

        return back()->with('success', 'Marks saved successfully.');
    }
}
