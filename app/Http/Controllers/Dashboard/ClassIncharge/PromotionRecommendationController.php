<?php

namespace App\Http\Controllers\Dashboard\ClassIncharge;

use App\Http\Controllers\Controller;
use App\Models\PromotionRecommendation;
use App\Models\StudentEnrollment;
use App\Services\ClassIncharge\ClassInchargeAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class PromotionRecommendationController extends Controller
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

        $sectionIds = $this->access->activeClassSectionIdsForTeacher($teacher->id);
        $groupIds = $this->access->inchargeClassSectionGroupIds($teacher->id);

        $recommendations = PromotionRecommendation::with([
            'enrollment.student.user',
            'classSection.class',
            'classSection.section',
            'recommendedByUser',
        ])
            ->whereIn('class_section_id', $sectionIds->all() ?: [0])
            ->orderByDesc('id')
            ->paginate(20);

        $enrollments = StudentEnrollment::with('student.user', 'classSectionGroup.classSection')
            ->whereIn('class_section_group_id', $groupIds->all() ?: [0])
            ->where('status', 'active')
            ->orderBy('roll_number')
            ->get()
            ->map(fn ($e) => [
                'id' => $e->id,
                'class_section_id' => $e->classSectionGroup?->class_section_id,
                'label' => ($e->student?->full_name ?? $e->student?->user?->name ?? 'Student').' (Roll: '.($e->roll_number ?? '—').')',
            ]);

        return inertia('dashboard/class-incharge/PromotionRecommendations', [
            'recommendations' => $recommendations,
            'enrollments' => $enrollments,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        abort_unless($this->access->hasClassInchargeRole($user), 403);

        $validated = $request->validate([
            'student_enrollment_id' => 'required|exists:student_enrollments,id',
            'recommendation' => 'required|in:promote,retain,conditional',
            'remarks' => 'nullable|string|max:2000',
        ]);

        $enrollment = StudentEnrollment::with('classSectionGroup')->findOrFail($validated['student_enrollment_id']);
        abort_unless($this->access->canManageEnrollment($user, $enrollment), 403);

        PromotionRecommendation::create([
            'student_enrollment_id' => $enrollment->id,
            'class_section_id' => $enrollment->classSectionGroup->class_section_id,
            'recommended_by' => $user->id,
            'recommendation' => $validated['recommendation'],
            'remarks' => $validated['remarks'] ?? null,
            'status' => 'pending',
        ]);

        return back()->with('success', 'Promotion recommendation submitted (awaiting admin approval).');
    }
}
