<?php

namespace App\Http\Controllers\Dashboard\ClassIncharge;

use App\Http\Controllers\Controller;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use App\Models\Timetable;
use App\Services\ClassIncharge\ClassInchargeAccessService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ClassInchargeDashboardController extends Controller
{
    public function __construct(
        protected ClassInchargeAccessService $access
    ) {}

    public function index(Request $request)
    {
        $user = Auth::user();
        abort_unless($this->access->hasClassInchargeRole($user), 403);

        $teacher = $this->access->teacherFromUser($user);
        if (! $teacher) {
            return inertia('dashboard/class-incharge/Dashboard', [
                'classes' => [],
                'message' => 'Teacher profile not found. Link your user to a teacher record.',
            ]);
        }

        $sections = $this->access->activeClassSectionsForTeacher($teacher->id);
        $today = now()->toDateString();
        $day = strtolower(now()->format('l'));

        $classes = $sections->map(function ($cs) use ($today, $day) {
            $groupIds = $cs->classSectionGroups->pluck('id');
            $enrollments = StudentEnrollment::with('student.user')
                ->whereIn('class_section_group_id', $groupIds->all())
                ->where('status', 'active')
                ->get();

            $sessionIds = \App\Models\AttendanceSession::query()
                ->whereDate('attendance_date', $today)
                ->where('type', 'student')
                ->whereIn('class_section_group_id', $groupIds->all())
                ->pluck('id');

            $attendanceCounts = [
                'present' => 0,
                'absent' => 0,
                'late' => 0,
                'leave' => 0,
            ];
            if ($sessionIds->isNotEmpty()) {
                $rows = StudentAttendance::query()
                    ->whereIn('attendance_session_id', $sessionIds->all())
                    ->selectRaw('status, COUNT(*) as c')
                    ->groupBy('status')
                    ->pluck('c', 'status');
                foreach ($attendanceCounts as $status => $_) {
                    $attendanceCounts[$status] = (int) ($rows[$status] ?? 0);
                }
            }

            $subjects = [];
            foreach ($cs->classSectionGroups as $group) {
                $group->loadMissing(['classSectionGroupSubjects.subject', 'classSectionGroupSubjects.teacher.user', 'subjectGroup']);
                foreach ($group->classSectionGroupSubjects as $csgs) {
                    $subjects[] = [
                        'subject' => $csgs->subject?->name,
                        'teacher' => $csgs->teacher?->user?->name,
                        'group' => $group->subjectGroup?->name,
                        'weekly_classes' => $csgs->weekly_classes,
                    ];
                }
            }

            $timetable = Timetable::query()
                ->with(['timetableEnters' => fn ($q) => $q->where('day', $day)->with(['timeSlot', 'classSectionGroupSubject.subject', 'teacher.user', 'classRoom'])])
                ->whereIn('class_section_group_id', $groupIds->all())
                ->where(function ($q) {
                    $q->where('status', 'published')->orWhere('is_active', true);
                })
                ->first();

            $todayPeriods = [];
            if ($timetable) {
                foreach ($timetable->timetableEnters as $entry) {
                    $todayPeriods[] = [
                        'slot' => $entry->timeSlot?->name,
                        'subject' => $entry->classSectionGroupSubject?->subject?->name,
                        'teacher' => $entry->teacher?->user?->name,
                        'room' => $entry->classRoom?->name,
                    ];
                }
            }

            return [
                'id' => $cs->id,
                'label' => trim(($cs->class?->name ?? '').' - '.($cs->section?->name ?? '')),
                'session' => $cs->academicSession?->name,
                'total_students' => $enrollments->count(),
                'today_attendance' => $attendanceCounts,
                'subjects' => $subjects,
                'today_timetable' => $todayPeriods,
            ];
        })->values();

        return inertia('dashboard/class-incharge/Dashboard', [
            'classes' => $classes,
            'message' => $classes->isEmpty()
                ? 'No active Class Incharge assignment found. Ask admin to assign you to a class section.'
                : null,
        ]);
    }

    public function subjects(Request $request, int $classSection)
    {
        $user = Auth::user();
        abort_unless($this->access->canManageClassSection($user, $classSection), 403);

        $cs = \App\Models\ClassSection::with([
            'class', 'section', 'academicSession',
            'classSectionGroups.subjectGroup',
            'classSectionGroups.classSectionGroupSubjects.subject',
            'classSectionGroups.classSectionGroupSubjects.teacher.user',
        ])->findOrFail($classSection);

        $subjects = [];
        foreach ($cs->classSectionGroups as $group) {
            foreach ($group->classSectionGroupSubjects as $row) {
                $subjects[] = [
                    'id' => $row->id,
                    'subject' => $row->subject?->name,
                    'code' => $row->subject?->code,
                    'teacher' => $row->teacher?->user?->name ?? '—',
                    'group' => $group->subjectGroup?->name,
                    'weekly_classes' => $row->weekly_classes,
                ];
            }
        }

        return inertia('dashboard/class-incharge/Subjects', [
            'classSection' => [
                'id' => $cs->id,
                'label' => trim(($cs->class?->name ?? '').' - '.($cs->section?->name ?? '')),
                'session' => $cs->academicSession?->name,
            ],
            'subjects' => $subjects,
        ]);
    }

    public function timetable(Request $request, int $classSection)
    {
        $user = Auth::user();
        abort_unless($this->access->canManageClassSection($user, $classSection), 403);

        $cs = \App\Models\ClassSection::with(['class', 'section', 'academicSession', 'classSectionGroups'])->findOrFail($classSection);
        $groupIds = $cs->classSectionGroups->pluck('id');

        $timetable = Timetable::with([
            'timetableEnters.timeSlot',
            'timetableEnters.teacher.user',
            'timetableEnters.classRoom',
            'timetableEnters.classSectionGroupSubject.subject',
            'academicSession',
        ])
            ->whereIn('class_section_group_id', $groupIds->all())
            ->orderByDesc('id')
            ->first();

        $timeSlots = \App\Models\TimeSlot::orderBy('slot_order')->orderBy('start_time')->get();
        $days = \App\Models\TimetableEnter::DAYS;

        return inertia('dashboard/class-incharge/Timetable', [
            'classSection' => [
                'id' => $cs->id,
                'label' => trim(($cs->class?->name ?? '').' - '.($cs->section?->name ?? '')),
                'session' => $cs->academicSession?->name,
            ],
            'timetable' => $timetable,
            'timeSlots' => $timeSlots,
            'days' => $days,
        ]);
    }
}
