<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ClassNotice extends Model
{
    protected $fillable = [
        'class_section_group_id',
        'title',
        'body',
        'created_by',
        'notify_parents',
        'notified_at',
    ];

    protected $casts = [
        'notify_parents' => 'boolean',
        'notified_at' => 'datetime',
    ];

    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class);
    }

    public function createdByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}
