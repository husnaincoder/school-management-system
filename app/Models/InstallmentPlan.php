<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstallmentPlan extends Model
{
    use HasFactory;

    protected $table = 'installment_plans';

    protected $fillable = [
        'name',
        'number_of_installments',
    ];

    protected $casts = [
        'number_of_installments' => 'integer',
    ];

    public function studentInstallments(): HasMany
    {
        return $this->hasMany(StudentInstallment::class, 'installment_plan_id');
    }
}
