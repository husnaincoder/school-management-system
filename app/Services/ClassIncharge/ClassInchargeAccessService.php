<?php

namespace App\Services\ClassIncharge;

use App\Models\ClassIncharge;
use App\Models\ClassSection;
use App\Models\ClassSectionGroup;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Role = class_incharge (capability).
 * Assignment = active class_incharges row (scope / WHERE).
 */
class ClassInchargeAccessService
{
    public function teacherFromUser(?User $user): ?Teacher
    {
        if (! $user) {
            return null;
        }

        return $user->teacher;
    }

    public function hasClassInchargeRole(?User $user): bool
    {
        return $user && $user->hasRole('class_incharge');
    }

    /**
     * Active class_section IDs this teacher is assigned as Class Incharge.
     */
    public function activeClassSectionIdsForTeacher(int $teacherId): Collection
    {
        return ClassIncharge::query()
            ->where('teacher_id', $teacherId)
            ->where('is_active', true)
            ->whereNotNull('class_section_id')
            ->pluck('class_section_id')
            ->unique()
            ->values();
    }

    /**
     * All class_section_group IDs under the teacher's active incharge class sections.
     */
    public function inchargeClassSectionGroupIds(int $teacherId): Collection
    {
        $sectionIds = $this->activeClassSectionIdsForTeacher($teacherId);
        if ($sectionIds->isEmpty()) {
            return collect();
        }

        return ClassSectionGroup::query()
            ->whereIn('class_section_id', $sectionIds->all())
            ->pluck('id')
            ->unique()
            ->values();
    }

    /**
     * Groups the teacher can access as subject teacher only.
     */
    public function subjectTeacherClassSectionGroupIds(int $teacherId): Collection
    {
        return \App\Models\ClassSectionGroupSubject::query()
            ->where('teacher_id', $teacherId)
            ->pluck('class_section_group_id')
            ->unique()
            ->values();
    }

    /**
     * Groups accessible for this user:
     * - subject-teacher groups always (if teacher profile exists)
     * - PLUS all groups under active Class Incharge sections ONLY when user has class_incharge role
     */
    public function accessibleClassSectionGroupIdsForUser(?User $user): Collection
    {
        $teacher = $this->teacherFromUser($user);
        if (! $teacher) {
            return collect();
        }

        $subjectGroups = $this->subjectTeacherClassSectionGroupIds($teacher->id);
        $inchargeGroups = $this->hasClassInchargeRole($user)
            ? $this->inchargeClassSectionGroupIds($teacher->id)
            : collect();

        return $inchargeGroups->merge($subjectGroups)->unique()->values();
    }

    /**
     * @deprecated Prefer accessibleClassSectionGroupIdsForUser() so role is enforced.
     * Kept for callers that only have teacher_id: looks up the linked user.
     */
    public function accessibleClassSectionGroupIds(int $teacherId): Collection
    {
        $teacher = Teacher::with('user')->find($teacherId);
        if (! $teacher?->user) {
            return $this->subjectTeacherClassSectionGroupIds($teacherId);
        }

        return $this->accessibleClassSectionGroupIdsForUser($teacher->user);
    }

    public function isActiveInchargeOfClassSection(int $teacherId, int $classSectionId): bool
    {
        return ClassIncharge::query()
            ->where('teacher_id', $teacherId)
            ->where('class_section_id', $classSectionId)
            ->where('is_active', true)
            ->exists();
    }

    public function canManageClassSection(?User $user, int $classSectionId): bool
    {
        if (! $this->hasClassInchargeRole($user)) {
            return false;
        }
        $teacher = $this->teacherFromUser($user);
        if (! $teacher) {
            return false;
        }

        return $this->isActiveInchargeOfClassSection($teacher->id, $classSectionId);
    }

    public function canManageEnrollment(?User $user, StudentEnrollment $enrollment): bool
    {
        $enrollment->loadMissing('classSectionGroup');
        $classSectionId = (int) ($enrollment->classSectionGroup?->class_section_id ?? 0);
        if ($classSectionId <= 0) {
            return false;
        }

        return $this->canManageClassSection($user, $classSectionId);
    }

    public function canManageGroup(?User $user, int $classSectionGroupId): bool
    {
        $group = ClassSectionGroup::find($classSectionGroupId);
        if (! $group) {
            return false;
        }

        return $this->canManageClassSection($user, (int) $group->class_section_id);
    }

    /**
     * @return Collection<int, ClassSection>
     */
    public function activeClassSectionsForTeacher(int $teacherId): Collection
    {
        $ids = $this->activeClassSectionIdsForTeacher($teacherId);
        if ($ids->isEmpty()) {
            return collect();
        }

        return ClassSection::query()
            ->with(['class', 'section', 'academicSession', 'classSectionGroups.subjectGroup'])
            ->whereIn('id', $ids->all())
            ->orderBy('id')
            ->get();
    }
}
