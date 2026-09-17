<?php

namespace App\Services\Exam;

use App\Models\ClassSectionGroupSubject;
use App\Models\Exam;
use App\Models\ExamSubject;
use App\Models\Teacher;
use Illuminate\Support\Collection;

class ExamDateSheetService
{
    public const DEFAULT_TOTAL_MARKS = 100;

    public const DEFAULT_PASSING_MARKS = 33;

    /**
     * Pull all subjects assigned to the exam's class section group into exam_subjects.
     * Does not overwrite existing rows (marks / date sheet already set).
     *
     * @return array{added:int,total:int}
     */
    public function syncSubjectsFromClassGroup(Exam $exam): array
    {
        $groupId = (int) $exam->class_section_group_id;
        if ($groupId <= 0) {
            return ['added' => 0, 'total' => 0];
        }

        $assignments = ClassSectionGroupSubject::query()
            ->with('subject:id,name')
            ->where('class_section_group_id', $groupId)
            ->orderBy('id')
            ->get();

        $existingSubjectIds = $exam->examSubjects()->pluck('subject_id')->map(fn ($id) => (int) $id)->all();
        $added = 0;
        $sort = (int) $exam->examSubjects()->max('sort_order');

        foreach ($assignments as $row) {
            $subjectId = (int) $row->subject_id;
            if ($subjectId <= 0 || in_array($subjectId, $existingSubjectIds, true)) {
                continue;
            }
            $sort++;
            $exam->examSubjects()->create([
                'subject_id' => $subjectId,
                'total_marks' => self::DEFAULT_TOTAL_MARKS,
                'passing_marks' => self::DEFAULT_PASSING_MARKS,
                'is_optional' => false,
                'sort_order' => $sort,
            ]);
            $existingSubjectIds[] = $subjectId;
            $added++;
        }

        return [
            'added' => $added,
            'total' => $exam->examSubjects()->count(),
        ];
    }

    /**
     * Map subject_id => subject teacher info from class group assignment (NOT invigilator).
     *
     * @return array<int, array{teacher_id:?int,teacher_name:?string}>
     */
    public function subjectTeachersForExam(Exam $exam): array
    {
        $rows = ClassSectionGroupSubject::query()
            ->with('teacher.user:id,name')
            ->where('class_section_group_id', (int) $exam->class_section_group_id)
            ->get();

        $map = [];
        foreach ($rows as $row) {
            $map[(int) $row->subject_id] = [
                'teacher_id' => $row->teacher_id ? (int) $row->teacher_id : null,
                'teacher_name' => $row->teacher?->user?->name,
            ];
        }

        return $map;
    }

    /**
     * Teachers list for invigilator dropdown.
     *
     * @return Collection<int, array{id:int,name:string}>
     */
    public function invigilatorOptions(): Collection
    {
        return Teacher::query()
            ->with('user:id,name')
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'active');
            })
            ->orderBy('id')
            ->get()
            ->map(function (Teacher $teacher) {
                return [
                    'id' => (int) $teacher->id,
                    'name' => $teacher->user?->name ?: ('Teacher #'.$teacher->id),
                ];
            })
            ->values();
    }

    /**
     * Enrich exam subjects payload for frontend (subject teacher vs invigilator).
     *
     * @return list<array<string, mixed>>
     */
    public function dateSheetRows(Exam $exam): array
    {
        $exam->loadMissing([
            'examSubjects.subject:id,name',
            'examSubjects.invigilator.user:id,name',
        ]);

        $subjectTeachers = $this->subjectTeachersForExam($exam);

        return $exam->examSubjects
            ->sortBy('sort_order')
            ->values()
            ->map(function (ExamSubject $es) use ($subjectTeachers) {
                $sid = (int) $es->subject_id;
                $subjectTeacher = $subjectTeachers[$sid] ?? ['teacher_id' => null, 'teacher_name' => null];

                return [
                    'id' => (int) $es->id,
                    'subject_id' => $sid,
                    'subject_name' => $es->subject?->name ?? '—',
                    'total_marks' => (int) $es->total_marks,
                    'passing_marks' => (int) $es->passing_marks,
                    'exam_date' => $es->exam_date?->format('Y-m-d'),
                    'start_time' => $es->start_time ? substr((string) $es->start_time, 0, 5) : null,
                    'end_time' => $es->end_time ? substr((string) $es->end_time, 0, 5) : null,
                    'room' => $es->room,
                    'invigilator_teacher_id' => $es->invigilator_teacher_id ? (int) $es->invigilator_teacher_id : null,
                    'invigilator_name' => $es->invigilator?->user?->name,
                    'subject_teacher_id' => $subjectTeacher['teacher_id'],
                    'subject_teacher_name' => $subjectTeacher['teacher_name'],
                    'sort_order' => (int) $es->sort_order,
                ];
            })
            ->all();
    }
}
