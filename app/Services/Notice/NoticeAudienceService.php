<?php

namespace App\Services\Notice;

use App\Models\Notice;
use App\Models\NoticeTarget;
use Illuminate\Support\Collection;

class NoticeAudienceService
{
    /**
     * Get all user IDs that should receive this notice (for notifications and emails).
     *
     * @return array<int>
     */
    public function getTargetUserIds(Notice $notice): array
    {
        $userIds = [];
        foreach ($notice->targets as $target) {
            foreach ($target->details as $detail) {
                $userIds = array_merge(
                    $userIds,
                    $this->resolveUserIdsForTarget($target->target_type, $detail)
                );
            }
        }
        return array_values(array_unique(array_filter($userIds)));
    }

    private function resolveUserIdsForTarget(string $targetType, $detail): array
    {
        return match ($targetType) {
            NoticeTarget::ALL_STUDENTS_IN_CLASS => $this->userIdsStudentsInClassSectionGroup($detail->class_section_group_id),
            NoticeTarget::ALL_TEACHERS_TEACHING_CLASS => $this->userIdsTeachersTeachingClassSectionGroup($detail->class_section_group_id),
            NoticeTarget::ALL_PARENTS_OF_CLASS => $this->userIdsParentsOfStudentsInClassSectionGroup($detail->class_section_group_id),
            NoticeTarget::ALL_EMPLOYEES_IN_DEPARTMENT => $this->userIdsEmployeesInDepartment($detail->department),
            NoticeTarget::SINGLE_TEACHER => $detail->teacher_id ? [(int) \App\Models\Teacher::find($detail->teacher_id)?->user_id] : [],
            NoticeTarget::SINGLE_EMPLOYEE => $detail->employee_id ? [(int) \App\Models\Employee::find($detail->employee_id)?->user_id] : [],
            NoticeTarget::SINGLE_PARENT => $detail->parent_id ? [(int) \App\Models\ParentModel::find($detail->parent_id)?->user_id] : [],
            NoticeTarget::SINGLE_STUDENT => $this->userIdsFromEnrollment($detail->student_enrollment_id),
            default => [],
        };
    }

    private function userIdsStudentsInClassSectionGroup(?int $classSectionGroupId): array
    {
        if (! $classSectionGroupId) {
            return [];
        }
        return \App\Models\StudentEnrollment::query()
            ->where('class_section_group_id', $classSectionGroupId)
            ->where('status', 'active')
            ->with('student')
            ->get()
            ->pluck('student.user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function userIdsTeachersTeachingClassSectionGroup(?int $classSectionGroupId): array
    {
        if (! $classSectionGroupId) {
            return [];
        }
        return \App\Models\ClassSectionGroupSubject::query()
            ->where('class_section_group_id', $classSectionGroupId)
            ->whereNotNull('teacher_id')
            ->with('teacher')
            ->get()
            ->pluck('teacher.user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function userIdsParentsOfStudentsInClassSectionGroup(?int $classSectionGroupId): array
    {
        if (! $classSectionGroupId) {
            return [];
        }
        return \App\Models\StudentEnrollment::query()
            ->where('class_section_group_id', $classSectionGroupId)
            ->where('status', 'active')
            ->with('student.parent')
            ->get()
            ->pluck('student.parent.user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function userIdsEmployeesInDepartment(?string $department): array
    {
        if (! $department) {
            return [];
        }
        return \App\Models\Employee::query()
            ->where('department', $department)
            ->pluck('user_id')
            ->filter()
            ->unique()
            ->values()
            ->all();
    }

    private function userIdsFromEnrollment(?int $studentEnrollmentId): array
    {
        if (! $studentEnrollmentId) {
            return [];
        }
        $enrollment = \App\Models\StudentEnrollment::with('student')->find($studentEnrollmentId);

        return $enrollment && $enrollment->student ? [(int) $enrollment->student->user_id] : [];
    }
}
