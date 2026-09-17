<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class LeaveType extends Model
{
    protected $fillable = [
        'name',
        'is_paid',
        'max_days',
        'for_students',
        'for_teachers',
        'for_employees',
    ];

    protected $casts = [
        'is_paid' => 'boolean',
        'max_days' => 'integer',
        'for_students' => 'boolean',
        'for_teachers' => 'boolean',
        'for_employees' => 'boolean',
    ];

    public function leaves(): HasMany
    {
        return $this->hasMany(Leave::class);
    }

    public function leaveBalances(): HasMany
    {
        return $this->hasMany(LeaveBalance::class);
    }
}
