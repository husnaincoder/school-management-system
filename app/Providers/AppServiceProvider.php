<?php

namespace App\Providers;

use App\Services\Setting\SystemSettingService;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        Password::defaults(function () {
            try {
                return app(SystemSettingService::class)->passwordRule();
            } catch (\Throwable) {
                return Password::min(8);
            }
        });

        $this->app->booted(function () {
            Schedule::command('fee:generate-monthly-invoices')->monthlyOn(1, '00:30')->timezone(config('app.timezone'));
            Schedule::command('fee:apply-late-fines')->dailyAt('01:00')->timezone(config('app.timezone'));
        });
    }
}