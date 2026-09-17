<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Promotion extends Model
{
    protected $fillable = [
        'student_id',
        'from_enrollment_id',
        'to_class_section_group_id',
        'promoted_by',
        'promotion_date',
        'remarks',
    ];

    protected $casts = [
        'promotion_date' => 'date',
    ];

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function fromEnrollment(): BelongsTo
    {
        return $this->belongsTo(StudentEnrollment::class, 'from_enrollment_id');
    }

    public function toClassSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class, 'to_class_section_group_id');
    }

    public function promotedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'promoted_by');
    }
}
