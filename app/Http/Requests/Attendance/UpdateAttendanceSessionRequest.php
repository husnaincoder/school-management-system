<?php

namespace App\Http\Requests\Attendance;

use App\Models\AttendanceSession;
use App\Services\Attendance\AttendanceSessionService;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendanceSessionRequest extends FormRequest
{
    public function authorize(): bool
    {
        $session = $this->route('attendance_session') ?? $this->route('attendanceSession');
        return $this->user() && $session && $this->user()->can('update', $session);
    }

    public function rules(): array
    {
        return [
            'attendance_date' => 'required|date',
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'type' => 'required|in:student,teacher,employee',
            'class_section_group_id' => 'nullable|exists:class_section_groups,id',
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($validator) {
            $session = $this->route('attendance_session') ?? $this->route('attendanceSession');
            if ($session->is_locked) {
                $validator->errors()->add('attendance_date', 'Cannot edit a locked attendance session.');
                return;
            }

            if ($this->type === 'student' && empty($this->class_section_group_id)) {
                $validator->errors()->add('class_section_group_id', 'Class section group is required for student attendance.');
                return;
            }

            $service = app(AttendanceSessionService::class);
            if ($service->duplicateExists(
                $this->attendance_date,
                (int) $this->academic_session_id,
                $this->type,
                $this->type === 'student' ? (int) $this->class_section_group_id : null,
                $session->id
            )) {
                $validator->errors()->add('attendance_date', 'An attendance session already exists for this date, type and group.');
            }
        });
    }
}
