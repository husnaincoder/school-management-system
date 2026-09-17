<?php

namespace App\Services\Attendance;

use App\Models\AttendanceMonthlyFreeze;
use App\Models\AcademicSession;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Support\Collection;

class AttendanceFreezeService
{
    public function list(?int $academicSessionId = null): Collection
    {
        $query = AttendanceMonthlyFreeze::with('academicSession', 'frozenByUser')
            ->orderByDesc('year')
            ->orderByDesc('month');

        if ($academicSessionId !== null) {
            $query->where('academic_session_id', $academicSessionId);
        }

        return $query->get();
    }

    public function freeze(
        int $academicSessionId,
        int $year,
        int $month,
        string $type = 'student',
        ?Authenticatable $user = null
    ): AttendanceMonthlyFreeze {
        $record = AttendanceMonthlyFreeze::firstOrNew([
            'academic_session_id' => $academicSessionId,
            'year' => $year,
            'month' => $month,
            'type' => $type,
        ]);

        $record->fill([
            'is_frozen' => true,
            'frozen_by' => $user?->getAuthIdentifier(),
            'frozen_at' => now(),
        ])->save();

        return $record;
    }

    public function unfreeze(AttendanceMonthlyFreeze $freeze): AttendanceMonthlyFreeze
    {
        $freeze->update([
            'is_frozen' => false,
            'frozen_by' => null,
            'frozen_at' => null,
        ]);
        return $freeze->fresh();
    }

    public function getAcademicSessionsForSelect(): Collection
    {
        return AcademicSession::where('is_active', true)
            ->orderBy('is_current', 'desc')
            ->get(['id', 'name', 'is_current']);
    }
}
