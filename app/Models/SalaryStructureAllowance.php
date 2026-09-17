<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class SalaryStructureAllowance extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'salary_structure_allowances';

    protected $fillable = [
        'salary_structure_id',
        'allowance_id',
        'value',
        'type',
        'is_active',
    ];

    protected $casts = [
        'value' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function salaryStructure(): BelongsTo
    {
        return $this->belongsTo(SalaryStructure::class);
    }

    public function allowance(): BelongsTo
    {
        return $this->belongsTo(Allowance::class);
    }
}
