<?php

namespace App\Http\Controllers\Dashboard\Setting;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\Setting\EnvMailWriter;
use App\Services\Setting\SystemSettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

class EmailSettingController extends Controller
{
    public function __construct(
        protected SystemSettingService $settings
    ) {}

    public function index()
    {
        return inertia('dashboard/setting/EmailSettings', [
            'emailSetting' => $this->settings->getEmailSettings(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'mailer' => 'nullable|string|in:smtp,ses,mailgun,postmark,sendmail,log|max:50',
            'scheme' => 'nullable|string|max:20',
            'host' => 'nullable|string|max:255',
            'port' => 'nullable',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'from_address' => 'nullable|email|max:255',
            'from_name' => 'nullable|string|max:255',
            'reply_to' => 'nullable|email|max:255',
            'email_enabled' => 'boolean',
        ]);

        $port = $validated['port'] ?? null;
        if ($port === '' || $port === null) {
            $port = null;
        } else {
            $port = (int) $port;
            if ($port < 1 || $port > 65535) {
                return back()->withErrors(['port' => 'Port must be between 1 and 65535.'])->withInput();
            }
        }

        $current = $this->settings->getEmailSettings();

        // Never persist password in system_settings — only non-secret fields.
        $updates = [
            'mailer' => $validated['mailer'] ?? $current['mailer'],
            'scheme' => array_key_exists('scheme', $validated) ? ($validated['scheme'] ?: null) : $current['scheme'],
            'host' => array_key_exists('host', $validated) ? ($validated['host'] ?: null) : $current['host'],
            'port' => $port,
            'username' => array_key_exists('username', $validated) ? ($validated['username'] ?: null) : $current['username'],
            'from_address' => array_key_exists('from_address', $validated) ? ($validated['from_address'] ?: null) : $current['from_address'],
            'from_name' => array_key_exists('from_name', $validated) ? ($validated['from_name'] ?: null) : $current['from_name'],
            'reply_to' => array_key_exists('reply_to', $validated) ? ($validated['reply_to'] ?: null) : $current['reply_to'],
            'email_enabled' => $request->boolean('email_enabled', (bool) $current['email_enabled']),
        ];

        $this->settings->setMany(SystemSettingService::GROUP_EMAIL, $updates);

        // Remove any leftover plaintext password row from older installs.
        SystemSetting::query()->where('key', 'email.password')->delete();

        $envConfig = [
            'mailer' => $updates['mailer'] ?? 'log',
            'scheme' => $updates['scheme'],
            'host' => $updates['host'],
            'port' => $updates['port'],
            'username' => $updates['username'],
            'from_address' => $updates['from_address'],
            'from_name' => $updates['from_name'],
            'reply_to' => $updates['reply_to'],
        ];

        if (! empty($validated['password'] ?? '')) {
            $envConfig['password'] = $validated['password'];
        }

        try {
            (new EnvMailWriter())->updateMailConfig($envConfig);
            Artisan::call('config:clear');
        } catch (\Throwable $e) {
            return back()->with('success', 'Email settings saved to database. .env could not be updated: '.$e->getMessage());
        }

        return back()->with('success', 'Email settings updated successfully. .env has been updated.');
    }
}
