<?php

namespace App\Http\Middleware;

use App\Services\Setting\SystemSettingService;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnforceAuthMaintenanceMode
{
    public function __construct(
        private SystemSettingService $settings
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if (! $this->settings->getAuthSettings()['maintenance_mode']) {
            return $next($request);
        }

        $user = $request->user();

        if ($user && ($user->hasRole('super_admin') || $user->hasRole('admin'))) {
            return $next($request);
        }

        // Admins must still be able to sign in / reset password / log out.
        if ($request->routeIs('login', 'logout', 'password.request', 'password.email', 'password.reset', 'password.store')) {
            return $next($request);
        }

        if ($user) {
            Auth::guard('web')->logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();
        }

        if ($request->expectsJson()) {
            abort(503, 'The system is under maintenance.');
        }

        return redirect()
            ->route('login')
            ->with('error', 'The system is under maintenance. Please try again later.');
    }
}
