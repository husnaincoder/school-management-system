<?php

namespace App\Services\Attendance;

use App\Models\AttendanceSession;
use App\Models\AttendanceSetting;
use App\Models\StudentAttendance;
use App\Models\StudentEnrollment;
use App\Models\AttendanceAuditLog;
use App\Models\AttendanceMonthlyFreeze;
use Illuminate\Support\Collection;
use Illuminate\Contracts\Auth\Authenticatable;

class StudentAttendanceService
{
    public function __construct(
        protected AttendanceAuditService $auditService
    ) {}

    public function getEnrollmentsForSession(AttendanceSession $session): Collection
    {
        if ($session->type !== 'student' || ! $session->class_section_group_id) {
            return collect();
        }

        return StudentEnrollment::where('class_section_group_id', $session->class_section_group_id)
            ->with('student.user')
            ->orderBy('roll_number')
            ->get();
    }

    public function getExistingRecords(AttendanceSession $session): Collection
    {
        return $session->studentAttendances()->get()->keyBy('student_enrollment_id');
    }

    /**
     * Resolve status from settings: late_after, half_day_after, weekend_off.
     */
    public function resolveStatusFromSettings(
        AttendanceSession $session,
        ?string $checkIn,
        ?string $status
    ): string {
        if ($status !== 'present' || empty($checkIn)) {
            return $status;
        }

        $setting = AttendanceSetting::forSessionAndType(
            $session->academic_session_id,
            AttendanceSetting::USER_TYPE_STUDENT
        );

        if (! $setting) {
            return $status;
        }

        $dayOfWeek = $session->attendance_date->dayOfWeek; // 0 = Sunday, 6 = Saturday
        if ($setting->weekend_off && in_array($dayOfWeek, [0, 6], true)) {
            return 'leave'; // or keep present depending on business rule
        }

        $lateAfter = $setting->late_after ? $setting->late_after->format('H:i') : null;
        $halfDayAfter = $setting->half_day_after ? $setting->half_day_after->format('H:i') : null;

        $checkInTime = preg_replace('/^(\d{1,2}:\d{2})(?::\d{2})?$/', '$1', $checkIn);
        if (strlen($checkInTime) === 5) {
            $checkInTime .= ':00';
        }

        if ($halfDayAfter && $checkInTime > $halfDayAfter) {
            return 'absent'; // or 'half_day' if you add that status
        }
        if ($lateAfter && $checkInTime > $lateAfter) {
            return 'late';
        }

        return $status;
    }

    public function bulkMarkPresent(AttendanceSession $session, Authenticatable $user): void
    {
        $this->guardCanEdit($session);

        $enrollments = $this->getEnrollmentsForSession($session);
        foreach ($enrollments as $enrollment) {
            $existing = $session->studentAttendances()
                ->where('student_enrollment_id', $enrollment->id)
                ->first();

            $payload = [
                'status' => StudentAttendance::STATUS_PRESENT,
                'check_in' => null,
                'check_out' => null,
                'remarks' => null,
            ];

            if ($existing) {
                $old = $existing->only(['status', 'check_in', 'check_out', 'remarks']);
                $existing->update($payload);
                $this->auditService->log($existing, 'updated', $old, $payload, $user);
            } else {
                $new = StudentAttendance::create([
                    'attendance_session_id' => $session->id,
                    'student_enrollment_id' => $enrollment->id,
                    ...$payload,
                ]);
                $this->auditService->log($new, 'created', null, $new->toArray(), $user);
            }
        }
    }

    public function saveAttendances(
        AttendanceSession $session,
        array $attendances,
        Authenticatable $user
    ): void {
        $this->guardCanEdit($session);

        foreach ($attendances as $key => $row) {
            $enrollmentId = (int) str_replace('enrollment_', '', $key);
            if ($enrollmentId <= 0) {
                continue;
            }

            $status = $row['status'] ?? 'present';
            $checkIn = isset($row['check_in']) && $row['check_in'] !== '' ? $row['check_in'] : null;
            $checkOut = isset($row['check_out']) && $row['check_out'] !== '' ? $row['check_out'] : null;
            $remarks = $row['remarks'] ?? null;

            $status = $this->resolveStatusFromSettings($session, $checkIn, $status);

            $existing = StudentAttendance::where('attendance_session_id', $session->id)
                ->where('student_enrollment_id', $enrollmentId)
                ->first();

            $payload = [
                'status' => $status,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'remarks' => $remarks,
            ];

            if ($existing) {
                $old = $existing->only(['status', 'check_in', 'check_out', 'remarks']);
                $existing->update($payload);
                $this->auditService->log($existing, 'updated', $old, $payload, $user);
            } else {
                $new = StudentAttendance::create([
                    'attendance_session_id' => $session->id,
                    'student_enrollment_id' => $enrollmentId,
                    ...$payload,
                ]);
                $this->auditService->log($new, 'created', null, $new->toArray(), $user);
            }
        }
    }

    protected function guardCanEdit(AttendanceSession $session): void
    {
        if ($session->is_locked) {
            throw new \RuntimeException('Cannot modify attendance: session is locked.');
        }

        $date = $session->attendance_date;
        if (AttendanceMonthlyFreeze::isFrozen(
            $session->academic_session_id,
            (int) $date->format('Y'),
            (int) $date->format('n'),
            'student'
        )) {
            throw new \RuntimeException('Cannot modify attendance: month is frozen.');
        }
    }
}
