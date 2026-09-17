<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SubjectGroup extends Model
{
    use HasFactory;

    protected $table = 'subject_groups';

    protected $fillable = [
        'name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Class-section groups that use this subject group (e.g. Science, Arts, Commerce).
     */
    public function classSectionGroups(): HasMany
    {
        return $this->hasMany(ClassSectionGroup::class, 'subject_group_id');
    }
}
