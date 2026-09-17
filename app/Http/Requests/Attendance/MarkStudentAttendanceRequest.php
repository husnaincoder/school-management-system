<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class MarkStudentAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('attendanceSession');
        return $this->user() && $this->user()->can('markAttendance', $session);
    }

    public function rules(): array
    {
        return [
            'attendances' => 'required|array',
            'attendances.*.status' => 'required|in:present,absent,late,leave',
            'attendances.*.check_in' => 'nullable|string|max:10',
            'attendances.*.check_out' => 'nullable|string|max:10',
            'attendances.*.remarks' => 'nullable|string|max:500',
        ];
    }
}
