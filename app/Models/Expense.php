<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Expense extends Model
{
    use HasFactory;

    protected $table = 'expenses';

    protected $fillable = [
        'expense_number',
        'category_id',
        'vendor_id',
        'expense_date',
        'total_amount',
        'paid_amount',
        'due_amount',
        'notes',
        'status',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'total_amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_amount' => 'decimal:2',
    ];

    public const STATUS_PENDING = 'pending';
    public const STATUS_PARTIAL = 'partial';
    public const STATUS_PAID = 'paid';

    public function category(): BelongsTo
    {
        return $this->belongsTo(ExpenseCategory::class, 'category_id');
    }

    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(ExpenceItem::class, 'expense_id');
    }

    public function payments(): HasMany
    {
        return $this->hasMany(ExpensePayment::class);
    }

    public function attachments(): HasMany
    {
        return $this->hasMany(ExpenseAttachment::class);
    }

    public static function generateExpenseNumber(): string
    {
        $prefix = 'EXP';
        $year = date('Y');
        $last = static::where('expense_number', 'like', "{$prefix}-{$year}-%")
            ->orderByDesc('id')
            ->value('expense_number');
        $seq = $last ? (int) substr($last, -5) + 1 : 1;
        return $prefix . '-' . $year . '-' . str_pad((string) $seq, 5, '0', STR_PAD_LEFT);
    }
}
