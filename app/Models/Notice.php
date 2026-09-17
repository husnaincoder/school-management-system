<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Notice extends Model
{
    public const PRIORITY_LOW = 'low';
    public const PRIORITY_MEDIUM = 'medium';
    public const PRIORITY_HIGH = 'high';
    public const PRIORITY_URGENT = 'urgent';

    protected $fillable = [
        'title',
        'description',
        'category_id',
        'created_by_employee_id',
        'created_by_teacher_id',
        'is_pinned',
        'priority',
        'allow_comments',
        'allow_likes',
        'is_published',
        'publish_at',
        'expire_at',
    ];

    protected $casts = [
        'is_pinned' => 'boolean',
        'allow_comments' => 'boolean',
        'allow_likes' => 'boolean',
        'is_published' => 'boolean',
        'publish_at' => 'datetime',
        'expire_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(NoticeCategory::class, 'category_id');
    }

    public function createdByEmployee(): BelongsTo
    {
        return $this->belongsTo(Employee::class, 'created_by_employee_id');
    }

    public function createdByTeacher(): BelongsTo
    {
        return $this->belongsTo(Teacher::class, 'created_by_teacher_id');
    }

    public function targets(): HasMany
    {
        return $this->hasMany(NoticeTarget::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(NoticeAttachment::class);
    }

    public function reads(): HasMany
    {
        return $this->hasMany(NoticeRead::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(NoticeLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(NoticeComment::class);
    }

    public function noticeNotifications(): HasMany
    {
        return $this->hasMany(NoticeNotification::class, 'notice_id');
    }

    public function scopePublished($query)
    {
        return $query->where('is_published', true)
            ->where(function ($q) {
                $q->whereNull('publish_at')->orWhere('publish_at', '<=', now());
            })
            ->where(function ($q) {
                $q->whereNull('expire_at')->orWhere('expire_at', '>=', now()->startOfDay());
            });
    }

    public function scopePinned($query)
    {
        return $query->where('is_pinned', true);
    }

    public function scopeUrgent($query)
    {
        return $query->where('priority', self::PRIORITY_URGENT);
    }

    public function isExpired(): bool
    {
        return $this->expire_at && $this->expire_at->isPast();
    }

    public function isScheduled(): bool
    {
        return $this->publish_at && $this->publish_at->isFuture();
    }
}
