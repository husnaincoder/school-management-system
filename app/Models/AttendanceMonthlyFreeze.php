<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceMonthlyFreeze extends Model
{
    protected $table = 'attendance_monthly_freezes';

    protected $fillable = [
        'academic_session_id',
        'month',
        'year',
        'type',
        'is_frozen',
        'frozen_by',
        'frozen_at',
    ];

    protected $casts = [
        'is_frozen' => 'boolean',
        'frozen_at' => 'datetime',
    ];

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function frozenByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'frozen_by');
    }

    public static function isFrozen(int $academicSessionId, int $year, int $month, string $type = 'student'): bool
    {
        return static::where('academic_session_id', $academicSessionId)
            ->where('year', $year)
            ->where('month', $month)
            ->where('type', $type)
            ->where('is_frozen', true)
            ->exists();
    }
}
