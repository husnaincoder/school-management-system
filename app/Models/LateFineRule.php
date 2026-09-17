<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class LateFineRule extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'late_fine_rules';

    protected $fillable = [
        'academic_session_id',
        'class_section_group_id',
        'days_from',
        'days_to',
        'fine_type',
        'amount',
        'max_cap',
        'is_active',
    ];

    protected $casts = [
        'days_from' => 'integer',
        'days_to' => 'integer',
        'amount' => 'decimal:2',
        'max_cap' => 'decimal:2',
        'is_active' => 'boolean',
    ];

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class, 'academic_session_id');
    }

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class, 'class_section_group_id');
    }
}
