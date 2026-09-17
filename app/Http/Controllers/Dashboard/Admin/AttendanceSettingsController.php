<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Attendance\StoreAttendanceSettingRequest;
use App\Services\Attendance\AttendanceSettingsService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceSettingsController extends Controller
{
    public function __construct(
        protected AttendanceSettingsService $settingsService
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $academicSessionId = $request->get('academic_session_id');
        $settings = $this->settingsService->list($academicSessionId);
        $academicSessions = $this->settingsService->getAcademicSessionsForSelect();

        return Inertia::render('dashboard/attendance/SettingsIndex', [
            'settings' => $settings,
            'academicSessions' => $academicSessions,
            'filterAcademicSessionId' => $academicSessionId,
        ]);
    }

    public function store(StoreAttendanceSettingRequest $request)
    {
        $this->settingsService->createOrUpdate($request->validated());
        return back()->with('success', 'Settings saved.');
    }
}
