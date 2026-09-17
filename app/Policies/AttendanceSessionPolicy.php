<?php

namespace App\Policies;

use App\Models\AttendanceSession;
use App\Models\User;
use App\Services\Attendance\AttendanceSessionService;

class AttendanceSessionPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['admin', 'super_admin', 'teacher', 'class_incharge']);
    }

    public function view(User $user, AttendanceSession $attendanceSession): bool
    {
        if ($user->hasRole(['admin', 'super_admin'])) {
            return true;
        }
        if ($user->hasRole(['teacher', 'class_incharge'])) {
            $service = app(AttendanceSessionService::class);
            $teacher = $user->teacher;
            return $teacher && $service->teacherCanAccessSession($attendanceSession, $teacher->id);
        }
        return false;
    }

    public function create(User $user): bool
    {
        return $user->hasRole(['admin', 'super_admin', 'teacher', 'class_incharge']);
    }

    public function update(User $user, AttendanceSession $attendanceSession): bool
    {
        if ($attendanceSession->is_locked) {
            return false;
        }
        if ($user->hasRole(['admin', 'super_admin'])) {
            return true;
        }
        if ($user->hasRole(['teacher', 'class_incharge'])) {
            $service = app(AttendanceSessionService::class);
            $teacher = $user->teacher;
            return $teacher && $service->teacherCanAccessSession($attendanceSession, $teacher->id);
        }
        return false;
    }

    public function delete(User $user, AttendanceSession $attendanceSession): bool
    {
        if ($attendanceSession->is_locked) {
            return false;
        }
        return $user->hasRole(['admin', 'super_admin']);
    }

    public function markAttendance(User $user, AttendanceSession $attendanceSession): bool
    {
        if ($attendanceSession->is_locked) {
            return false;
        }
        if ($user->hasRole(['admin', 'super_admin'])) {
            return true;
        }
        if ($user->hasRole('teacher') && $attendanceSession->type === 'student') {
            $service = app(AttendanceSessionService::class);
            $teacher = $user->teacher;
            return $teacher && $service->teacherCanAccessSession($attendanceSession, $teacher->id);
        }
        if ($user->hasRole('class_incharge') && $attendanceSession->type === 'student') {
            $service = app(AttendanceSessionService::class);
            $teacher = $user->teacher;
            return $teacher && $service->teacherCanAccessSession($attendanceSession, $teacher->id);
        }
        return false;
    }

    public function lockUnlock(User $user, AttendanceSession $attendanceSession): bool
    {
        return $user->hasRole(['admin', 'super_admin']);
    }
}
