<?php

namespace App\Http\Controllers\Dashboard\TimeTable;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassRoom;
use App\Models\ClassSectionGroup;
use App\Models\ClassSectionGroupSubject;
use App\Models\Teacher;
use App\Models\TeacherAvailability;
use App\Models\TimeSlot;
use App\Models\Timetable;
use App\Models\TimetableAdjustment;
use App\Models\TimetableEnter;
use App\Services\Timetable\TimetableConflictService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class TimetableController extends Controller
{
    public function __construct(protected TimetableConflictService $conflicts) {}

    public function index(Request $request)
    {
        $query = Timetable::with([
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'academicSession',
        ]);
        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->academic_session_id);
        }
        if ($request->filled('class_section_group_id')) {
            $query->where('class_section_group_id', $request->class_section_group_id);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        $timetables = $query->orderBy('academic_session_id')->orderBy('class_section_group_id')->get();

        $sessions = AcademicSession::orderBy('start_date', 'desc')->get();
        $classSectionGroups = ClassSectionGroup::with('classSection.class', 'classSection.section', 'subjectGroup')
            ->orderBy('class_section_id')->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'name' => ($g->classSection->class->name ?? '').' - '.($g->classSection->section->name ?? '').' ('.($g->subjectGroup->name ?? '').')',
            ]);

        return inertia('dashboard/academic/Timetables', [
            'timetables' => $timetables,
            'academicSessions' => $sessions,
            'classSectionGroups' => $classSectionGroups,
            'filterSessionId' => $request->academic_session_id,
            'filterClassSectionGroupId' => $request->class_section_group_id,
            'filterStatus' => $request->status,
            'statuses' => Timetable::STATUSES,
        ]);
    }

    public function create()
    {
        $sessions = AcademicSession::orderBy('start_date', 'desc')->get();
        $classSectionGroups = ClassSectionGroup::with('classSection.class', 'classSection.section', 'subjectGroup')
            ->orderBy('class_section_id')->get()
            ->map(fn ($g) => [
                'id' => $g->id,
                'name' => ($g->classSection->class->name ?? '').' - '.($g->classSection->section->name ?? '').' ('.($g->subjectGroup->name ?? '').')',
            ]);

        return inertia('dashboard/academic/TimetableForm', [
            'academicSessions' => $sessions,
            'classSectionGroups' => $classSectionGroups,
            'statuses' => Timetable::STATUSES,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'name' => 'nullable|string|max:255',
            'status' => ['nullable', Rule::in(Timetable::STATUSES)],
            'is_active' => 'boolean',
        ]);

        $validated['status'] = $validated['status'] ?? Timetable::STATUS_DRAFT;
        $validated['is_active'] = $request->has('is_active')
            ? $request->boolean('is_active')
            : ($validated['status'] === Timetable::STATUS_PUBLISHED);

        $timetable = Timetable::create($validated);

        return redirect()
            ->route('academic.timetables.edit', $timetable)
            ->with('success', 'Timetable created. Assign subjects in the builder.');
    }

    public function show(Timetable $timetable)
    {
        $timetable->load([
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'academicSession',
            'timetableEnters.timeSlot',
            'timetableEnters.teacher.user',
            'timetableEnters.classRoom',
            'timetableEnters.classSectionGroupSubject.subject',
        ]);
        $timeSlots = TimeSlot::orderBy('slot_order')->orderBy('start_time')->get();
        $days = TimetableEnter::DAYS;

        return inertia('dashboard/academic/TimetableShow', [
            'timetable' => $timetable,
            'timeSlots' => $timeSlots,
            'days' => $days,
            'subjectProgress' => $this->conflicts->subjectProgress($timetable),
            'teacherWorkload' => $this->conflicts->teacherWorkload($timetable),
        ]);
    }

    public function edit(Timetable $timetable)
    {
        $timetable->load([
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'academicSession',
            'timetableEnters.timeSlot',
            'timetableEnters.teacher',
            'timetableEnters.classRoom',
            'timetableEnters.classSectionGroupSubject',
        ]);
        $timeSlots = TimeSlot::orderBy('slot_order')->orderBy('start_time')->get();
        $days = TimetableEnter::DAYS;
        $classSectionGroupSubjects = ClassSectionGroupSubject::with('subject', 'teacher.user')
            ->where('class_section_group_id', $timetable->class_section_group_id)
            ->get()
            ->map(fn ($s) => [
                'id' => $s->id,
                'subject' => $s->subject,
                'teacher_id' => $s->teacher_id,
                'teacher' => $s->teacher ? [
                    'id' => $s->teacher->id,
                    'name' => $s->teacher->user?->name,
                ] : null,
                'weekly_classes' => $s->weekly_classes,
            ]);
        $teachers = Teacher::with('user:id,name')->get()
            ->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name ?? 'Teacher #'.$t->id]);
        $classRooms = ClassRoom::query()
            ->when(
                \Illuminate\Support\Facades\Schema::hasColumn('class_rooms', 'is_active'),
                fn ($q) => $q->where(function ($q2) {
                    $q2->where('is_active', true)->orWhereNull('is_active');
                })
            )
            ->orderBy('name')
            ->get();

        $unavailable = TeacherAvailability::query()
            ->where('is_available', false)
            ->get(['teacher_id', 'day', 'time_slot_id']);

        return inertia('dashboard/academic/TimetableEdit', [
            'timetable' => $timetable,
            'timeSlots' => $timeSlots,
            'days' => $days,
            'classSectionGroupSubjects' => $classSectionGroupSubjects,
            'teachers' => $teachers,
            'classRooms' => $classRooms,
            'subjectProgress' => $this->conflicts->subjectProgress($timetable),
            'teacherWorkload' => $this->conflicts->teacherWorkload($timetable),
            'unavailableCells' => $unavailable,
            'statuses' => Timetable::STATUSES,
        ]);
    }

    public function update(Request $request, Timetable $timetable)
    {
        $validated = $request->validate([
            'name' => 'nullable|string|max:255',
            'status' => ['nullable', Rule::in(Timetable::STATUSES)],
            'is_active' => 'boolean',
            'entries' => 'nullable|array',
            'entries.*.id' => 'nullable|integer',
            'entries.*.day' => ['required_with:entries', Rule::in(TimetableEnter::DAYS)],
            'entries.*.time_slot_id' => 'required_with:entries|exists:time_slots,id',
            'entries.*.class_section_group_subject_id' => 'nullable|exists:class_section_group_subjects,id',
            'entries.*.teacher_id' => 'nullable|exists:teachers,id',
            'entries.*.class_room_id' => 'nullable|exists:class_rooms,id',
        ]);

        if (array_key_exists('status', $validated) && $validated['status']) {
            $timetable->status = $validated['status'];
            $timetable->is_active = $validated['status'] === Timetable::STATUS_PUBLISHED;
        } elseif ($request->has('is_active')) {
            $timetable->is_active = $request->boolean('is_active');
            if ($timetable->is_active && ($timetable->status ?? '') === Timetable::STATUS_DRAFT) {
                $timetable->status = Timetable::STATUS_PUBLISHED;
            }
            if (! $timetable->is_active && ($timetable->status ?? '') === Timetable::STATUS_PUBLISHED) {
                $timetable->status = Timetable::STATUS_ARCHIVED;
            }
        }
        if (array_key_exists('name', $validated)) {
            $timetable->name = $validated['name'];
        }
        $timetable->save();

        if ($request->has('entries')) {
            $entries = $request->input('entries', []);
            $this->conflicts->assertEntriesValid($timetable, $entries);

            DB::transaction(function () use ($timetable, $entries) {
                // Release unique indexes so swaps within this save succeed.
                $timetable->timetableEnters()->update([
                    'teacher_id' => null,
                    'class_room_id' => null,
                ]);

                $entryIds = [];
                foreach ($entries as $entry) {
                    $subjectId = $entry['class_section_group_subject_id'] ?? null;
                    $subjectId = is_numeric($subjectId) && (int) $subjectId > 0 ? (int) $subjectId : null;

                    if (! $subjectId) {
                        if (! empty($entry['id'])) {
                            $timetable->timetableEnters()->where('id', $entry['id'])->delete();
                        }
                        continue;
                    }

                    $data = [
                        'day' => $entry['day'],
                        'time_slot_id' => $entry['time_slot_id'],
                        'class_section_group_subject_id' => $subjectId,
                        'teacher_id' => ! empty($entry['teacher_id']) ? (int) $entry['teacher_id'] : null,
                        'class_room_id' => ! empty($entry['class_room_id']) ? (int) $entry['class_room_id'] : null,
                    ];

                    if (! empty($entry['id'])) {
                        $e = $timetable->timetableEnters()->find($entry['id']);
                        if ($e) {
                            $e->update($data);
                            $entryIds[] = $e->id;
                            continue;
                        }
                    }

                    $existing = $timetable->timetableEnters()
                        ->where('day', $data['day'])
                        ->where('time_slot_id', $data['time_slot_id'])
                        ->first();
                    if ($existing) {
                        $existing->update($data);
                        $entryIds[] = $existing->id;
                    } else {
                        $e = $timetable->timetableEnters()->create($data);
                        $entryIds[] = $e->id;
                    }
                }

                $timetable->timetableEnters()->whereNotIn('id', $entryIds)->delete();
            });
        }

        return back()->with('success', 'Timetable updated.');
    }

    public function destroy(Timetable $timetable)
    {
        $timetable->delete();

        return redirect()->route('academic.timetables.index')->with('success', 'Timetable deleted.');
    }

    /** Class / Teacher / Room weekly views */
    public function views(Request $request)
    {
        $view = $request->get('view', 'class'); // class|teacher|room
        $sessions = AcademicSession::orderBy('start_date', 'desc')->get();
        $timeSlots = TimeSlot::orderBy('slot_order')->orderBy('start_time')->get();
        $days = TimetableEnter::DAYS;

        $timetables = Timetable::with([
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'academicSession',
        ])->orderByDesc('id')->get()->map(fn ($t) => [
            'id' => $t->id,
            'label' => ($t->name ?: '').' · '.($t->classSectionGroup?->classSection?->class?->name ?? '').' - '.($t->classSectionGroup?->classSection?->section?->name ?? '').' ('.($t->academicSession?->name ?? '').')',
            'academic_session_id' => $t->academic_session_id,
            'status' => $t->status,
        ]);

        $teachers = Teacher::with('user:id,name')->get()
            ->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name ?? 'Teacher #'.$t->id]);
        $rooms = ClassRoom::orderBy('name')->get(['id', 'name', 'code', 'room_type']);

        $grid = null;
        $title = null;

        if ($view === 'class' && $request->filled('timetable_id')) {
            $timetable = Timetable::with([
                'timetableEnters.timeSlot',
                'timetableEnters.teacher.user',
                'timetableEnters.classRoom',
                'timetableEnters.classSectionGroupSubject.subject',
                'classSectionGroup.classSection.class',
                'classSectionGroup.classSection.section',
                'academicSession',
            ])->findOrFail($request->timetable_id);
            $title = ($timetable->name ?: 'Class timetable').' · '.$timetable->academicSession?->name;
            $grid = $this->buildGridFromEntries($timetable->timetableEnters, $timeSlots, $days, 'class');
        }

        if ($view === 'teacher' && $request->filled('teacher_id')) {
            $teacher = Teacher::with('user')->findOrFail($request->teacher_id);
            $title = 'Teacher: '.($teacher->user?->name ?? '#'.$teacher->id);
            $entries = TimetableEnter::with([
                'timeSlot',
                'classRoom',
                'classSectionGroupSubject.subject',
                'timetable.classSectionGroup.classSection.class',
                'timetable.classSectionGroup.classSection.section',
            ])->where('teacher_id', $teacher->id)->get();
            $grid = $this->buildGridFromEntries($entries, $timeSlots, $days, 'teacher');
        }

        if ($view === 'room' && $request->filled('room_id')) {
            $room = ClassRoom::findOrFail($request->room_id);
            $title = 'Room: '.$room->name;
            $entries = TimetableEnter::with([
                'timeSlot',
                'teacher.user',
                'classSectionGroupSubject.subject',
                'timetable.classSectionGroup.classSection.class',
                'timetable.classSectionGroup.classSection.section',
            ])->where('class_room_id', $room->id)->get();
            $grid = $this->buildGridFromEntries($entries, $timeSlots, $days, 'room');
        }

        return inertia('dashboard/academic/TimetableViews', [
            'view' => $view,
            'title' => $title,
            'grid' => $grid,
            'timeSlots' => $timeSlots,
            'days' => $days,
            'timetables' => $timetables,
            'teachers' => $teachers,
            'rooms' => $rooms,
            'academicSessions' => $sessions,
            'filters' => [
                'timetable_id' => $request->timetable_id,
                'teacher_id' => $request->teacher_id,
                'room_id' => $request->room_id,
                'academic_session_id' => $request->academic_session_id,
            ],
        ]);
    }

    public function daily(Request $request)
    {
        $date = $request->get('date', now()->toDateString());
        $day = strtolower(Carbon::parse($date)->format('l'));
        $timeSlots = TimeSlot::orderBy('slot_order')->orderBy('start_time')->get();

        $entriesQuery = TimetableEnter::with([
            'timeSlot',
            'teacher.user',
            'classRoom',
            'classSectionGroupSubject.subject',
            'timetable.classSectionGroup.classSection.class',
            'timetable.classSectionGroup.classSection.section',
            'timetable.academicSession',
        ])->where('day', $day);

        if ($request->filled('timetable_id')) {
            $entriesQuery->where('timetable_id', $request->timetable_id);
        }

        $entries = $entriesQuery->get();
        $adjustments = TimetableAdjustment::with(['substituteTeacher.user', 'originalTeacher.user'])
            ->whereDate('adjustment_date', $date)
            ->whereIn('timetable_entry_id', $entries->pluck('id'))
            ->get()
            ->keyBy('timetable_entry_id');

        $rows = $entries->map(function (TimetableEnter $e) use ($adjustments) {
            $adj = $adjustments->get($e->id);
            $teacherName = $e->teacher?->user?->name;
            $status = 'scheduled';
            if ($adj) {
                if ($adj->action === TimetableAdjustment::ACTION_CANCEL) {
                    $status = 'cancelled';
                    $teacherName = null;
                } elseif ($adj->action === TimetableAdjustment::ACTION_SUBSTITUTE && $adj->substituteTeacher) {
                    $status = 'substituted';
                    $teacherName = $adj->substituteTeacher->user?->name.' (Sub)';
                }
            }
            $cs = $e->timetable?->classSectionGroup?->classSection;

            return [
                'time_slot' => $e->timeSlot?->name,
                'time_range' => $e->timeSlot?->time_range_label,
                'subject' => $e->classSectionGroupSubject?->subject?->name,
                'class' => trim(($cs?->class?->name ?? '').' - '.($cs?->section?->name ?? '')),
                'teacher' => $teacherName,
                'room' => $e->classRoom?->name,
                'status' => $status,
                'note' => $adj?->note,
            ];
        })->sortBy('time_slot')->values();

        $timetables = Timetable::with('classSectionGroup.classSection.class', 'classSectionGroup.classSection.section')
            ->get()
            ->map(fn ($t) => [
                'id' => $t->id,
                'label' => $t->name ?: (($t->classSectionGroup?->classSection?->class?->name ?? '').' - '.($t->classSectionGroup?->classSection?->section?->name ?? '')),
            ]);

        return inertia('dashboard/academic/TimetableDaily', [
            'date' => $date,
            'day' => $day,
            'rows' => $rows,
            'timetables' => $timetables,
            'filterTimetableId' => $request->timetable_id,
            'timeSlots' => $timeSlots,
        ]);
    }

    public function pdf(Timetable $timetable)
    {
        $timetable->load([
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'academicSession',
            'timetableEnters.timeSlot',
            'timetableEnters.teacher.user',
            'timetableEnters.classRoom',
            'timetableEnters.classSectionGroupSubject.subject',
        ]);
        $timeSlots = TimeSlot::orderBy('slot_order')->orderBy('start_time')->get();
        $days = TimetableEnter::DAYS;
        $grid = [];
        foreach ($timetable->timetableEnters as $e) {
            $grid[$e->time_slot_id][$e->day] = $e;
        }

        $pdf = Pdf::loadView('pdf.timetable', compact('timetable', 'timeSlots', 'days', 'grid'))
            ->setPaper('a4', 'landscape');

        $filename = 'timetable-'.($timetable->id).'.pdf';

        return $pdf->download($filename);
    }

    public function hubStats()
    {
        $today = now()->toDateString();
        $day = strtolower(now()->format('l'));

        $conflicts = 0;
        // Approximate: duplicate teacher slots across published timetables
        $dupTeachers = TimetableEnter::query()
            ->select('teacher_id', 'day', 'time_slot_id', DB::raw('COUNT(*) as c'))
            ->whereNotNull('teacher_id')
            ->groupBy('teacher_id', 'day', 'time_slot_id')
            ->having('c', '>', 1)
            ->count();
        $dupRooms = TimetableEnter::query()
            ->select('class_room_id', 'day', 'time_slot_id', DB::raw('COUNT(*) as c'))
            ->whereNotNull('class_room_id')
            ->groupBy('class_room_id', 'day', 'time_slot_id')
            ->having('c', '>', 1)
            ->count();
        $conflicts = $dupTeachers + $dupRooms;

        return [
            'total_timetables' => Timetable::count(),
            'active_timetables' => Timetable::query()
                ->where(function ($q) {
                    $q->where('status', Timetable::STATUS_PUBLISHED)->orWhere('is_active', true);
                })
                ->count(),
            'total_teachers' => Teacher::count(),
            'total_rooms' => ClassRoom::count(),
            'total_slots' => TimeSlot::count(),
            'todays_classes' => in_array($day, TimetableEnter::DAYS, true)
                ? TimetableEnter::where('day', $day)->count()
                : 0,
            'todays_substitutions' => TimetableAdjustment::whereDate('adjustment_date', $today)
                ->where('action', TimetableAdjustment::ACTION_SUBSTITUTE)
                ->count(),
            'conflicts' => $conflicts,
        ];
    }

    /**
     * @param  \Illuminate\Support\Collection<int, TimetableEnter>  $entries
     * @param  \Illuminate\Support\Collection<int, TimeSlot>  $timeSlots
     * @param  list<string>  $days
     * @return array{cells: array<string, array>, mode: string}
     */
    protected function buildGridFromEntries($entries, $timeSlots, array $days, string $mode): array
    {
        $cells = [];
        foreach ($entries as $e) {
            $key = $e->day.'|'.$e->time_slot_id;
            $cs = $e->timetable?->classSectionGroup?->classSection;
            $cells[$key] = [
                'subject' => $e->classSectionGroupSubject?->subject?->name,
                'teacher' => $e->teacher?->user?->name,
                'room' => $e->classRoom?->name,
                'class' => trim(($cs?->class?->name ?? '').' - '.($cs?->section?->name ?? '')),
            ];
        }

        return ['cells' => $cells, 'mode' => $mode];
    }
}
