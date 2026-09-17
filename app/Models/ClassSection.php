<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ClassSection extends Model
{
    use HasFactory;

    protected $fillable = [
        'academic_session_id',
        'class_id',
        'section_id',
        'capacity',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function class(): BelongsTo
    {
        return $this->belongsTo(SchoolClass::class, 'class_id');
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function teacherClassSubjects(): HasMany
    {
        return $this->hasMany(TeacherClassSubject::class, 'class_section_id');
    }

    public function classSectionGroups(): HasMany
    {
        return $this->hasMany(ClassSectionGroup::class, 'class_section_id');
    }

    public function classIncharges(): HasMany
    {
        return $this->hasMany(ClassIncharge::class, 'class_section_id');
    }

    public function activeClassIncharges(): HasMany
    {
        return $this->hasMany(ClassIncharge::class, 'class_section_id')->where('is_active', true);
    }
}
