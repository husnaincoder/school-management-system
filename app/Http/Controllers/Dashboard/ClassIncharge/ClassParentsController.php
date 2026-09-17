<?php

namespace App\Http\Controllers\Dashboard\ClassIncharge;

use App\Http\Controllers\Controller;
use App\Models\StudentEnrollment;
use App\Services\ClassIncharge\ClassInchargeAccessService;
use Illuminate\Support\Facades\Auth;

class ClassParentsController extends Controller
{
    public function __construct(
        protected ClassInchargeAccessService $access
    ) {}

    public function index()
    {
        $user = Auth::user();
        abort_unless($this->access->hasClassInchargeRole($user), 403);
        $teacher = $this->access->teacherFromUser($user);
        abort_unless($teacher, 403);

        $groupIds = $this->access->inchargeClassSectionGroupIds($teacher->id);
        $enrollments = StudentEnrollment::with([
            'student.user',
            'student.parent.user',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
        ])
            ->whereIn('class_section_group_id', $groupIds->all() ?: [0])
            ->where('status', 'active')
            ->orderBy('roll_number')
            ->get();

        $parents = $enrollments->map(function ($e) {
            $student = $e->student;
            $parent = $student?->parent;
            $cs = $e->classSectionGroup?->classSection;

            return [
                'enrollment_id' => $e->id,
                'student' => $student?->full_name ?? $student?->user?->name,
                'roll_number' => $e->roll_number,
                'class' => trim(($cs?->class?->name ?? '').' - '.($cs?->section?->name ?? '')),
                'parent_name' => $parent?->user?->name ?? '—',
                'spouse_name' => $parent?->spouse_name ?? '—',
                'phone' => $parent?->user?->phone ?? $student?->user?->phone ?? '—',
                'email' => $parent?->user?->email ?? '—',
            ];
        })->values();

        return inertia('dashboard/class-incharge/Parents', [
            'parents' => $parents,
        ]);
    }
}
