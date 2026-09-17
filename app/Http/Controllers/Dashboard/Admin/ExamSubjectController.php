<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Exam;
use App\Models\ExamSubject;
use App\Services\Exam\ExamDateSheetService;
use App\Services\Setting\SystemSettingService;
use App\Support\PdfAssets;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;

class ExamSubjectController extends Controller
{
    use AuthorizesExamAccess;

    public function __construct(
        protected ExamDateSheetService $dateSheetService
    ) {}

    public function store(Request $request, Exam $exam)
    {
        $this->authorizeExamForTeacher($exam);

        $validated = $request->validate([
            'subject_id' => 'required|exists:subjects,id',
            'total_marks' => 'required|integer|min:1',
            'passing_marks' => 'required|integer|min:0',
        ]);

        if ($validated['passing_marks'] > $validated['total_marks']) {
            return back()->with('error', 'Passing marks cannot exceed total marks.');
        }

        $exists = ExamSubject::where('exam_id', $exam->id)->where('subject_id', $validated['subject_id'])->exists();
        if ($exists) {
            return back()->with('error', 'This subject is already added to this exam.');
        }

        $exam->examSubjects()->create([
            'subject_id' => $validated['subject_id'],
            'total_marks' => $validated['total_marks'],
            'passing_marks' => $validated['passing_marks'],
            'sort_order' => ((int) $exam->examSubjects()->max('sort_order')) + 1,
        ]);

        return back()->with('success', 'Subject added to exam.');
    }

    /**
     * Auto-load all subjects assigned to this exam's class section group.
     */
    public function syncFromClass(Exam $exam)
    {
        $this->authorizeExamForTeacher($exam);

        $result = $this->dateSheetService->syncSubjectsFromClassGroup($exam);

        if ($result['added'] === 0) {
            return back()->with('success', 'All class subjects are already loaded ('.$result['total'].').');
        }

        return back()->with('success', $result['added'].' subject(s) loaded from class group. Total: '.$result['total'].'.');
    }

    public function update(Request $request, ExamSubject $examSubject)
    {
        $examSubject->loadMissing('exam');
        $this->authorizeExamForTeacher($examSubject->exam);

        $validated = $request->validate([
            'total_marks' => 'required|integer|min:1',
            'passing_marks' => 'required|integer|min:0',
        ]);

        if ($validated['passing_marks'] > $validated['total_marks']) {
            return back()->with('error', 'Passing marks cannot exceed total marks.');
        }

        $examSubject->update($validated);

        return back()->with('success', 'Exam subject updated.');
    }

    /**
     * Update date-sheet fields only (date/time/room/invigilator).
     * Invigilator is separate from subject teacher.
     */
    public function updateDateSheet(Request $request, ExamSubject $examSubject)
    {
        $examSubject->loadMissing('exam');
        $this->authorizeExamForTeacher($examSubject->exam);

        $validated = $request->validate([
            'exam_date' => 'nullable|date',
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'room' => 'nullable|string|max:100',
            'invigilator_teacher_id' => 'nullable|exists:teachers,id',
        ]);

        if (! empty($validated['start_time']) && ! empty($validated['end_time']) && $validated['end_time'] <= $validated['start_time']) {
            return back()->withErrors(['end_time' => 'End time must be after start time.']);
        }

        $examSubject->update([
            'exam_date' => $validated['exam_date'] ?? null,
            'start_time' => $validated['start_time'] ?? null,
            'end_time' => $validated['end_time'] ?? null,
            'room' => $validated['room'] ?? null,
            'invigilator_teacher_id' => $validated['invigilator_teacher_id'] ?? null,
        ]);

        return back()->with('success', 'Date sheet updated for '.$examSubject->subject?->name.'.');
    }

    public function destroy(ExamSubject $examSubject)
    {
        $examSubject->loadMissing('exam');
        $this->authorizeExamForTeacher($examSubject->exam);
        $examSubject->delete();

        return back()->with('success', 'Subject removed from exam.');
    }

    public function dateSheetPdf(Exam $exam, SystemSettingService $settings)
    {
        $this->authorizeExamForTeacher($exam);

        $this->dateSheetService->syncSubjectsFromClassGroup($exam);
        $exam->load([
            'academicSession',
            'examType',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        $rows = $this->dateSheetService->dateSheetRows($exam);
        $branding = $settings->getPdfBranding();
        PdfAssets::boostResources();
        PdfAssets::ensureFontDirectory();

        $cs = $exam->classSectionGroup?->classSection;
        $classLabel = trim(
            ($cs?->class?->name ?? '').' · '.($cs?->section?->name ?? '').' · '.($exam->classSectionGroup?->subjectGroup?->name ?? '')
        );

        $pdf = Pdf::loadView('pdf.exam-date-sheet', [
            'exam' => $exam,
            'rows' => $rows,
            'classLabel' => $classLabel !== '· ·' ? $classLabel : '—',
            'schoolName' => $branding['school_name'] ?? config('app.name', 'School'),
            'logoSrc' => $branding['logo_src'] ?? null,
        ])->setPaper('a4', 'portrait');

        $safeName = preg_replace('/[^A-Za-z0-9\-_]+/', '-', $exam->name) ?: 'exam';

        return $pdf->download('date-sheet-'.$safeName.'.pdf');
    }
}
