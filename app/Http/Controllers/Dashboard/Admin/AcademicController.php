<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSectionGroup;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\Subject;
use App\Models\ExamType;
use App\Models\Exam;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Mark;
use App\Services\Attendance\AttendanceSessionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

class AcademicController extends Controller
{
    public function __construct(
        protected AttendanceSessionService $sessionService
    ) {}

    /** For teacher/class_incharge: allowed class_section_group_ids; for admin null (no filter). */
    protected function allowedExamGroupIdsForUser(): ?\Illuminate\Support\Collection
    {
        $user = Auth::user();
        $teacher = $user->teacher ?? null;
        if (! $teacher) {
            return null;
        }
        return $this->sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
    }

    public function sessions()
    {
        $sessions = AcademicSession::orderBy('is_current', 'desc')->get();
        return inertia('dashboard/academic/Sessions', ['sessions' => $sessions]);
    }

    public function sessionStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'nullable|boolean',
            'is_current' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active');
        $validated['is_current'] = $request->boolean('is_current');
        if ($validated['is_current']) {
            AcademicSession::where('is_current', true)->update(['is_current' => false]);
        }

        AcademicSession::create($validated);
        return redirect()->route('academic.sessions')->with('success', 'Academic session created.');
    }

    public function sessionUpdate(Request $request, AcademicSession $session)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_active' => 'nullable|boolean',
            'is_current' => 'nullable|boolean',
        ]);

        $validated['is_active'] = $request->boolean('is_active');
        $validated['is_current'] = $request->boolean('is_current');
        if ($validated['is_current']) {
            AcademicSession::where('id', '!=', $session->id)->where('is_current', true)->update(['is_current' => false]);
        }

        $session->update($validated);
        return redirect()->route('academic.sessions')->with('success', 'Session updated.');
    }

    public function sessionDestroy(AcademicSession $session)
    {
        $session->delete();
        return back()->with('success', 'Session deleted.');
    }

    public function classes(Request $request)
    {
        $query = SchoolClass::withCount('classSections');
        if ($request->is_active !== null && $request->is_active !== '') {
            $query->where('is_active', (bool) $request->is_active);
        }
        $classes = $query->get();
        return inertia('dashboard/academic/Classes', ['classes' => $classes]);
    }

    public function classStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'class_number' => 'required|integer',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active');
        SchoolClass::create($validated);
        return back()->with('success', 'Class created.');
    }

    public function classUpdate(Request $request, SchoolClass $schoolClass)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'class_number' => 'required|integer',
            'description' => 'nullable|string',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active');
        $schoolClass->update($validated);
        return back()->with('success', 'Class updated.');
    }

    public function classDestroy(SchoolClass $schoolClass)
    {
        $schoolClass->delete();
        return back()->with('success', 'Class deleted.');
    }

    public function sections(Request $request)
    {
        $query = Section::withCount('classSections');
        if ($request->is_active !== null && $request->is_active !== '') {
            $query->where('is_active', (bool) $request->is_active);
        }
        $sections = $query->orderBy('name')->get();
        $academicSessions = AcademicSession::orderBy('is_current', 'desc')->get();
        return inertia('dashboard/academic/Sections', [
            'sections' => $sections,
            'filterIsActive' => $request->is_active,
            'academicSessions' => $academicSessions,
        ]);
    }

    public function sectionStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active');
        $validated['capacity'] = $validated['capacity'] ?? 40;
        Section::create($validated);
        return back()->with('success', 'Section created.');
    }

    public function sectionUpdate(Request $request, Section $section)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:50',
            'capacity' => 'nullable|integer|min:1',
            'is_active' => 'boolean',
        ]);
        $validated['is_active'] = $request->boolean('is_active');
        $validated['capacity'] = $validated['capacity'] ?? 40;
        $section->update($validated);
        return back()->with('success', 'Section updated.');
    }

    public function sectionDestroy(Section $section)
    {
        $section->delete();
        return back()->with('success', 'Section deleted.');
    }

    public function subjects(Request $request)
    {
        $query = Subject::query();
        if ($request->filled('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }
        $subjects = $query->orderBy('name')->get();

        return inertia('dashboard/academic/Subjects', [
            'subjects' => $subjects,
            'filterIsActive' => $request->get('is_active', ''),
        ]);
    }

    public function subjectStore(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'type' => 'nullable|string|in:Theory,Practical',
            'is_active' => 'sometimes|boolean',
        ], [
            'name.required' => 'Subject name is required.',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);
        Subject::create($validated);
        return back()->with('success', 'Subject created.');
    }

    public function subjectUpdate(Request $request, Subject $subject)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50',
            'type' => 'nullable|string|in:Theory,Practical',
            'is_active' => 'sometimes|boolean',
        ], [
            'name.required' => 'Subject name is required.',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);
        $subject->update($validated);
        return back()->with('success', 'Subject updated.');
    }

    public function subjectDestroy(Subject $subject)
    {
        $subject->delete();
        return back()->with('success', 'Subject deleted.');
    }

    public function exams(Request $request)
    {
        $query = Exam::with([
            'academicSession',
            'examType',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->academic_session_id);
        }

        if ($request->filled('exam_type_id')) {
            $query->where('exam_type_id', $request->exam_type_id);
        }

        if ($request->filled('class_section_group_id')) {
            $query->where('class_section_group_id', $request->class_section_group_id);
        }

        $allowedGroupIds = $this->allowedExamGroupIdsForUser();
        if ($allowedGroupIds !== null) {
            if ($allowedGroupIds->isEmpty()) {
                $query->whereRaw('1 = 0');
            } else {
                $query->whereIn('class_section_group_id', $allowedGroupIds->all());
            }
        }

        $exams = $query->orderBy('start_date', 'desc')->get();

        $sessions = AcademicSession::orderBy('is_current', 'desc')->get();
        $examTypes = ExamType::orderBy('name')->get();
        $classSectionGroupsQuery = ClassSectionGroup::with(
            'classSection.class',
            'classSection.section',
            'subjectGroup'
        );
        if ($allowedGroupIds !== null && $allowedGroupIds->isNotEmpty()) {
            $classSectionGroupsQuery->whereIn('id', $allowedGroupIds->all());
        }
        $classSectionGroups = $classSectionGroupsQuery->get();

        return inertia('dashboard/academic/Exams', [
            'exams' => $exams,
            'sessions' => $sessions,
            'examTypes' => $examTypes,
            'classSectionGroups' => $classSectionGroups,
            'filterAcademicSessionId' => $request->academic_session_id,
            'filterExamTypeId' => $request->exam_type_id,
            'filterClassSectionGroupId' => $request->class_section_group_id,
        ]);
    }

    public function examShow(Exam $exam)
    {
        $allowedGroupIds = $this->allowedExamGroupIdsForUser();
        if ($allowedGroupIds !== null && ($allowedGroupIds->isEmpty() || ! $allowedGroupIds->contains($exam->class_section_group_id))) {
            abort(403, 'You do not have access to this exam.');
        }

        $dateSheetService = app(\App\Services\Exam\ExamDateSheetService::class);
        $dateSheetService->syncSubjectsFromClassGroup($exam);

        $exam->load([
            'academicSession',
            'examType',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'examSubjects.subject',
            'examSubjects.invigilator.user',
        ]);

        $subjects = Subject::where('is_active', true)->orderBy('name')->get();

        return inertia('dashboard/academic/ExamShow', [
            'exam' => $exam,
            'subjects' => $subjects,
            'dateSheetRows' => $dateSheetService->dateSheetRows($exam),
            'invigilators' => $dateSheetService->invigilatorOptions(),
        ]);
    }

    public function examStore(Request $request)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'exam_type_id' => 'required|exists:exam_types,id',
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_published' => 'nullable|boolean',
        ]);

        $validated['is_published'] = $request->boolean('is_published', false);

        $exam = Exam::create($validated);
        app(\App\Services\Exam\ExamDateSheetService::class)->syncSubjectsFromClassGroup($exam);

        return redirect()
            ->route('academic.exams.show', $exam)
            ->with('success', 'Exam created. Class subjects loaded automatically — set date sheet below.');
    }

    public function examUpdate(Request $request, Exam $exam)
    {
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'exam_type_id' => 'required|exists:exam_types,id',
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'name' => 'required|string|max:255',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after_or_equal:start_date',
            'is_published' => 'nullable|boolean',
        ]);

        $validated['is_published'] = $request->boolean('is_published', false);

        $exam->update($validated);
        return back()->with('success', 'Exam updated.');
    }

    public function examDestroy(Exam $exam)
    {
        $exam->delete();
        return back()->with('success', 'Exam deleted.');
    }

    public function marks(Request $request)
    {
        $classes = SchoolClass::where('is_active', true)->get();
        $sessions = AcademicSession::all();
        $exams = Exam::all();

        $marks = [];

        $subjects = Subject::where('is_active', true)->orderBy('name')->get();

        return inertia('dashboard/academic/Marks', [
            'classes' => $classes,
            'sessions' => $sessions,
            'exams' => $exams,
            'subjects' => $subjects,
            'marks' => $marks,
        ]);
    }

    public function marksStore(Request $request)
    {
        $validated = $request->validate([
            'exam_id' => 'required|exists:exams,id',
            'subject_id' => 'required|exists:subjects,id',
            'marks' => 'required|array',
        ]);

        foreach ($validated['marks'] as $studentId => $markData) {
            $grade = Mark::calculateGrade($markData['marks_obtained'], $markData['full_marks']);

            Mark::updateOrCreate(
                [
                    'exam_id' => $validated['exam_id'],
                    'student_id' => $studentId,
                    'subject_id' => $validated['subject_id'],
                ],
                [
                    'marks_obtained' => $markData['marks_obtained'],
                    'full_marks' => $markData['full_marks'],
                    'pass_marks' => $markData['pass_marks'],
                    'grade' => $grade,
                    'recorded_by' => Auth::id(),
                ]
            );
        }

        return back()->with('success', 'Marks saved.');
    }
}
