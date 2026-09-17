<?php

namespace App\Http\Middleware;

use App\Services\Setting\SystemSettingService;
use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enforce Auth Settings → email_verification_required for users who have an email.
 * Users without email (id-card-only accounts) are not blocked.
 */
class EnsureEmailIsVerifiedWhenRequired
{
    public function __construct(
        private SystemSettingService $settings
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user) {
            return $next($request);
        }

        if ($request->routeIs(
            'verification.notice',
            'verification.verify',
            'verification.send',
            'logout',
            'password.confirm',
            'password.update',
            'profile.edit',
            'profile.update',
            'profile.destroy',
        )) {
            return $next($request);
        }

        try {
            $required = $this->settings->getAuthSettings()['email_verification_required'];
        } catch (\Throwable) {
            return $next($request);
        }

        if (! $required) {
            return $next($request);
        }

        if (! filled($user->email)) {
            return $next($request);
        }

        if ($user instanceof MustVerifyEmail && ! $user->hasVerifiedEmail()) {
            return $request->expectsJson()
                ? abort(409, 'Your email address is not verified.')
                : Redirect::route('verification.notice');
        }

        return $next($request);
    }
}
