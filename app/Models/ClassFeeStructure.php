<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\ClassSectionGroup;
use App\Models\FeeType;

class ClassFeeStructure extends Model
{
    use HasFactory, SoftDeletes;

    protected $table = 'class_fee_structures';
    protected $fillable = [
        'class_section_group_id',
        'fee_type_id',
        'amount',
    ];
    protected $casts = [
        'amount' => 'decimal:2',
    ];
    public function classSectionGroup(): BelongsTo
    {
        return $this->belongsTo(ClassSectionGroup::class, 'class_section_group_id');
    }
    public function feeType(): BelongsTo
    {
        return $this->belongsTo(FeeType::class, 'fee_type_id');
    }
}
