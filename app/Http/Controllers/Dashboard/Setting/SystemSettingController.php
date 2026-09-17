<?php

namespace App\Http\Controllers\Dashboard\Setting;

use App\Http\Controllers\Controller;
use App\Models\SystemSetting;
use App\Services\Setting\SystemSettingService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

class SystemSettingController extends Controller
{
    public function index(Request $request)
    {
        $query = SystemSetting::orderBy('group')->orderBy('key');
        if ($request->filled('group')) {
            $query->where('group', $request->group);
        }

        $settings = $query->get()->map(function (SystemSetting $setting) {
            $sensitive = SystemSettingService::isSensitiveKey($setting->key);
            $hasValue = filled($setting->value);

            return [
                'id' => $setting->id,
                'key' => $setting->key,
                'group' => $setting->group,
                'value' => $sensitive ? ($hasValue ? '••••••••' : null) : $setting->value,
                'is_sensitive' => $sensitive,
                'has_value' => $hasValue,
                'updated_at' => $setting->updated_at,
            ];
        });

        $groups = SystemSetting::whereNotNull('group')->distinct()->pluck('group')->sort()->values()->toArray();

        return inertia('dashboard/setting/SystemSettings', [
            'settings' => $settings,
            'groups' => $groups,
            'filterGroup' => $request->group,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255|unique:system_settings,key',
            'value' => 'nullable|string',
            'group' => 'nullable|string|max:255',
        ]);

        if (SystemSettingService::isSensitiveKey($validated['key'])) {
            throw ValidationException::withMessages([
                'key' => 'Sensitive keys (password, secret, token, api key) cannot be stored in System Settings. Use Email Settings / .env for mail passwords.',
            ]);
        }

        SystemSetting::create($validated);

        return back()->with('success', 'Setting created successfully.');
    }

    public function update(Request $request, SystemSetting $systemSetting)
    {
        $validated = $request->validate([
            'key' => 'required|string|max:255|unique:system_settings,key,'.$systemSetting->id,
            'value' => 'nullable|string',
            'group' => 'nullable|string|max:255',
        ]);

        if (
            SystemSettingService::isSensitiveKey($systemSetting->key)
            || SystemSettingService::isSensitiveKey($validated['key'])
        ) {
            throw ValidationException::withMessages([
                'key' => 'Sensitive settings cannot be edited here. Delete this row if it is leftover, and manage mail passwords via Email Settings.',
            ]);
        }

        // Keep key immutable on update.
        $systemSetting->update([
            'value' => $validated['value'],
            'group' => $validated['group'],
        ]);

        return back()->with('success', 'Setting updated successfully.');
    }

    public function destroy(SystemSetting $systemSetting)
    {
        $systemSetting->delete();

        return back()->with('success', 'Setting deleted.');
    }
}
