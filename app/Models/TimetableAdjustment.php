<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableAdjustment extends Model
{
    public const ACTION_SUBSTITUTE = 'substitute';
    public const ACTION_CANCEL = 'cancel';
    public const ACTION_MERGE = 'merge';

    protected $fillable = [
        'timetable_entry_id',
        'adjustment_date',
        'original_teacher_id',
        'substitute_teacher_id',
        'merged_into_timetable_entry_id',
        'action',
        'note',
    ];

    protected $casts = [
        'adjustment_date' => 'date',
    ];

    public function timetableEnter(): BelongsTo
    {
        return $this->belongsTo(TimetableEnter::class, 'timetable_entry_id');
    }

    public function originalTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'original_teacher_id');
    }

    public function substituteTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'substitute_teacher_id');
    }

    public function mergedIntoTimetableEnter(): BelongsTo
    {
        return $this->belongsTo(TimetableEnter::class, 'merged_into_timetable_entry_id');
    }
}
