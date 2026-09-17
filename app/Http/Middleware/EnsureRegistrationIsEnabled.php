<?php

namespace App\Http\Middleware;

use App\Services\Setting\SystemSettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureRegistrationIsEnabled
{
    public function __construct(
        private SystemSettingService $settings
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->settings->getAuthSettings()['registration_enabled']) {
            if ($request->expectsJson()) {
                abort(403, 'Registration is currently disabled.');
            }

            return redirect()
                ->route('login')
                ->with('error', 'Registration is currently disabled. Please contact the administrator.');
        }

        return $next($request);
    }
}
