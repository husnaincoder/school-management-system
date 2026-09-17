<?php

use App\Http\Controllers\ProfileController;
use App\Models\User;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    if (Auth::check()) {
        return redirect()->route('dashboard');
    }
    return redirect()->route('login');
});

// Role-based dashboard redirect
Route::get('/dashboard', function () {
    /** @var User|null $user */
    $user = Auth::user();

    if (!$user) {
        return redirect('/login');
    }

    if ($user->hasRole('super_admin') || $user->hasRole('admin')) {
        return redirect()->route('dashboard.superadmin');
    } elseif ($user->hasRole('accountant')) {
        return redirect()->route('dashboard.accountant');
    } elseif ($user->hasRole('teacher')) {
        return redirect()->route('dashboard.teacher');
    } elseif ($user->hasRole('student')) {
        return redirect()->route('dashboard.student');
    } elseif ($user->hasRole('parent')) {
        return redirect()->route('dashboard.parent');
    } elseif ($user->hasRole('employee')) {
        return redirect()->route('dashboard.employee');
    }

    Auth::guard('web')->logout();

    return redirect()
        ->route('login')
        ->with('error', 'Your account has no role assigned. Please contact the administrator.');
})->middleware(['auth', 'verified'])->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
require __DIR__.'/school.php';
