<?php

namespace App\Services\Attendance;

use App\Models\AttendanceAuditLog;
use Illuminate\Contracts\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Request;

class AttendanceAuditService
{
    public function log(
        Model $model,
        string $action,
        ?array $oldValues,
        ?array $newValues,
        ?Authenticatable $user = null
    ): AttendanceAuditLog {
        $user = $user ?? auth()->user();

        return AttendanceAuditLog::create([
            'auditable_type' => $model->getTable(),
            'auditable_id' => $model->getKey(),
            'user_id' => $user?->getAuthIdentifier(),
            'action' => $action,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
        ]);
    }
}
