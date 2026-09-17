<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\GradeScale;
use App\Models\StudentEnrollment;
use App\Models\StudentExamRecord;
use App\Models\StudentExamResult;
use App\Services\Exam\ExamResultExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StudentExamResultController extends Controller
{
    use AuthorizesExamAccess;

    /**
     * Results & Statistics: list results with summary stats and performance metrics.
     * Position is kept as entered (manual); use "Recalculate positions" to auto-rank by percentage if needed.
     */
    public function index(Exam $exam)
    {
        $this->authorizeExamForTeacher($exam);

        $exam->load([
            'academicSession',
            'examType',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        $classSectionGroupId = $exam->class_section_group_id;
        $enrollments = StudentEnrollment::where('class_section_group_id', $classSectionGroupId)
            ->with([
                'student.user',
                'classSectionGroup.classSection.academicSession',
                'classSectionGroup.classSection.class',
                'classSectionGroup.classSection.section',
                'classSectionGroup.subjectGroup',
            ])
            ->orderBy('roll_number')
            ->get()
            ->map(function (StudentEnrollment $en) {
                $cs = $en->classSectionGroup?->classSection;
                $student = $en->student;
                $name = trim(($student?->first_name ?? '').' '.($student?->last_name ?? ''));
                if ($name === '') {
                    $name = $student?->user?->name ?? 'Student';
                }

                return [
                    'id' => (int) $en->id,
                    'roll_number' => $en->roll_number,
                    'student_name' => $name,
                    'student' => $student,
                    'class_section_group_id' => (int) $en->class_section_group_id,
                    'academic_session_id' => $cs?->academic_session_id !== null ? (int) $cs->academic_session_id : null,
                    'class_id' => $cs?->class_id !== null ? (int) $cs->class_id : null,
                    'section_id' => $cs?->section_id !== null ? (int) $cs->section_id : null,
                    'session_name' => $cs?->academicSession?->name,
                    'class_name' => $cs?->class?->name,
                    'section_name' => $cs?->section?->name,
                    'group_name' => $en->classSectionGroup?->subjectGroup?->name,
                ];
            })
            ->values();

        $cs = $exam->classSectionGroup?->classSection;
        $sessionId = $exam->academic_session_id !== null
            ? (int) $exam->academic_session_id
            : ($cs?->academic_session_id !== null ? (int) $cs->academic_session_id : null);
        $classId = $cs?->class_id !== null ? (int) $cs->class_id : null;
        $sectionId = $cs?->section_id !== null ? (int) $cs->section_id : null;

        $filterDefaults = [
            'academic_session_id' => $sessionId,
            'class_id' => $classId,
            'section_id' => $sectionId,
            'session_name' => $exam->academicSession?->name ?? $cs?->academicSession?->name,
            'class_name' => $cs?->class?->name,
            'section_name' => $cs?->section?->name,
        ];

        $filterTree = [];
        if ($sessionId) {
            $filterTree[] = [
                'id' => $sessionId,
                'name' => $filterDefaults['session_name'] ?? ('Session #'.$sessionId),
                'classes' => $classId ? [[
                    'id' => $classId,
                    'name' => $filterDefaults['class_name'] ?? ('Class #'.$classId),
                    'sections' => $sectionId ? [[
                        'id' => $sectionId,
                        'name' => $filterDefaults['section_name'] ?? ('Section #'.$sectionId),
                    ]] : [],
                ]] : [],
            ];
        }

        // Ensure enrollment rows always carry session/class/section for client-side filtering
        $enrollments = $enrollments->map(function (array $en) use ($filterDefaults) {
            $en['academic_session_id'] = $en['academic_session_id'] ?? $filterDefaults['academic_session_id'];
            $en['class_id'] = $en['class_id'] ?? $filterDefaults['class_id'];
            $en['section_id'] = $en['section_id'] ?? $filterDefaults['section_id'];
            $en['session_name'] = $en['session_name'] ?? $filterDefaults['session_name'];
            $en['class_name'] = $en['class_name'] ?? $filterDefaults['class_name'];
            $en['section_name'] = $en['section_name'] ?? $filterDefaults['section_name'];

            return $en;
        })->values();

        $results = StudentExamResult::where('exam_id', $exam->id)
            ->with(['studentEnrollment.student.user', 'gradeScale'])
            ->orderBy('position')
            ->orderBy('percentage', 'desc')
            ->get();

        $totalStudents = $enrollments->count();
        $passedCount = $results->where('is_passed', true)->count();
        $failedCount = $results->where('is_passed', false)->count();

        // Absent = only students who have all subject records with attendance_status = 'absent' for this exam (not "no result yet")
        $examSubjectIds = $exam->examSubjects()->pluck('id')->toArray();
        $enrollmentIdsWithResult = $results->pluck('student_enrollment_id')->toArray();
        $enrollmentIdsWithoutResult = $enrollments->pluck('id')->diff($enrollmentIdsWithResult)->values()->toArray();
        $absentCount = 0;
        if (! empty($examSubjectIds) && ! empty($enrollmentIdsWithoutResult)) {
            $recordsByEnrollment = StudentExamRecord::whereIn('exam_subject_id', $examSubjectIds)
                ->whereIn('student_enrollment_id', $enrollmentIdsWithoutResult)
                ->selectRaw('student_enrollment_id, COUNT(*) as total, SUM(CASE WHEN attendance_status = ? THEN 1 ELSE 0 END) as absent_cnt', [StudentExamRecord::ATTENDANCE_ABSENT])
                ->groupBy('student_enrollment_id')
                ->get();
            foreach ($recordsByEnrollment as $row) {
                if ($row->total > 0 && (int) $row->absent_cnt === (int) $row->total) {
                    $absentCount++;
                }
            }
        }

        $percentages = $results->pluck('percentage')->filter(fn ($p) => $p !== null)->values();
        $highestPercentage = $percentages->isEmpty() ? null : round($percentages->max(), 2);
        $lowestPercentage = $percentages->isEmpty() ? null : round($percentages->min(), 2);
        $averagePercentage = $percentages->isEmpty() ? null : round($percentages->avg(), 2);

        $stats = [
            'total_students' => $totalStudents,
            'passed_count' => $passedCount,
            'failed_count' => $failedCount,
            'absent_count' => $absentCount,
            'passed_percent' => $totalStudents > 0 ? round(($passedCount / $totalStudents) * 100, 1) : 0,
            'highest_percentage' => $highestPercentage,
            'average_percentage' => $averagePercentage,
            'lowest_percentage' => $lowestPercentage,
        ];

        $existingEnrollmentIds = $results->pluck('student_enrollment_id')->toArray();

        return inertia('dashboard/academic/ExamResults', [
            'exam' => $exam,
            'results' => $results,
            'enrollments' => $enrollments,
            'existingEnrollmentIds' => $existingEnrollmentIds,
            'stats' => $stats,
            'filterTree' => $filterTree,
            'filterDefaults' => $filterDefaults,
        ]);
    }

    /**
     * Store a new exam result; set grade/grade_point from scale, then recalc positions.
     */
    public function store(Request $request, Exam $exam)
    {
        $this->authorizeExamForTeacher($exam);

        $validated = $request->validate([
            'student_enrollment_id' => 'required|exists:student_enrollments,id',
            'total_marks' => 'required|numeric|min:0',
            'obtained_marks' => 'required|numeric|min:0',
            'grade' => 'nullable|string|max:10',
            'position' => 'nullable|integer|min:1',
            'is_passed' => 'boolean',
        ]);

        $totalMarks = (float) $validated['total_marks'];
        $obtainedMarks = (float) $validated['obtained_marks'];
        $percentage = $totalMarks > 0 ? round(($obtainedMarks / $totalMarks) * 100, 2) : 0;
        $isPassed = array_key_exists('is_passed', $validated) ? (bool) $validated['is_passed'] : ($percentage >= 33);

        $scale = $this->getScaleFromPercentage($percentage);
        $grade = $validated['grade'] ?? ($scale ? $scale->grade : null);
        $gradePoint = $scale ? (float) $scale->grade_point : null;
        $gradeScaleId = $scale?->id;

        $enteredBy = $request->user()?->id;

        StudentExamResult::updateOrCreate(
            [
                'exam_id' => $exam->id,
                'student_enrollment_id' => $validated['student_enrollment_id'],
            ],
            [
                'grade_scale_id' => $gradeScaleId,
                'grade' => $grade,
                'grade_point' => $gradePoint,
                'entered_by' => $enteredBy,
                'total_marks' => $totalMarks,
                'obtained_marks' => $obtainedMarks,
                'percentage' => $percentage,
                'position' => $validated['position'] ?? null,
                'is_passed' => $isPassed,
            ]
        );

        return back()->with('success', 'Result saved successfully.');
    }

    /**
     * Update an existing exam result; set grade/grade_point. Position is kept as entered (not auto-recalculated).
     */
    public function update(Request $request, StudentExamResult $studentExamResult)
    {
        $this->authorizeExamForTeacher($studentExamResult->exam);

        $validated = $request->validate([
            'total_marks' => 'required|numeric|min:0',
            'obtained_marks' => 'required|numeric|min:0',
            'grade' => 'nullable|string|max:10',
            'position' => 'nullable|integer|min:1',
            'is_passed' => 'boolean',
        ]);

        $totalMarks = (float) $validated['total_marks'];
        $obtainedMarks = (float) $validated['obtained_marks'];
        $percentage = $totalMarks > 0 ? round(($obtainedMarks / $totalMarks) * 100, 2) : 0;
        $isPassed = array_key_exists('is_passed', $validated) ? (bool) $validated['is_passed'] : ($percentage >= 33);

        $scale = $this->getScaleFromPercentage($percentage);
        $grade = $validated['grade'] ?? ($scale ? $scale->grade : null);
        $gradePoint = $scale ? (float) $scale->grade_point : null;
        $gradeScaleId = $scale?->id;

        $studentExamResult->update([
            'grade_scale_id' => $gradeScaleId,
            'grade' => $grade,
            'grade_point' => $gradePoint,
            'total_marks' => $totalMarks,
            'obtained_marks' => $obtainedMarks,
            'percentage' => $percentage,
            'position' => array_key_exists('position', $validated) ? $validated['position'] : $studentExamResult->position,
            'is_passed' => $isPassed,
        ]);

        return back()->with('success', 'Result updated successfully.');
    }

    /**
     * Delete an exam result.
     */
    public function destroy(StudentExamResult $studentExamResult)
    {
        $this->authorizeExamForTeacher($studentExamResult->exam);

        $studentExamResult->delete();

        return back()->with('success', 'Result deleted.');
    }

    /**
     * Download Result Sheet (Excel-compatible CSV). Optional: ?enrollment_ids=1,2,3 to export only selected students.
     */
    public function resultSheet(Exam $exam, Request $request, ExamResultExportService $exportService)
    {
        $this->authorizeExamForTeacher($exam);

        $filterIds = $request->get('enrollment_ids');
        $enrollmentIds = [];
        if (is_string($filterIds)) {
            $enrollmentIds = array_filter(array_map('intval', explode(',', $filterIds)));
        }

        return $exportService->resultSheet($exam, $enrollmentIds);
    }

    /**
     * Download Merit List (PDF). Optional: ?enrollment_ids=1,2,3 to include only selected students; otherwise top by percentage (limit param).
     */
    public function meritList(Exam $exam, Request $request, ExamResultExportService $exportService)
    {
        $this->authorizeExamForTeacher($exam);

        $limit = (int) $request->get('limit', 15);
        $filterIds = $request->get('enrollment_ids');
        $enrollmentIds = [];
        if (is_string($filterIds)) {
            $enrollmentIds = array_filter(array_map('intval', explode(',', $filterIds)));
        }

        return $exportService->meritList($exam, $enrollmentIds, $limit);
    }

    /**
     * Download Result Card PDF (subject-wise marks). Optional: ?enrollment_ids=1,2,3 for selected students only.
     */
    public function resultCard(Exam $exam, Request $request, ExamResultExportService $exportService)
    {
        $this->authorizeExamForTeacher($exam);

        $filterIds = $request->get('enrollment_ids');
        $enrollmentIds = [];
        if (is_string($filterIds)) {
            $enrollmentIds = array_filter(array_map('intval', explode(',', $filterIds)));
        }

        return $exportService->resultCards($exam, $enrollmentIds);
    }

    /**
     * Recalculate position (rank) for all results of this exam by percentage desc.
     */
    private function recalculatePositions(Exam $exam): void
    {
        $ordered = StudentExamResult::where('exam_id', $exam->id)
            ->orderByDesc('percentage')
            ->orderBy('id')
            ->pluck('id');

        $position = 1;
        foreach ($ordered as $id) {
            DB::table('student_exam_results')->where('id', $id)->update(['position' => $position]);
            $position++;
        }
    }

    /**
     * Get grade scale row for a percentage (for grade, grade_point, id).
     */
    private function getScaleFromPercentage(float $percentage): ?GradeScale
    {
        return GradeScale::where('min_percentage', '<=', $percentage)
            ->where('max_percentage', '>=', $percentage)
            ->first();
    }
}
