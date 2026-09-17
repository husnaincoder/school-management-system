<?php

namespace App\Http\Middleware;

use App\Services\Setting\SystemSettingService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Apply Auth Settings that must be available before the session starts
 * (e.g. session lifetime) and register global password defaults.
 */
class ApplyAuthRuntimeSettings
{
    public function __construct(
        private SystemSettingService $settings
    ) {}

    /**
     * @param  Closure(Request): Response  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        try {
            $auth = $this->settings->getAuthSettings();
            config(['session.lifetime' => $auth['session_timeout']]);
        } catch (\Throwable) {
            // DB may be unavailable during install / migrate.
        }

        return $next($request);
    }
}
