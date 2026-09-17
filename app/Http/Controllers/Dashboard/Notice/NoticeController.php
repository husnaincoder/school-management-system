<?php

namespace App\Http\Controllers\Dashboard\Notice;

use App\Http\Controllers\Controller;
use App\Mail\NoticeCreatedMail;
use App\Models\ClassSectionGroup;
use App\Models\Employee;
use App\Models\Notice;
use App\Models\NoticeAttachment;
use App\Models\NoticeCategory;
use App\Models\NoticeComment;
use App\Models\NoticeLike;
use App\Models\NoticeNotification;
use App\Models\NoticeRead;
use App\Models\NoticeTarget;
use App\Models\NoticeTagetDetail;
use App\Models\ParentModel;
use App\Models\StudentEnrollment;
use App\Models\Teacher;
use App\Models\User;
use App\Services\Notice\NoticeAudienceService;
use App\Support\UploadRules;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class NoticeController extends Controller
{
    public function __construct(
        private NoticeAudienceService $audienceService
    ) {}

    public function index(Request $request)
    {
        $query = Notice::with(['category', 'targets.details'])
            ->orderByRaw('is_pinned DESC, created_at DESC');

        $user = Auth::user();
        if ($user->hasRole('student')) {
            $student = $user->student;
            $enrollment = $student ? StudentEnrollment::where('student_id', $student->id)->where('status', 'active')->first() : null;
            if ($enrollment) {
                $query->whereHas('targets.details', function ($q) use ($enrollment) {
                    $q->where('class_section_group_id', $enrollment->class_section_group_id)
                        ->orWhere('student_enrollment_id', $enrollment->id);
                });
            } else {
                $query->whereRaw('1 = 0');
            }
        } elseif ($user->hasRole('parent')) {
            $parent = ParentModel::where('user_id', $user->id)->first();
            $groupIds = StudentEnrollment::whereHas('student', fn ($q) => $q->where('parent_id', $parent?->id))
                ->where('status', 'active')->pluck('class_section_group_id');
            $query->whereHas('targets.details', function ($q) use ($groupIds, $parent) {
                $q->whereIn('class_section_group_id', $groupIds)->orWhere('parent_id', $parent?->id);
            });
        } elseif ($user->hasRole('teacher')) {
            $teacher = Teacher::where('user_id', $user->id)->first();
            $groupIds = \App\Models\ClassSectionGroupSubject::where('teacher_id', $teacher?->id)->pluck('class_section_group_id');
            $query->whereHas('targets.details', function ($q) use ($groupIds, $teacher) {
                $q->whereIn('class_section_group_id', $groupIds)->orWhere('teacher_id', $teacher?->id);
            });
        } elseif ($user->hasRole('employee') && ! $user->hasRole('admin') && ! $user->hasRole('super_admin')) {
            $emp = Employee::where('user_id', $user->id)->first();
            $query->whereHas('targets.details', function ($q) use ($emp) {
                $q->where('employee_id', $emp?->id)->orWhere('department', $emp?->department);
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        if ($request->boolean('pinned')) {
            $query->where('is_pinned', true);
        }
        if ($request->boolean('published_only')) {
            $query->published();
        }

        $notices = $query->get()->filter(function (Notice $n) {
            if ($n->expire_at && $n->expire_at->isPast()) {
                return false;
            }
            if ($n->publish_at && $n->publish_at->isFuture()) {
                return false;
            }
            return true;
        })->values();

        $categories = NoticeCategory::where('is_active', true)->get();

        $canEditIds = $this->getNoticesCurrentUserCanEdit($user);
        $notices = $notices->map(function ($n) use ($canEditIds) {
            $n->can_edit = $canEditIds->contains($n->id);
            return $n;
        });

        $canCreate = $user->hasRole('super_admin', 'web') || $user->hasRole('admin', 'web') || $user->hasRole('teacher', 'web') || $user->hasRole('employee', 'web');

        return Inertia::render('dashboard/notice/NoticesIndex', [
            'notices' => $notices,
            'categories' => $categories,
            'filters' => $request->only(['category_id', 'pinned', 'published_only']),
            'canCreate' => $canCreate,
        ]);
    }

    public function create()
    {
        $user = Auth::user();
        if (! $user->hasRole('super_admin') && ! $user->hasRole('admin') && ! $user->hasRole('teacher') && ! $user->hasRole('employee')) {
            abort(403, 'Only admin, teacher or employee can create notices.');
        }
        $categories = NoticeCategory::where('is_active', true)->get();
        $classSectionGroups = ClassSectionGroup::with('classSection.class', 'classSection.section')->get();
        $teachers = Teacher::with('user:id,name')->where('is_active', true)->get();
        $employees = Employee::with('user:id,name')->get();
        $parents = ParentModel::with('user:id,name')->where('is_active', true)->get();
        $enrollments = StudentEnrollment::with('student.user:id,name')->where('status', 'active')->get();

        return Inertia::render('dashboard/notice/NoticeForm', [
            'categories' => $categories,
            'classSectionGroups' => $classSectionGroups,
            'teachers' => $teachers,
            'employees' => $employees,
            'parents' => $parents,
            'enrollments' => $enrollments,
            'targetTypes' => $this->targetTypeOptions(),
        ]);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        if (! $user->hasRole('super_admin') && ! $user->hasRole('admin') && ! $user->hasRole('teacher') && ! $user->hasRole('employee')) {
            abort(403, 'Only admin, teacher or employee can create notices.');
        }
        $targetsInput = $request->input('targets');
        if (is_string($targetsInput)) {
            $targetsInput = json_decode($targetsInput, true) ?? [];
        }
        foreach ($targetsInput as &$t) {
            foreach ($t['details'] ?? [] as &$d) {
                foreach (['class_section_group_id', 'student_enrollment_id', 'teacher_id', 'employee_id', 'parent_id'] as $key) {
                    if (isset($d[$key]) && $d[$key] === '') {
                        $d[$key] = null;
                    }
                }
            }
        }
        $request->merge(['targets' => $targetsInput]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'nullable|exists:notice_categories,id',
            'is_pinned' => 'boolean',
            'priority' => 'in:low,medium,high,urgent',
            'allow_comments' => 'boolean',
            'allow_likes' => 'boolean',
            'is_published' => 'boolean',
            'publish_at' => 'nullable|date',
            'expire_at' => 'nullable|date',
            'targets' => 'array',
            'targets.*.target_type' => 'required|string',
            'targets.*.details' => 'array',
            'targets.*.details.*.class_section_group_id' => 'nullable|exists:class_section_groups,id',
            'targets.*.details.*.student_enrollment_id' => 'nullable|exists:student_enrollments,id',
            'targets.*.details.*.teacher_id' => 'nullable|exists:teachers,id',
            'targets.*.details.*.employee_id' => 'nullable|exists:employees,id',
            'targets.*.details.*.parent_id' => 'nullable|exists:parents,id',
            'targets.*.details.*.department' => 'nullable|string|max:100',
            'attachments' => 'nullable|array|max:10',
            'attachments.*' => UploadRules::documentFile(maxKilobytes: 10240),
        ]);

        $user = Auth::user();
        $employee = Employee::where('user_id', $user->id)->first();
        $teacher = Teacher::where('user_id', $user->id)->first();

        $notice = Notice::create([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category_id' => $validated['category_id'] ?? null,
            'created_by_employee_id' => $employee?->id,
            'created_by_teacher_id' => $teacher?->id,
            'is_pinned' => $request->boolean('is_pinned', false),
            'priority' => $validated['priority'] ?? 'medium',
            'allow_comments' => $request->boolean('allow_comments', true),
            'allow_likes' => $request->boolean('allow_likes', true),
            'is_published' => $request->boolean('is_published', true),
            'publish_at' => $validated['publish_at'] ?? null,
            'expire_at' => $validated['expire_at'] ?? null,
        ]);

        foreach ($validated['targets'] ?? [] as $t) {
            $target = $notice->targets()->create(['target_type' => $t['target_type']]);
            foreach ($t['details'] ?? [] as $d) {
                $target->details()->create([
                    'class_section_group_id' => ! empty($d['class_section_group_id']) ? (int) $d['class_section_group_id'] : null,
                    'student_enrollment_id' => ! empty($d['student_enrollment_id']) ? (int) $d['student_enrollment_id'] : null,
                    'teacher_id' => ! empty($d['teacher_id']) ? (int) $d['teacher_id'] : null,
                    'employee_id' => ! empty($d['employee_id']) ? (int) $d['employee_id'] : null,
                    'parent_id' => ! empty($d['parent_id']) ? (int) $d['parent_id'] : null,
                    'department' => ! empty($d['department']) ? $d['department'] : null,
                ]);
            }
        }

        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $path = $file->store('notices/'.$notice->id, 'public');
                NoticeAttachment::create([
                    'notice_id' => $notice->id,
                    'file' => $path,
                    'original_name' => basename($file->getClientOriginalName()),
                ]);
            }
        }

        $userIds = $this->audienceService->getTargetUserIds($notice->load('targets.details'));
        $now = now();
        foreach ($userIds as $uid) {
            NoticeNotification::create([
                'notice_id' => $notice->id,
                'user_id' => $uid,
                'notification_at' => $now,
                'is_seen' => false,
            ]);
            $targetUser = User::find($uid);
            if ($targetUser && $targetUser->email) {
                Mail::to($targetUser->email)->queue(new NoticeCreatedMail($notice, $targetUser));
            }
        }

        if ($request->header('X-Inertia')) {
            session()->flash('success', 'Notice created successfully.');
            return Inertia::location(route('notices.index'));
        }
        return redirect()->route('notices.index')->with('success', 'Notice created successfully.');
    }

    public function show(Notice $notice)
    {
        $notice->load(['category', 'targets.details.classSectionGroup', 'attachments', 'reads.user', 'likes.user', 'comments.user']);
        $user = Auth::user();
        $read = NoticeRead::where('notice_id', $notice->id)->where('user_id', $user->id)->first();
        if (! $read) {
            NoticeRead::create([
                'notice_id' => $notice->id,
                'user_id' => $user->id,
                'read_at' => now(),
            ]);
            NoticeNotification::where('notice_id', $notice->id)->where('user_id', $user->id)->update(['is_seen' => true]);
        }

        $liked = NoticeLike::where('notice_id', $notice->id)->where('user_id', $user->id)->exists();
        $canEdit = $user->hasRole('super_admin') || $user->hasRole('admin')
            || $notice->created_by_employee_id && Employee::where('user_id', $user->id)->where('id', $notice->created_by_employee_id)->exists()
            || $notice->created_by_teacher_id && Teacher::where('user_id', $user->id)->where('id', $notice->created_by_teacher_id)->exists();

        return Inertia::render('dashboard/notice/NoticeShow', [
            'notice' => $notice,
            'liked' => $liked,
            'canEdit' => $canEdit,
        ]);
    }

    public function edit(Notice $notice)
    {
        $user = Auth::user();
        if (! $user->hasRole('super_admin') && ! $user->hasRole('admin')) {
            $emp = Employee::where('user_id', $user->id)->first();
            $tea = Teacher::where('user_id', $user->id)->first();
            if ($notice->created_by_employee_id !== $emp?->id && $notice->created_by_teacher_id !== $tea?->id) {
                abort(403);
            }
        }
        $notice->load('targets.details');
        $categories = NoticeCategory::where('is_active', true)->get();
        $classSectionGroups = ClassSectionGroup::with('classSection.class', 'classSection.section')->get();
        $teachers = Teacher::with('user:id,name')->where('is_active', true)->get();
        $employees = Employee::with('user:id,name')->get();
        $parents = ParentModel::with('user:id,name')->where('is_active', true)->get();
        $enrollments = StudentEnrollment::with('student.user:id,name')->where('status', 'active')->get();

        return Inertia::render('dashboard/notice/NoticeForm', [
            'notice' => $notice,
            'categories' => $categories,
            'classSectionGroups' => $classSectionGroups,
            'teachers' => $teachers,
            'employees' => $employees,
            'parents' => $parents,
            'enrollments' => $enrollments,
            'targetTypes' => $this->targetTypeOptions(),
        ]);
    }

    public function update(Request $request, Notice $notice)
    {
        $user = Auth::user();
        if (! $user->hasRole('super_admin') && ! $user->hasRole('admin')) {
            $emp = Employee::where('user_id', $user->id)->first();
            $tea = Teacher::where('user_id', $user->id)->first();
            if ($notice->created_by_employee_id !== $emp?->id && $notice->created_by_teacher_id !== $tea?->id) {
                abort(403);
            }
        }

        $targetsInput = $request->input('targets', []);
        foreach ($targetsInput as &$t) {
            foreach ($t['details'] ?? [] as &$d) {
                foreach (['class_section_group_id', 'student_enrollment_id', 'teacher_id', 'employee_id', 'parent_id'] as $key) {
                    if (isset($d[$key]) && $d[$key] === '') {
                        $d[$key] = null;
                    }
                }
            }
        }
        $request->merge(['targets' => $targetsInput]);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'nullable|exists:notice_categories,id',
            'is_pinned' => 'boolean',
            'priority' => 'in:low,medium,high,urgent',
            'allow_comments' => 'boolean',
            'allow_likes' => 'boolean',
            'is_published' => 'boolean',
            'publish_at' => 'nullable|date',
            'expire_at' => 'nullable|date',
            'targets' => 'array',
            'targets.*.target_type' => 'required|string',
            'targets.*.details' => 'array',
            'targets.*.details.*.class_section_group_id' => 'nullable|exists:class_section_groups,id',
            'targets.*.details.*.student_enrollment_id' => 'nullable|exists:student_enrollments,id',
            'targets.*.details.*.teacher_id' => 'nullable|exists:teachers,id',
            'targets.*.details.*.employee_id' => 'nullable|exists:employees,id',
            'targets.*.details.*.parent_id' => 'nullable|exists:parents,id',
            'targets.*.details.*.department' => 'nullable|string|max:100',
        ]);

        $notice->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'category_id' => $validated['category_id'] ?? null,
            'is_pinned' => $request->boolean('is_pinned', false),
            'priority' => $validated['priority'] ?? 'medium',
            'allow_comments' => $request->boolean('allow_comments', true),
            'allow_likes' => $request->boolean('allow_likes', true),
            'is_published' => $request->boolean('is_published', true),
            'publish_at' => $validated['publish_at'] ?? null,
            'expire_at' => $validated['expire_at'] ?? null,
        ]);

        $notice->targets()->delete();
        foreach ($validated['targets'] ?? [] as $t) {
            $target = $notice->targets()->create(['target_type' => $t['target_type']]);
            foreach ($t['details'] ?? [] as $d) {
                $target->details()->create([
                    'class_section_group_id' => ! empty($d['class_section_group_id']) ? (int) $d['class_section_group_id'] : null,
                    'student_enrollment_id' => ! empty($d['student_enrollment_id']) ? (int) $d['student_enrollment_id'] : null,
                    'teacher_id' => ! empty($d['teacher_id']) ? (int) $d['teacher_id'] : null,
                    'employee_id' => ! empty($d['employee_id']) ? (int) $d['employee_id'] : null,
                    'parent_id' => ! empty($d['parent_id']) ? (int) $d['parent_id'] : null,
                    'department' => ! empty($d['department']) ? $d['department'] : null,
                ]);
            }
        }

        return redirect()->route('notices.show', $notice->id)->with('success', 'Notice updated successfully.');
    }

    public function destroy(Notice $notice)
    {
        $user = Auth::user();
        if (! $user->hasRole('super_admin') && ! $user->hasRole('admin')) {
            $emp = Employee::where('user_id', $user->id)->first();
            $tea = Teacher::where('user_id', $user->id)->first();
            if ($notice->created_by_employee_id !== $emp?->id && $notice->created_by_teacher_id !== $tea?->id) {
                abort(403);
            }
        }
        foreach ($notice->attachments as $att) {
            Storage::disk('public')->delete($att->file);
        }
        $notice->delete();
        return redirect()->route('notices.index')->with('success', 'Notice deleted.');
    }

    public function like(Notice $notice)
    {
        $user = Auth::user();
        $like = NoticeLike::where('notice_id', $notice->id)->where('user_id', $user->id)->first();
        if ($like) {
            $like->delete();
            return back()->with('success', 'Like removed.');
        }
        NoticeLike::create([
            'notice_id' => $notice->id,
            'user_id' => $user->id,
            'liked_at' => now(),
        ]);
        return back()->with('success', 'Notice liked.');
    }

    public function comment(Request $request, Notice $notice)
    {
        if (! $notice->allow_comments) {
            abort(403);
        }
        $validated = $request->validate(['comment' => 'required|string|max:2000']);
        $user = Auth::user();
        NoticeComment::create([
            'notice_id' => $notice->id,
            'user_id' => $user->id,
            'comment' => $validated['comment'],
            'commented_at' => now(),
        ]);
        return back()->with('success', 'Comment added.');
    }

    public function analytics()
    {
        if (! Auth::user()->hasRole('super_admin') && ! Auth::user()->hasRole('admin')) {
            abort(403, 'Only admin can view analytics.');
        }
        $totalNotices = Notice::count();
        $totalReads = NoticeRead::count();
        $mostLiked = Notice::withCount('likes')->orderByDesc('likes_count')->take(10)->get();
        $mostCommented = Notice::withCount('comments')->orderByDesc('comments_count')->take(10)->get();

        return Inertia::render('dashboard/notice/NoticeAnalytics', [
            'totalNotices' => $totalNotices,
            'totalReads' => $totalReads,
            'mostLiked' => $mostLiked,
            'mostCommented' => $mostCommented,
        ]);
    }

    public function dashboard(Request $request)
    {
        $user = Auth::user();
        $baseQuery = Notice::query()->with('category');
        if (! $user->hasRole('super_admin') && ! $user->hasRole('admin')) {
            $baseQuery->whereHas('targets.details', function ($q) use ($user) {
                $this->scopeTargetForUser($q, $user);
            });
        }
        $baseQuery->published();

        $pinned = (clone $baseQuery)->where('is_pinned', true)->orderByDesc('created_at')->take(5)->get();
        $recent = (clone $baseQuery)->orderByDesc('created_at')->take(10)->get();
        $urgent = (clone $baseQuery)->where('priority', 'urgent')->orderByDesc('created_at')->take(5)->get();
        $unreadCount = NoticeNotification::where('user_id', $user->id)->where('is_seen', false)->count();

        return Inertia::render('dashboard/notice/NoticeDashboard', [
            'pinned' => $pinned,
            'recent' => $recent,
            'urgent' => $urgent,
            'unreadCount' => $unreadCount,
        ]);
    }

    private function scopeTargetForUser($q, $user): void
    {
        $student = $user->student;
        $parent = ParentModel::where('user_id', $user->id)->first();
        $teacher = Teacher::where('user_id', $user->id)->first();
        $employee = Employee::where('user_id', $user->id)->first();
        if ($student) {
            $e = StudentEnrollment::where('student_id', $student->id)->where('status', 'active')->first();
            if ($e) {
                $q->where(function ($q2) use ($e) {
                    $q2->where('class_section_group_id', $e->class_section_group_id)->orWhere('student_enrollment_id', $e->id);
                });
            }
        } elseif ($parent) {
            $groupIds = StudentEnrollment::whereHas('student', fn ($s) => $s->where('parent_id', $parent->id))->where('status', 'active')->pluck('class_section_group_id');
            $q->where(function ($q2) use ($groupIds, $parent) {
                $q2->whereIn('class_section_group_id', $groupIds)->orWhere('parent_id', $parent->id);
            });
        } elseif ($teacher) {
            $groupIds = \App\Models\ClassSectionGroupSubject::where('teacher_id', $teacher->id)->pluck('class_section_group_id');
            $q->where(function ($q2) use ($groupIds, $teacher) {
                $q2->whereIn('class_section_group_id', $groupIds)->orWhere('teacher_id', $teacher->id);
            });
        } elseif ($employee) {
            $q->where(function ($q2) use ($employee) {
                $q2->where('employee_id', $employee->id)->orWhere('department', $employee->department);
            });
        }
    }

    private function getNoticesCurrentUserCanEdit($user): \Illuminate\Support\Collection
    {
        if ($user->hasRole('super_admin') || $user->hasRole('admin')) {
            return Notice::pluck('id');
        }
        $emp = Employee::where('user_id', $user->id)->first();
        $tea = Teacher::where('user_id', $user->id)->first();
        return Notice::where('created_by_employee_id', $emp?->id)
            ->orWhere('created_by_teacher_id', $tea?->id)
            ->pluck('id');
    }

    private function targetTypeOptions(): array
    {
        return [
            NoticeTarget::ALL_STUDENTS_IN_CLASS,
            NoticeTarget::ALL_TEACHERS_TEACHING_CLASS,
            NoticeTarget::ALL_PARENTS_OF_CLASS,
            NoticeTarget::ALL_EMPLOYEES_IN_DEPARTMENT,
            NoticeTarget::SINGLE_TEACHER,
            NoticeTarget::SINGLE_EMPLOYEE,
            NoticeTarget::SINGLE_PARENT,
            NoticeTarget::SINGLE_STUDENT,
        ];
    }
}
