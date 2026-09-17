<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Material extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'title',
        'description',
        'file_path',
        'type',
        'class_section_group_subject_id',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    protected $appends = ['teacher_name'];

    public const TYPES = ['syllabus', 'assignment', 'study_material', 'exam_paper', 'other'];

    /** Teacher name via class_section_group_subject_id → class_section_group_subjects.teacher_id → users.name */
    public function getTeacherNameAttribute(): ?string
    {
        return $this->classSectionGroupSubject?->teacher?->name;
    }

    public function classSectionGroupSubject(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroupSubject::class, 'class_section_group_subject_id');
    }
}
