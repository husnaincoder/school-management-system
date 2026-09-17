<?php

namespace App\Services\Attendance;

use App\Models\AttendanceSession;
use App\Models\AttendanceSetting;
use App\Models\AttendanceMonthlyFreeze;
use App\Models\EmployeeAttendance;
use Illuminate\Contracts\Auth\Authenticatable;

class EmployeeAttendanceService
{
    public function __construct(
        protected AttendanceAuditService $auditService
    ) {}

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
            AttendanceSetting::USER_TYPE_EMPLOYEE
        );

        if (! $setting) {
            return $status;
        }

        $dayOfWeek = $session->attendance_date->dayOfWeek;
        if ($setting->weekend_off && in_array($dayOfWeek, [0, 6], true)) {
            return 'leave';
        }

        $lateAfter = $setting->late_after ? $setting->late_after->format('H:i') : null;
        $halfDayAfter = $setting->half_day_after ? $setting->half_day_after->format('H:i') : null;

        $checkInTime = preg_replace('/^(\d{1,2}:\d{2})(?::\d{2})?$/', '$1', $checkIn);
        if (strlen($checkInTime) === 5) {
            $checkInTime .= ':00';
        }

        if ($halfDayAfter && $checkInTime > $halfDayAfter) {
            return 'absent';
        }
        if ($lateAfter && $checkInTime > $lateAfter) {
            return 'late';
        }

        return $status;
    }

    public function saveAttendances(
        AttendanceSession $session,
        array $attendances,
        Authenticatable $user
    ): void {
        $this->guardCanEdit($session);

        foreach ($attendances as $key => $row) {
            $employeeId = (int) str_replace('employee_', '', $key);
            if ($employeeId <= 0) {
                continue;
            }

            $status = $row['status'] ?? 'present';
            $checkIn = isset($row['check_in']) && $row['check_in'] !== '' ? $row['check_in'] : null;
            $checkOut = isset($row['check_out']) && $row['check_out'] !== '' ? $row['check_out'] : null;
            $remarks = $row['remarks'] ?? null;

            $status = $this->resolveStatusFromSettings($session, $checkIn, $status);

            $payload = [
                'status' => $status,
                'check_in' => $checkIn,
                'check_out' => $checkOut,
                'remarks' => $remarks,
            ];

            $existing = EmployeeAttendance::where('attendance_session_id', $session->id)
                ->where('employee_id', $employeeId)
                ->first();

            if ($existing) {
                $old = $existing->only(['status', 'check_in', 'check_out', 'remarks']);
                $existing->update($payload);
                $this->auditService->log($existing, 'updated', $old, $payload, $user);
            } else {
                $new = EmployeeAttendance::create([
                    'attendance_session_id' => $session->id,
                    'employee_id' => $employeeId,
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
            'employee'
        )) {
            throw new \RuntimeException('Cannot modify attendance: month is frozen.');
        }
    }
}
