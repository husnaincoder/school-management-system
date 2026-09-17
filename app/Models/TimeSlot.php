<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TimeSlot extends Model
{
    public const TYPES = ['period', 'break', 'assembly', 'lunch'];

    protected $fillable = [
        'name',
        'start_time',
        'end_time',
        'slot_order',
        'is_break',
        'slot_type',
        'is_active',
    ];

    protected $casts = [
        'slot_order' => 'integer',
        'is_break' => 'boolean',
        'is_active' => 'boolean',
    ];

    protected $appends = ['duration_minutes', 'time_range_label'];

    public function getDurationMinutesAttribute(): int
    {
        if (! $this->start_time || ! $this->end_time) {
            return 0;
        }
        try {
            $start = \Carbon\Carbon::parse($this->start_time);
            $end = \Carbon\Carbon::parse($this->end_time);

            return max(0, (int) $start->diffInMinutes($end));
        } catch (\Throwable) {
            return 0;
        }
    }

    public function getTimeRangeLabelAttribute(): string
    {
        try {
            $start = \Carbon\Carbon::parse($this->start_time)->format('h:i A');
            $end = \Carbon\Carbon::parse($this->end_time)->format('h:i A');

            return "{$start} - {$end}";
        } catch (\Throwable) {
            return trim(($this->start_time ?? '').' - '.($this->end_time ?? ''));
        }
    }

    public function isNonTeaching(): bool
    {
        return $this->is_break
            || in_array($this->slot_type ?? '', ['break', 'lunch'], true);
    }
}
