<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Models\Exam;
use App\Services\Attendance\AttendanceSessionService;
use Illuminate\Support\Facades\Auth;

trait AuthorizesExamAccess
{
    protected function authorizeExamForTeacher(Exam $exam): void
    {
        $user = Auth::user();
        $teacher = $user->teacher ?? null;
        if (! $teacher) {
            return;
        }
        $sessionService = app(AttendanceSessionService::class);
        $allowedGroupIds = $sessionService->getClassSectionGroupIdsForTeacher($teacher->id);
        if ($allowedGroupIds->isEmpty() || ! $allowedGroupIds->contains($exam->class_section_group_id)) {
            abort(403, 'You do not have access to this exam.');
        }
    }
}
