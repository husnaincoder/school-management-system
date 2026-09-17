<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\Book;
use App\Models\BookIssue;
use App\Models\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class LibraryController extends Controller
{
    // public function __construct()
    // {
    //     $this->middleware(['auth', 'role:admin|super_admin']);
    // }

    public function books(Request $request)
    {
        $query = Book::query();

        if ($request->category) {
            $query->where('category', $request->category);
        }

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('title', 'like', '%' . $request->search . '%')
                  ->orWhere('author', 'like', '%' . $request->search . '%')
                  ->orWhere('isbn', 'like', '%' . $request->search . '%');
            });
        }

        $books = $query->orderBy('title')->paginate(20);

        return inertia('dashboard/library/Books', [
            'books' => $books,
            'categories' => Book::distinct()->pluck('category'),
        ]);
    }

    public function bookStore(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'author' => 'required|string',
            'isbn' => 'required|string|unique:books',
            'category' => 'required|string',
            'publisher' => 'nullable|string',
            'edition' => 'nullable|string',
            'quantity' => 'required|integer|min:0',
            'price' => 'nullable|numeric|min:0',
            'rack_number' => 'nullable|string',
        ]);

        $validated['available_quantity'] = $validated['quantity'];
        Book::create($validated);

        return back()->with('success', 'Book added.');
    }

    public function issues(Request $request)
    {
        $query = BookIssue::with('book', 'student.user');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $issues = $query->orderBy('issue_date', 'desc')->paginate(20);

        return inertia('dashboard/library/Issues', [
            'issues' => $issues,
        ]);
    }

    public function issueBook(Request $request)
    {
        $validated = $request->validate([
            'book_id' => 'required|exists:books,id',
            'student_id' => 'required|exists:students,id',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after:issue_date',
            'fine_per_day' => 'nullable|numeric|min:0',
        ]);

        $book = Book::findOrFail($validated['book_id']);

        if ($book->available_quantity <= 0) {
            return back()->with('error', 'Book not available.');
        }

        $validated['fine_per_day'] = $validated['fine_per_day'] ?? 0;
        $validated['status'] = 'issued';
        $validated['issued_by'] = Auth::id();

        BookIssue::create($validated);

        // Decrease available quantity
        $book->decrement('available_quantity');

        return back()->with('success', 'Book issued.');
    }

    public function returnBook(Request $request, BookIssue $issue)
    {
        $validated = $request->validate([
            'return_date' => 'required|date',
            'remarks' => 'nullable|string',
        ]);

        $totalFine = 0;
        if ($validated['return_date'] > $issue->due_date) {
            $daysOverdue = \Carbon\Carbon::parse($issue->due_date)->diffInDays($validated['return_date']);
            $totalFine = $daysOverdue * $issue->fine_per_day;
        }

        $issue->update([
            'return_date' => $validated['return_date'],
            'total_fine' => $totalFine,
            'status' => 'returned',
            'received_by' => Auth::id(),
            'remarks' => $validated['remarks'],
        ]);

        // Increase available quantity
        $issue->book->increment('available_quantity');

        return back()->with('success', 'Book returned. Fine: ' . $totalFine);
    }
}
