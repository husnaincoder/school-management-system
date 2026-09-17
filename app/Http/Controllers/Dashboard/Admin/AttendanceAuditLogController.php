<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Models\AttendanceAuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AttendanceAuditLogController extends Controller
{
    public function index(Request $request)
    {
        $this->authorize('viewAny', \App\Models\AttendanceSession::class);

        $query = AttendanceAuditLog::with('user:id,name')
            ->orderByDesc('created_at');

        if ($request->filled('action')) {
            $query->where('action', $request->action);
        }
        if ($request->filled('auditable_type')) {
            $query->where('auditable_type', $request->auditable_type);
        }
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        $logs = $query->paginate(20)->withQueryString();

        $logs->getCollection()->transform(function (AttendanceAuditLog $log) {
            $old = $log->old_values ?? [];
            $new = $log->new_values ?? [];

            return [
                'id' => $log->id,
                'action' => $log->action,
                'auditable_type' => $log->auditable_type,
                'auditable_type_label' => $this->typeLabel($log->auditable_type),
                'auditable_id' => $log->auditable_id,
                'user_name' => $log->user?->name ?? '—',
                'old_status' => $old['status'] ?? null,
                'new_status' => $new['status'] ?? null,
                'old_check_in' => $this->formatTime($old['check_in'] ?? null),
                'new_check_in' => $this->formatTime($new['check_in'] ?? null),
                'old_check_out' => $this->formatTime($old['check_out'] ?? null),
                'new_check_out' => $this->formatTime($new['check_out'] ?? null),
                'ip_address' => $log->ip_address,
                'created_at' => $log->created_at?->toIso8601String(),
            ];
        });

        return Inertia::render('dashboard/attendance/AuditLogsIndex', [
            'logs' => $logs,
            'filters' => [
                'action' => $request->action,
                'auditable_type' => $request->auditable_type,
            ],
            'actionOptions' => ['created', 'updated', 'bulk_updated'],
            'typeOptions' => [
                ['value' => 'student_attendances', 'label' => 'Student'],
                ['value' => 'teacher_attendances', 'label' => 'Teacher'],
                ['value' => 'employee_attendances', 'label' => 'Employee'],
            ],
        ]);
    }

    protected function typeLabel(?string $type): string
    {
        return match ($type) {
            'student_attendances' => 'Student',
            'teacher_attendances' => 'Teacher',
            'employee_attendances' => 'Employee',
            default => $type ?: '—',
        };
    }

    protected function formatTime(mixed $value): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }
        $s = (string) $value;

        return strlen($s) >= 5 ? substr($s, 0, 5) : $s;
    }
}
