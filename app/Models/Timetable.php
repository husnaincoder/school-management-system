<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Timetable extends Model
{
    public const STATUS_DRAFT = 'draft';

    public const STATUS_PUBLISHED = 'published';

    public const STATUS_ARCHIVED = 'archived';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_PUBLISHED,
        self::STATUS_ARCHIVED,
    ];

    protected $fillable = [
        'class_section_group_id',
        'academic_session_id',
        'name',
        'is_active',
        'status',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class);
    }

    public function academicSession(): BelongsTo
    {
        return $this->belongsTo(AcademicSession::class);
    }

    public function timetableEnters(): HasMany
    {
        return $this->hasMany(TimetableEnter::class, 'timetable_id');
    }

    public function isPublished(): bool
    {
        return ($this->status ?? self::STATUS_DRAFT) === self::STATUS_PUBLISHED;
    }
}
