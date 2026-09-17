<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\Setting\SystemSettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmailVerificationPromptController extends Controller
{
    /**
     * Display the email verification prompt.
     */
    public function __invoke(Request $request, SystemSettingService $settings): RedirectResponse|Response
    {
        $user = $request->user();

        if (! $settings->getAuthSettings()['email_verification_required'] || ! filled($user->email)) {
            return redirect()->intended(route('dashboard', absolute: false));
        }

        return $user->hasVerifiedEmail()
            ? redirect()->intended(route('dashboard', absolute: false))
            : Inertia::render('Auth/VerifyEmail', ['status' => session('status')]);
    }
}
