<?php

namespace App\Http\Controllers\Dashboard\Setting;

use App\Http\Controllers\Controller;
use App\Services\Setting\SystemSettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SchoolBrandingController extends Controller
{
    public function __construct(
        protected SystemSettingService $settings
    ) {}

    public function index()
    {
        return inertia('dashboard/setting/SchoolBranding', [
            'branding' => $this->settings->getBranding(),
        ]);
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'company_name' => 'nullable|string|max:255',
            'logo_light' => 'nullable|image|mimes:jpeg,jpg,png,gif,svg,webp|max:2048',
            'logo_dark' => 'nullable|image|mimes:jpeg,jpg,png,gif,svg,webp|max:2048',
            'logo_small' => 'nullable|image|mimes:jpeg,jpg,png,gif,svg,webp|max:2048',
            'favicon' => 'nullable|image|mimes:ico,png,gif,svg|max:512',
        ]);

        $current = $this->settings->getBranding();
        $updates = [
            'company_name' => $validated['company_name'] ?? $current['company_name'],
        ];

        foreach (['logo_light', 'logo_dark', 'logo_small', 'favicon'] as $field) {
            if ($request->hasFile($field)) {
                if (! empty($current[$field])) {
                    Storage::disk('public')->delete($current[$field]);
                }
                $updates[$field] = $request->file($field)->store('branding', 'public');
            }
        }

        $this->settings->setMany(SystemSettingService::GROUP_BRANDING, $updates);

        return back()->with('success', 'Branding updated successfully.');
    }
}
