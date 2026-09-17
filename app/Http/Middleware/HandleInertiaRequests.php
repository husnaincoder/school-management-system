<?php

namespace App\Http\Middleware;

use App\Services\Setting\SystemSettingService;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $settingService = app(SystemSettingService::class);
        $branding = $settingService->getBranding();
        $authSettings = $settingService->getAuthSettings();

        $brandingData = [
            'company_name' => $branding['company_name'],
            'logo_light_url' => $branding['logo_light_url'],
            'logo_dark_url' => $branding['logo_dark_url'],
            'logo_small_url' => $branding['logo_small_url'],
            'favicon_url' => $branding['favicon_url'],
        ];

        $hasAny = collect($brandingData)->filter(fn ($v) => filled($v))->isNotEmpty();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $request->user() ? [
                    ...$request->user()->toArray(),
                    'roles' => $request->user()->getRoleNames()->values()->all(),
                ] : null,
            ],
            'dashboardUrl' => $request->user()
                ? $request->user()->getDashboardUrl()
                : url('/'),
            'canRegister' => $authSettings['registration_enabled'],
            'authSettings' => [
                'registration_enabled' => $authSettings['registration_enabled'],
                'email_verification_required' => $authSettings['email_verification_required'],
                'password_min_length' => $authSettings['password_min_length'],
                'session_timeout' => $authSettings['session_timeout'],
                'maintenance_mode' => $authSettings['maintenance_mode'],
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'download_invoice_ids' => fn () => $request->session()->get('download_invoice_ids'),
                'credentials' => fn () => $request->session()->get('credentials'),
            ],
            'branding' => $hasAny ? $brandingData : null,
        ];
    }
}
