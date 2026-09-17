<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalaryStructure extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'employee_id',
        'teacher_id',
        'basic_salary',
        'is_active',
    ];

    protected $casts = [
        'basic_salary' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class);
    }

    public function allowances(): HasMany
    {
        return $this->hasMany(SalaryStructureAllowance::class);
    }

    public function deductions(): HasMany
    {
        return $this->hasMany(SalarySturctureDeduction::class, 'salary_structure_id');
    }
}
