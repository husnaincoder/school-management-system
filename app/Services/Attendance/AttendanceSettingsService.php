<?php

namespace App\Services\Attendance;

use App\Models\AttendanceSetting;
use App\Models\AcademicSession;

class AttendanceSettingsService
{
    public function list(?int $academicSessionId = null): \Illuminate\Database\Eloquent\Collection
    {
        $query = AttendanceSetting::with('academicSession')->orderBy('user_type');

        if ($academicSessionId !== null) {
            $query->where(function ($q) use ($academicSessionId) {
                $q->where('academic_session_id', $academicSessionId)
                    ->orWhereNull('academic_session_id');
            });
        }

        return $query->get();
    }

    public function getForSessionAndType(?int $academicSessionId, string $userType): ?AttendanceSetting
    {
        return AttendanceSetting::forSessionAndType($academicSessionId, $userType);
    }

    public function createOrUpdate(array $validated): AttendanceSetting
    {
        $sessionId = $validated['academic_session_id'] ?? null;
        $userType = $validated['user_type'];

        $setting = AttendanceSetting::firstOrNew([
            'academic_session_id' => $sessionId,
            'user_type' => $userType,
        ]);

        $setting->fill([
            'late_after' => $validated['late_after'] ?? null,
            'half_day_after' => $validated['half_day_after'] ?? null,
            'weekend_off' => (bool) ($validated['weekend_off'] ?? false),
        ])->save();

        return $setting;
    }

    public function getAcademicSessionsForSelect(): \Illuminate\Support\Collection
    {
        return AcademicSession::where('is_active', true)
            ->orderBy('is_current', 'desc')
            ->get(['id', 'name', 'is_current']);
    }
}
