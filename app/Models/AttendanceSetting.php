<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceSetting extends Model
{
    protected $table = 'attendance_settings';

    public const USER_TYPE_STUDENT = 'student';
    public const USER_TYPE_TEACHER = 'teacher';
    public const USER_TYPE_EMPLOYEE = 'employee';

    protected $fillable = [
        'academic_session_id',
        'user_type',
        'late_after',
        'half_day_after',
        'weekend_off',
    ];

    protected $casts = [
        'weekend_off' => 'boolean',
    ];

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public static function forSessionAndType(?int $academicSessionId, string $userType): ?self
    {
        $query = static::where('user_type', $userType);
        if ($academicSessionId) {
            $query->where(function ($q) use ($academicSessionId) {
                $q->where('academic_session_id', $academicSessionId)
                    ->orWhereNull('academic_session_id');
            });
        } else {
            $query->whereNull('academic_session_id');
        }
        return $query->orderByRaw('academic_session_id IS NOT NULL DESC')->first();
    }
}
