<?php

namespace App\Http\Requests\Attendance;

use Illuminate\Foundation\Http\FormRequest;

class StoreAttendanceSettingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && ($this->user()->hasRole('admin') || $this->user()->hasRole('super_admin'));
    }

    public function rules(): array
    {
        return [
            'academic_session_id' => 'nullable|exists:academic_sessions,id',
            'user_type' => 'required|in:student,teacher,employee',
            'late_after' => 'nullable|date_format:H:i',
            'half_day_after' => 'nullable|date_format:H:i',
            'weekend_off' => 'boolean',
        ];
    }
}
