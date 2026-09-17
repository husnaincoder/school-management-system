<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TimetableEnter extends Model
{
    protected $table = 'timetable_enters';

    public const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    protected $fillable = [
        'timetable_id',
        'day',
        'time_slot_id',
        'class_section_group_subject_id',
        'teacher_id',
        'class_room_id',
    ];

    public function timetable(): BelongsTo
    {
        return $this->belongsTo(Timetable::class);
    }

    public function timeSlot(): BelongsTo
    {
        return $this->belongsTo(TimeSlot::class);
    }

    public function classSectionGroupSubject(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroupSubject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function classRoom(): BelongsTo
    {
        return $this->belongsTo(ClassRoom::class);
    }

    public function timetableAdjustments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(TimetableAdjustment::class, 'timetable_entry_id');
    }
}
