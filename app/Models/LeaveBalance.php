<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class LeaveBalance extends Model
{
    protected $fillable = [
        'leave_type_id',
        'teacher_id',
        'employee_id',
        'total_days',
        'used_days',
        'remaining_days',
        'year',
    ];

    protected $casts = [
        'total_days' => 'integer',
        'used_days' => 'integer',
        'remaining_days' => 'integer',
        'year' => 'integer',
    ];

    public function leaveType(): BelongsTo
    {
        return $this->belongsTo(LeaveType::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }
}
