<?php

namespace App\Services\Attendance;

use App\Models\AttendanceSession;
use App\Models\AttendanceMonthlyFreeze;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AttendanceSessionService
{
    public function getPaginated(
        array $filters = [],
        int $perPage = 15,
        ?int $teacherId = null
    ): LengthAwarePaginator {
        $query = AttendanceSession::with([
            'academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
        ])->orderBy('attendance_date', 'desc');

        if ($teacherId !== null) {
            $allowedGroupIds = $this->getClassSectionGroupIdsForTeacher($teacherId);
            $query->where(function ($q) use ($allowedGroupIds) {
                $q->where('type', 'student')->whereIn('class_section_group_id', $allowedGroupIds);
            });
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (! empty($filters['academic_session_id'])) {
            $query->where('academic_session_id', $filters['academic_session_id']);
        }
        if (! empty($filters['class_section_group_id'])) {
            $query->where('class_section_group_id', $filters['class_section_group_id']);
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('attendance_date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('attendance_date', '<=', $filters['date_to']);
        }

        return $query->paginate($perPage)->withQueryString();
    }

    public function duplicateExists(
        string $attendanceDate,
        int $academicSessionId,
        string $type,
        ?int $classSectionGroupId = null,
        ?int $excludeId = null
    ): bool {
        $query = AttendanceSession::where('attendance_date', $attendanceDate)
            ->where('academic_session_id', $academicSessionId)
            ->where('type', $type);

        if ($type === 'student' && $classSectionGroupId !== null) {
            $query->where('class_section_group_id', $classSectionGroupId);
        } else {
            $query->whereNull('class_section_group_id');
        }

        if ($excludeId !== null) {
            $query->where('id', '!=', $excludeId);
        }

        return $query->exists();
    }

    public function create(array $validated): AttendanceSession
    {
        if ($validated['type'] !== 'student') {
            $validated['class_section_group_id'] = null;
        }

        return AttendanceSession::create($validated);
    }

    public function update(AttendanceSession $session, array $validated): AttendanceSession
    {
        if ($validated['type'] !== 'student') {
            $validated['class_section_group_id'] = null;
        }

        $session->update($validated);
        return $session->fresh();
    }

    public function lock(AttendanceSession $session): AttendanceSession
    {
        $session->update(['is_locked' => true]);
        return $session->fresh();
    }

    public function unlock(AttendanceSession $session): AttendanceSession
    {
        $session->update(['is_locked' => false]);
        return $session->fresh();
    }

    public function isMonthFrozen(AttendanceSession $session): bool
    {
        $date = $session->attendance_date;
        return AttendanceMonthlyFreeze::isFrozen(
            $session->academic_session_id,
            (int) $date->format('Y'),
            (int) $date->format('n'),
            $session->type
        );
    }

    /**
     * Class section group IDs this teacher/user can access:
     * - groups where they are assigned as subject teacher, and
     * - all groups under active Class Incharge class sections (only if user has class_incharge role).
     */
    public function getClassSectionGroupIdsForTeacher(int $teacherId): Collection
    {
        return app(\App\Services\ClassIncharge\ClassInchargeAccessService::class)
            ->accessibleClassSectionGroupIds($teacherId);
    }

    public function getClassSectionGroupIdsForUser(?\App\Models\User $user): Collection
    {
        return app(\App\Services\ClassIncharge\ClassInchargeAccessService::class)
            ->accessibleClassSectionGroupIdsForUser($user);
    }

    public function teacherCanAccessSession(AttendanceSession $session, int $teacherId): bool
    {
        if ($session->type !== 'student' || $session->class_section_group_id === null) {
            return false;
        }
        $allowedGroupIds = $this->getClassSectionGroupIdsForTeacher($teacherId);
        return $allowedGroupIds->contains($session->class_section_group_id);
    }
}
