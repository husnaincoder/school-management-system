<?php

namespace App\Http\Controllers\Dashboard\ClassIncharge;

use App\Http\Controllers\Controller;
use App\Models\ClassNotice;
use App\Models\ClassSectionGroup;
use App\Services\ClassIncharge\ClassInchargeAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClassNoticeController extends Controller
{
    public function __construct(
        protected ClassInchargeAccessService $access
    ) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        abort_unless($this->access->hasClassInchargeRole($user), 403);
        $teacher = $this->access->teacherFromUser($user);
        abort_unless($teacher, 403);

        $groupIds = $this->access->inchargeClassSectionGroupIds($teacher->id);
        $notices = ClassNotice::with(['classSectionGroup.classSection.class', 'classSectionGroup.classSection.section', 'createdByUser'])
            ->whereIn('class_section_group_id', $groupIds->all() ?: [0])
            ->orderByDesc('created_at')
            ->paginate(20)
            ->withQueryString();

        return inertia('dashboard/class-incharge/Notices', [
            'notices' => $notices,
            'canManage' => true,
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        abort_unless($this->access->hasClassInchargeRole($user), 403);
        $teacher = $this->access->teacherFromUser($user);
        abort_unless($teacher, 403);

        $groupIds = $this->access->inchargeClassSectionGroupIds($teacher->id);
        $groups = ClassSectionGroup::with(['classSection.class', 'classSection.section', 'subjectGroup'])
            ->whereIn('id', $groupIds->all() ?: [0])
            ->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'label' => trim(
                    ($g->classSection?->class?->name ?? '').' - '.
                    ($g->classSection?->section?->name ?? '').
                    ($g->subjectGroup?->name ? ' ('.$g->subjectGroup->name.')' : '')
                ),
            ]);

        return inertia('dashboard/class-incharge/NoticeForm', [
            'notice' => null,
            'groups' => $groups,
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        abort_unless($this->access->hasClassInchargeRole($user), 403);
        $teacher = $this->access->teacherFromUser($user);
        abort_unless($teacher, 403);

        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'title' => 'required|string|max:255',
            'body' => 'nullable|string|max:10000',
            'notify_parents' => 'boolean',
        ]);

        abort_unless($this->access->canManageGroup($user, (int) $validated['class_section_group_id']), 403);

        ClassNotice::create([
            ...$validated,
            'notify_parents' => $request->boolean('notify_parents'),
            'created_by' => $user->id,
            'notified_at' => $request->boolean('notify_parents') ? now() : null,
        ]);

        return redirect()->route('class-incharge.notices.index')->with('success', 'Announcement posted.');
    }

    public function edit(ClassNotice $notice)
    {
        $user = Auth::user();
        abort_unless($this->access->canManageGroup($user, (int) $notice->class_section_group_id), 403);
        $teacher = $this->access->teacherFromUser($user);
        $groupIds = $this->access->inchargeClassSectionGroupIds($teacher->id);

        $groups = ClassSectionGroup::with(['classSection.class', 'classSection.section', 'subjectGroup'])
            ->whereIn('id', $groupIds->all() ?: [0])
            ->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'label' => trim(
                    ($g->classSection?->class?->name ?? '').' - '.
                    ($g->classSection?->section?->name ?? '').
                    ($g->subjectGroup?->name ? ' ('.$g->subjectGroup->name.')' : '')
                ),
            ]);

        return inertia('dashboard/class-incharge/NoticeForm', [
            'notice' => $notice,
            'groups' => $groups,
        ]);
    }

    public function update(Request $request, ClassNotice $notice)
    {
        $user = Auth::user();
        abort_unless($this->access->canManageGroup($user, (int) $notice->class_section_group_id), 403);

        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'title' => 'required|string|max:255',
            'body' => 'nullable|string|max:10000',
            'notify_parents' => 'boolean',
        ]);

        abort_unless($this->access->canManageGroup($user, (int) $validated['class_section_group_id']), 403);

        $notice->update([
            ...$validated,
            'notify_parents' => $request->boolean('notify_parents'),
            'notified_at' => $request->boolean('notify_parents') ? ($notice->notified_at ?? now()) : $notice->notified_at,
        ]);

        return redirect()->route('class-incharge.notices.index')->with('success', 'Announcement updated.');
    }

    public function destroy(ClassNotice $notice)
    {
        $user = Auth::user();
        abort_unless($this->access->canManageGroup($user, (int) $notice->class_section_group_id), 403);
        $notice->delete();

        return back()->with('success', 'Announcement deleted.');
    }
}
