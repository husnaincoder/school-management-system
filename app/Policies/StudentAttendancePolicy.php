<?php

namespace App\Policies;

use App\Models\StudentAttendance;
use App\Models\User;

class StudentAttendancePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasRole(['admin', 'super_admin', 'teacher', 'student', 'parent']);
    }

    public function view(User $user, StudentAttendance $studentAttendance): bool
    {
        if ($user->hasRole(['admin', 'super_admin', 'teacher'])) {
            return true;
        }
        if ($user->hasRole('student')) {
            $enrollment = $studentAttendance->studentEnrollment;
            return $enrollment && $enrollment->student_id && $user->student && $enrollment->student_id === $user->student->id;
        }
        if ($user->hasRole('parent')) {
            $enrollment = $studentAttendance->studentEnrollment;
            return $enrollment && $enrollment->student && $enrollment->student->parent_id && $user->parent && $enrollment->student->parent_id === $user->parent->id;
        }
        return false;
    }
}
