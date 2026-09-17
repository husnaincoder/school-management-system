<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveDay extends Model
{
    protected $fillable = [
        'leave_id',
        'leave_date',
        'is_half_day',
    ];

    protected $casts = [
        'leave_date' => 'date',
        'is_half_day' => 'boolean',
    ];

    public function leave(): BelongsTo
    {
        return $this->belongsTo(Leave::class);
    }
}
