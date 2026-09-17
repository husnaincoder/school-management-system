<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasFactory, Notifiable, HasRoles, MustVerifyEmailTrait;

    protected $fillable = [
        'name',
        'id_card_number',
        'email',
        'phone',
        'password',
        'is_active',
        'email_verified_at',
        'profile_photo',
        'last_login_at',
    ];

    public static function findByLogin(string $login): ?self
    {
        $login = trim($login);

        return static::query()
            ->where('id_card_number', $login)
            ->orWhere('email', $login)
            ->first();
    }

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
            'last_login_at' => 'datetime',
        ];
    }

    // Helper methods for role checking
    public function isSuperAdmin(): bool
    {
        return $this->hasRole('super_admin');
    }

    public function isAdmin(): bool
    {
        return $this->hasRole('admin');
    }

    public function isAccountant(): bool
    {
        return $this->hasRole('accountant');
    }

    public function isTeacher(): bool
    {
        return $this->hasRole('teacher');
    }

    public function isEmployee(): bool
    {
        return $this->hasRole('employee');
    }

    public function isStudent(): bool
    {
        return $this->hasRole('student');
    }

    public function isParent(): bool
    {
        return $this->hasRole('parent');
    }

    // Relationships
    public function employee(): HasOne
    {
        return $this->hasOne(Employee::class);
    }

    public function student(): HasOne
    {
        return $this->hasOne(Student::class);
    }

    public function parent(): HasOne
    {
        return $this->hasOne(ParentModel::class, 'user_id');
    }

    public function teacher(): HasOne
    {
        return $this->hasOne(Teacher::class);
    }

    public function marks(): HasMany
    {
        return $this->hasMany(Mark::class, 'recorded_by');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }

    // Scope for active users
    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    // Get dashboard URL based on role
    public function getDashboardUrl(): string
    {
        if ($this->isSuperAdmin() || $this->isAdmin()) {
            return route('dashboard.superadmin');
        }
        if ($this->isAccountant()) {
            return route('dashboard.accountant');
        }
        if ($this->hasRole('class_incharge')) {
            return route('class-incharge.dashboard');
        }
        if ($this->isTeacher()) {
            return route('dashboard.teacher');
        }
        if ($this->isEmployee()) {
            return route('dashboard.employee');
        }
        if ($this->isStudent()) {
            return route('dashboard.student');
        }
        if ($this->isParent()) {
            return route('dashboard.parent');
        }

        return route('dashboard');
    }
}
