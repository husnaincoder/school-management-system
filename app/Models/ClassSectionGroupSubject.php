<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassSectionGroupSubject extends Model
{
    use HasFactory;

    protected $table = 'class_section_group_subjects';

    protected $fillable = [
        'class_section_group_id',
        'subject_id',
        'teacher_id',
        'weekly_classes',
    ];

    protected $casts = [
        'weekly_classes' => 'integer',
    ];

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class);
    }

    public function subject(): BelongsTo
    {
        return $this->belongsTo(Subject::class);
    }

    public function teacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'teacher_id');
    }

    public function materials(): HasMany
    {
        return $this->hasMany(Material::class, 'class_section_group_subject_id');
    }
}
