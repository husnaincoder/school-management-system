<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\OvertimePayment;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OvertimePaymentController extends Controller
{
    public function index(Request $request)
    {
        $month = $request->get('month', '');
        $year = $request->get('year', (string) now()->year);

        $query = OvertimePayment::with('employee.user', 'teacher.user')->orderByDesc('year')->orderByDesc('month');
        if ($month) $query->where('month', $month);
        if ($year) $query->where('year', (int) $year);
        $overtimes = $query->get()->map(fn (OvertimePayment $o) => [
            'id' => $o->id,
            'employee_id' => $o->employee_id,
            'teacher_id' => $o->teacher_id,
            'employee_name' => $o->employee_id ? ($o->employee?->user?->name ?? '—') : ($o->teacher?->user?->name ?? '—'),
            'month' => $o->month,
            'year' => $o->year,
            'hours' => $o->hours,
            'rate_per_hour' => $o->rate_per_hour,
            'amount' => $o->amount,
            'status' => $o->status,
            'remarks' => $o->remarks,
        ]);

        return Inertia::render('dashboard/payroll/OvertimePayments', [
            'overtimes' => $overtimes,
            'filterMonth' => $month,
            'filterYear' => $year,
            'employees' => Employee::with('user')->get()->map(fn ($e) => ['id' => $e->id, 'name' => $e->user?->name ?? '—', 'employee_id' => $e->employee_id]),
            'teachers' => Teacher::with('user')->get()->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name ?? '—', 'staff_id' => $t->staff_id]),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|required_without:teacher_id|exists:employees,id',
            'teacher_id' => 'nullable|required_without:employee_id|exists:teachers,id',
            'month' => 'required|string|size:2',
            'year' => 'required|integer|min:2000|max:2100',
            'hours' => 'required|numeric|min:0.01',
            'rate_per_hour' => 'required|numeric|min:0',
            'remarks' => 'nullable|string|max:500',
        ]);
        $validated['amount'] = round((float) $validated['hours'] * (float) $validated['rate_per_hour'], 2);
        $validated['status'] = 'pending';
        OvertimePayment::create($validated);
        return back()->with('success', 'Overtime payment added.');
    }

    public function update(Request $request, OvertimePayment $overtimePayment)
    {
        $validated = $request->validate([
            'hours' => 'required|numeric|min:0.01',
            'rate_per_hour' => 'required|numeric|min:0',
            'remarks' => 'nullable|string|max:500',
        ]);
        $validated['amount'] = round((float) $validated['hours'] * (float) $validated['rate_per_hour'], 2);
        $overtimePayment->update($validated);
        return back()->with('success', 'Overtime payment updated.');
    }

    public function destroy(OvertimePayment $overtimePayment)
    {
        if ($overtimePayment->status === 'paid') {
            return back()->with('error', 'Cannot delete paid overtime.');
        }
        $overtimePayment->delete();
        return back()->with('success', 'Overtime payment deleted.');
    }
}
