<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeScale extends Model
{
    protected $fillable = [
        'grade',
        'min_percentage',
        'max_percentage',
        'grade_point',
        'is_fail_grade',
        'sort_order',
    ];

    protected $casts = [
        'min_percentage' => 'decimal:2',
        'max_percentage' => 'decimal:2',
        'grade_point' => 'decimal:2',
        'is_fail_grade' => 'boolean',
        'sort_order' => 'integer',
    ];
}
