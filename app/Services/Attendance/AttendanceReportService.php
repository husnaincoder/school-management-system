<?php

namespace App\Services\Attendance;

use App\Models\AcademicSession;
use App\Models\AttendanceSession;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;

class AttendanceReportService
{
    /**
     * Daily attendance list for a class section group (or all) on a date.
     */
    public function dailyStudentList(
        int $academicSessionId,
        string $date,
        ?int $classSectionGroupId = null
    ): Collection {
        $query = AttendanceSession::with([
            'studentAttendances.studentEnrollment.student.user',
            'classSectionGroup',
        ])
            ->where('academic_session_id', $academicSessionId)
            ->where('type', 'student')
            ->whereDate('attendance_date', $date);

        if ($classSectionGroupId !== null) {
            $query->where('class_section_group_id', $classSectionGroupId);
        }

        $sessions = $query->get();
        $rows = collect();

        foreach ($sessions as $session) {
            foreach ($session->studentAttendances as $att) {
                $rows->push([
                    'session_id' => $session->id,
                    'date' => $date,
                    'student_enrollment_id' => $att->student_enrollment_id,
                    'student_name' => $att->studentEnrollment?->student?->full_name
                        ?? $att->studentEnrollment?->student?->user?->name ?? '—',
                    'roll_number' => $att->studentEnrollment?->roll_number ?? '—',
                    'status' => $att->status,
                    'check_in' => $att->check_in,
                    'check_out' => $att->check_out,
                    'remarks' => $att->remarks,
                ]);
            }
        }

        return $rows;
    }

    /**
     * Daily records for a single student (by enrollment) in a date range - for student/parent view.
     */
    public function studentDailyRecords(
        int $studentEnrollmentId,
        string $dateFrom,
        string $dateTo,
        ?int $academicSessionId = null,
        int $perPage = 30
    ): LengthAwarePaginator {
        return StudentAttendance::where('student_enrollment_id', $studentEnrollmentId)
            ->whereHas('attendanceSession', function ($q) use ($dateFrom, $dateTo, $academicSessionId) {
                $q->where('type', 'student')
                    ->whereDate('attendance_date', '>=', $dateFrom)
                    ->whereDate('attendance_date', '<=', $dateTo);
                if ($academicSessionId !== null) {
                    $q->where('academic_session_id', $academicSessionId);
                }
            })
            ->with('attendanceSession')
            ->orderByDesc('id')
            ->paginate($perPage);
    }

    /**
     * Monthly report for a student (by enrollment): present, absent, late, leave counts.
     */
    public function monthlyReportByStudent(
        int $studentEnrollmentId,
        int $year,
        int $month,
        ?int $academicSessionId = null
    ): array {
        $records = $this->monthlyDayWiseByStudent($studentEnrollmentId, $year, $month, $academicSessionId);

        return [
            'year' => $records['year'],
            'month' => $records['month'],
            'total' => $records['total'],
            'present' => $records['present'],
            'absent' => $records['absent'],
            'late' => $records['late'],
            'leave' => $records['leave'],
            'percentage' => $records['percentage'],
        ];
    }

    /**
     * Monthly day-wise attendance for a student (date + status list + summary).
     *
     * @return array{
     *   year: int,
     *   month: int,
     *   month_label: string,
     *   total: int,
     *   present: int,
     *   absent: int,
     *   late: int,
     *   leave: int,
     *   percentage: float,
     *   days: list<array{date: string, date_label: string, day_name: string, status: string, status_label: string, remarks: ?string}>
     * }
     */
    public function monthlyDayWiseByStudent(
        int $studentEnrollmentId,
        int $year,
        int $month,
        ?int $academicSessionId = null
    ): array {
        $rows = StudentAttendance::query()
            ->where('student_enrollment_id', $studentEnrollmentId)
            ->whereHas('attendanceSession', function ($q) use ($year, $month, $academicSessionId) {
                $q->whereYear('attendance_date', $year)
                    ->whereMonth('attendance_date', $month)
                    ->where('type', 'student');
                if ($academicSessionId !== null) {
                    $q->where('academic_session_id', $academicSessionId);
                }
            })
            ->with(['attendanceSession:id,attendance_date,academic_session_id,type'])
            ->get()
            ->sortBy(fn (StudentAttendance $att) => optional($att->attendanceSession?->attendance_date)->format('Y-m-d') ?? '')
            ->values();

        $present = 0;
        $absent = 0;
        $late = 0;
        $leave = 0;
        $days = [];

        foreach ($rows as $att) {
            $status = strtolower((string) ($att->status ?? ''));
            match ($status) {
                'present' => $present++,
                'absent' => $absent++,
                'late' => $late++,
                'leave' => $leave++,
                default => null,
            };

            $date = $att->attendanceSession?->attendance_date
                ? Carbon::parse($att->attendanceSession->attendance_date)
                : null;

            $days[] = [
                'date' => $date?->format('Y-m-d') ?? '—',
                'date_label' => $date?->format('d M Y') ?? '—',
                'day_name' => $date?->format('l') ?? '—',
                'status' => $status ?: '—',
                'status_label' => $status ? ucfirst($status) : '—',
                'remarks' => $att->remarks,
            ];
        }

        $total = count($days);
        $percentage = $total > 0 ? round(($present / $total) * 100, 2) : 0.0;
        $monthDate = Carbon::create($year, $month, 1);

        return [
            'year' => $year,
            'month' => $month,
            'month_label' => $monthDate->format('F Y'),
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'leave' => $leave,
            'percentage' => $percentage,
            'days' => $days,
        ];
    }

    /**
     * Yearly report for a student (by enrollment).
     */
    public function yearlyReportByStudent(
        int $studentEnrollmentId,
        int $year,
        ?int $academicSessionId = null
    ): array {
        $query = StudentAttendance::where('student_enrollment_id', $studentEnrollmentId)
            ->whereHas('attendanceSession', function ($q) use ($year, $academicSessionId) {
                $q->whereYear('attendance_date', $year)
                    ->where('type', 'student');
                if ($academicSessionId !== null) {
                    $q->where('academic_session_id', $academicSessionId);
                }
            });

        $total = $query->count();
        $present = (clone $query)->where('status', 'present')->count();
        $absent = (clone $query)->where('status', 'absent')->count();
        $late = (clone $query)->where('status', 'late')->count();
        $leave = (clone $query)->where('status', 'leave')->count();

        $percentage = $total > 0 ? round(($present / $total) * 100, 2) : 0;

        return [
            'year' => $year,
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'leave' => $leave,
            'percentage' => $percentage,
        ];
    }

    /**
     * Attendance percentage for a student in a date range (e.g. academic session).
     */
    public function studentPercentage(
        int $studentEnrollmentId,
        ?Carbon $from = null,
        ?Carbon $to = null,
        ?int $academicSessionId = null
    ): float {
        $query = StudentAttendance::where('student_enrollment_id', $studentEnrollmentId)
            ->whereHas('attendanceSession', function ($q) use ($from, $to, $academicSessionId) {
                $q->where('type', 'student');
                if ($from) {
                    $q->whereDate('attendance_date', '>=', $from);
                }
                if ($to) {
                    $q->whereDate('attendance_date', '<=', $to);
                }
                if ($academicSessionId !== null) {
                    $q->where('academic_session_id', $academicSessionId);
                }
            });

        $total = $query->count();
        if ($total === 0) {
            return 0.0;
        }
        $present = (clone $query)->whereIn('status', ['present', 'late'])->count();
        return round(($present / $total) * 100, 2);
    }

    /**
     * Class-wise attendance percentage for a date range.
     * @param  array<int>|null  $allowedGroupIds  When set (e.g. for teacher incharge), only these class_section_group ids are included.
     */
    public function classWisePercentage(
        int $academicSessionId,
        string $dateFrom,
        string $dateTo,
        ?array $allowedGroupIds = null
    ): Collection {
        $query = AttendanceSession::where('academic_session_id', $academicSessionId)
            ->where('type', 'student')
            ->whereBetween('attendance_date', [$dateFrom, $dateTo])
            ->whereNotNull('class_section_group_id');
        if ($allowedGroupIds !== null) {
            $query->whereIn('class_section_group_id', $allowedGroupIds);
        }
        $sessions = $query->with('classSectionGroup.classSection.class', 'classSectionGroup.classSection.section', 'classSectionGroup.subjectGroup')->get();

        $byGroup = $sessions->groupBy('class_section_group_id');
        $result = collect();

        foreach ($byGroup as $groupId => $groupSessions) {
            $sessionIds = $groupSessions->pluck('id');
            $total = StudentAttendance::whereIn('attendance_session_id', $sessionIds)->count();
            $present = StudentAttendance::whereIn('attendance_session_id', $sessionIds)
                ->whereIn('status', ['present', 'late'])->count();
            $percentage = $total > 0 ? round(($present / $total) * 100, 2) : 0;

            $first = $groupSessions->first();
            $csg = $first->classSectionGroup;
            $label = $csg
                ? trim(($csg->classSection?->class?->name ?? '') . ' ' . ($csg->classSection?->section?->name ?? '') . ' ' . ($csg->subjectGroup?->name ?? ''))
                : 'Group #' . $groupId;

            $result->push([
                'class_section_group_id' => $groupId,
                'label' => $label ?: '—',
                'total' => $total,
                'present' => $present,
                'percentage' => $percentage,
            ]);
        }

        return $result->sortByDesc('percentage')->values();
    }

    /**
     * Most absent students in a class/session in date range.
     * @param  array<int>|null  $allowedGroupIds  When set (e.g. for teacher incharge), restrict to these class_section_group ids only.
     */
    public function mostAbsentStudents(
        int $academicSessionId,
        ?int $classSectionGroupId = null,
        string $dateFrom = '',
        string $dateTo = '',
        int $limit = 10,
        ?array $allowedGroupIds = null
    ): Collection {
        $query = AttendanceSession::where('academic_session_id', $academicSessionId)
            ->where('type', 'student')
            ->whereNotNull('class_section_group_id');

        if ($allowedGroupIds !== null) {
            $query->whereIn('class_section_group_id', $allowedGroupIds);
        }
        if ($classSectionGroupId) {
            $query->where('class_section_group_id', $classSectionGroupId);
        }
        if ($dateFrom) {
            $query->whereDate('attendance_date', '>=', $dateFrom);
        }
        if ($dateTo) {
            $query->whereDate('attendance_date', '<=', $dateTo);
        }

        $sessionIds = $query->pluck('id');

        return StudentAttendance::whereIn('attendance_session_id', $sessionIds)
            ->where('status', 'absent')
            ->selectRaw('student_enrollment_id, count(*) as absent_count')
            ->groupBy('student_enrollment_id')
            ->orderByDesc('absent_count')
            ->limit($limit)
            ->with('studentEnrollment.student.user')
            ->get()
            ->map(function ($row) {
                $en = $row->studentEnrollment;
                return [
                    'student_enrollment_id' => $row->student_enrollment_id,
                    'student_name' => $en?->student?->full_name ?? $en?->student?->user?->name ?? '—',
                    'roll_number' => $en?->roll_number ?? '—',
                    'absent_count' => $row->absent_count,
                ];
            });
    }

    /**
     * Today's attendance summary for dashboard.
     * @param  array<int>|null  $allowedGroupIds  When set (e.g. for teacher incharge), only sessions for these class_section_group ids are counted.
     */
    public function todaySummary(?int $academicSessionId = null, ?array $allowedGroupIds = null): array
    {
        $today = now()->toDateString();
        $query = AttendanceSession::whereDate('attendance_date', $today)
            ->where('type', 'student');

        if ($academicSessionId !== null) {
            $query->where('academic_session_id', $academicSessionId);
        }
        if ($allowedGroupIds !== null) {
            $query->whereIn('class_section_group_id', $allowedGroupIds);
        }

        $sessionIds = $query->pluck('id');
        $total = StudentAttendance::whereIn('attendance_session_id', $sessionIds)->count();
        $present = StudentAttendance::whereIn('attendance_session_id', $sessionIds)->where('status', 'present')->count();
        $absent = StudentAttendance::whereIn('attendance_session_id', $sessionIds)->where('status', 'absent')->count();
        $late = StudentAttendance::whereIn('attendance_session_id', $sessionIds)->where('status', 'late')->count();
        $leave = StudentAttendance::whereIn('attendance_session_id', $sessionIds)->where('status', 'leave')->count();

        $percentage = $total > 0 ? round(($present + $late) / $total * 100, 2) : 0;
        $belowThreshold = $percentage > 0 && $percentage < 75;

        return [
            'date' => $today,
            'total' => $total,
            'present' => $present,
            'absent' => $absent,
            'late' => $late,
            'leave' => $leave,
            'percentage' => $percentage,
            'alert_below_75' => $belowThreshold,
        ];
    }
}
