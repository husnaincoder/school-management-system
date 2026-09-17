<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExpenseBudget extends Model
{
    use HasFactory;

    protected $table = 'expense_budgets';

    protected $fillable = [
        'category_id',
        'budget_amount',
        'spent_amount',
        'year',
        'month',
    ];

    protected $casts = [
        'budget_amount' => 'decimal:2',
        'spent_amount' => 'decimal:2',
        'year' => 'integer',
        'month' => 'integer',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id');
    }
}
