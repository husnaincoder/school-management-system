<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceCorrectionRequest;
use App\Models\EmployeeAttendance;
use App\Models\StudentAttendance;
use App\Models\TeacherAttendance;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceCorrectionRequestController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $status = $request->get('status', 'pending');
        $requests = AttendanceCorrectionRequest::with(['attendanceSession', 'requestedByUser', 'reviewedByUser'])
            ->when($status !== '', fn ($q) => $q->where('status', $status))
            ->orderByDesc('created_at')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('dashboard/attendance/CorrectionRequestsIndex', [
            'requests' => $requests,
            'filterStatus' => $status,
        ]);
    }

    public function update(Request $request, AttendanceCorrectionRequest $correctionRequest)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $validated = $request->validate([
            'status' => 'required|in:approved,rejected',
            'review_remarks' => 'nullable|string|max:1000',
        ]);

        $correctionRequest->update([
            'status' => $validated['status'],
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_remarks' => $validated['review_remarks'] ?? null,
        ]);

        if ($validated['status'] === 'approved' && $correctionRequest->requested_changes) {
            $this->applyCorrection($correctionRequest);
        }

        return back()->with('success', 'Request ' . $validated['status'] . '.');
    }

    protected function applyCorrection(AttendanceCorrectionRequest $correctionRequest): void
    {
        $type = $correctionRequest->attendance_type;
        $recordId = $correctionRequest->attendance_record_id;
        $changes = $correctionRequest->requested_changes;

        if ($type === 'student' && isset($changes['status'])) {
            StudentAttendance::where('id', $recordId)->update(['status' => $changes['status']]);
        } elseif ($type === 'teacher' && isset($changes['status'])) {
            TeacherAttendance::where('id', $recordId)->update(['status' => $changes['status']]);
        } elseif ($type === 'employee' && isset($changes['status'])) {
            EmployeeAttendance::where('id', $recordId)->update(['status' => $changes['status']]);
        }
    }
}
