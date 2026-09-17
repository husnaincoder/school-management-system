<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Carbon\Carbon;

class BookIssue extends Model
{
    use HasFactory;

    protected $fillable = [
        'book_id',
        'student_id',
        'issue_date',
        'due_date',
        'return_date',
        'fine_per_day',
        'total_fine',
        'status',
        'issued_by',
        'received_by',
        'remarks',
    ];

    protected $casts = [
        'issue_date' => 'date',
        'due_date' => 'date',
        'return_date' => 'date',
        'fine_per_day' => 'decimal:2',
        'total_fine' => 'decimal:2',
    ];

    public function book(): BelongsTo
    {
        return $this->belongsTo(Book::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function issuedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by');
    }

    public function receivedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by');
    }

    // Calculate fine for overdue books
    public function calculateFine(): float
    {
        if ($this->return_date && $this->return_date > $this->due_date) {
            $daysOverdue = Carbon::parse($this->due_date)->diffInDays(Carbon::parse($this->return_date));
            return $daysOverdue * $this->fine_per_day;
        }
        return 0;
    }

    // Check if book is overdue
    public function isOverdue(): bool
    {
        return Carbon::now()->gt($this->due_date) && $this->status === 'issued';
    }
}
