<?php

namespace App\Http\Controllers\Dashboard\Setting;

use App\Http\Controllers\Controller;
use App\Services\Setting\SystemSettingService;
use Illuminate\Http\Request;

class AuthSettingController extends Controller
{
    public function __construct(
        protected SystemSettingService $settings
    ) {}

    public function index()
    {
        return inertia('dashboard/setting/AuthSettings', [
            'authSetting' => $this->settings->getAuthSettings(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'registration_enabled' => 'boolean',
            'email_verification_required' => 'boolean',
            'password_min_length' => 'required|integer|min:6|max:32',
            'session_timeout' => 'required|integer|min:5|max:1440',
            'maintenance_mode' => 'boolean',
        ]);

        $this->settings->setMany(SystemSettingService::GROUP_AUTH, [
            'registration_enabled' => $request->boolean('registration_enabled'),
            'email_verification_required' => $request->boolean('email_verification_required'),
            'password_min_length' => (int) $validated['password_min_length'],
            'session_timeout' => (int) $validated['session_timeout'],
            'maintenance_mode' => $request->boolean('maintenance_mode'),
        ]);

        return back()->with('success', 'Auth settings updated successfully.');
    }
}
