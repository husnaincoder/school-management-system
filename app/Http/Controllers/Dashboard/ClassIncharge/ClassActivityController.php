<?php

namespace App\Http\Controllers\Dashboard\ClassIncharge;

use App\Http\Controllers\Controller;
use App\Models\ClassActivity;
use App\Services\ClassIncharge\ClassInchargeAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClassActivityController extends Controller
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
        $activities = ClassActivity::with(['classSection.class', 'classSection.section', 'createdByUser'])
            ->whereIn('class_section_id', $sectionIds->all() ?: [0])
            ->orderByDesc('activity_date')
            ->orderByDesc('id')
            ->paginate(20);

        return inertia('dashboard/class-incharge/Activities', [
            'activities' => $activities,
            'classSections' => $this->sectionOptions($teacher->id),
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        abort_unless($this->access->hasClassInchargeRole($user), 403);

        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'activity_date' => 'nullable|date',
            'location' => 'nullable|string|max:255',
        ]);

        abort_unless($this->access->canManageClassSection($user, (int) $validated['class_section_id']), 403);

        ClassActivity::create([
            ...$validated,
            'created_by' => $user->id,
        ]);

        return back()->with('success', 'Activity created.');
    }

    public function update(Request $request, ClassActivity $activity)
    {
        $user = Auth::user();
        abort_unless($this->access->canManageClassSection($user, (int) $activity->class_section_id), 403);

        $validated = $request->validate([
            'class_section_id' => 'required|exists:class_sections,id',
            'title' => 'required|string|max:255',
            'description' => 'nullable|string|max:5000',
            'activity_date' => 'nullable|date',
            'location' => 'nullable|string|max:255',
        ]);

        abort_unless($this->access->canManageClassSection($user, (int) $validated['class_section_id']), 403);
        $activity->update($validated);

        return back()->with('success', 'Activity updated.');
    }

    public function destroy(ClassActivity $activity)
    {
        $user = Auth::user();
        abort_unless($this->access->canManageClassSection($user, (int) $activity->class_section_id), 403);
        $activity->delete();

        return back()->with('success', 'Activity deleted.');
    }

    protected function sectionOptions(int $teacherId): array
    {
        return $this->access->activeClassSectionsForTeacher($teacherId)->map(fn ($cs) => [
            'id' => $cs->id,
            'label' => trim(($cs->class?->name ?? '').' - '.($cs->section?->name ?? '')),
        ])->all();
    }
}
