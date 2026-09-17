<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Allowance;
use App\Models\Deduction;
use App\Models\Employee;
use App\Models\SalaryStructure;
use App\Models\SalaryStructureAllowance;
use App\Models\SalarySturctureDeduction;
use App\Models\Teacher;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SalaryStructureController extends Controller
{
    public function index(Request $request)
    {
        $structures = SalaryStructure::with(['employee.user', 'teacher.user', 'allowances.allowance', 'deductions.deduction'])
            ->orderBy('id')
            ->get()
            ->map(function (SalaryStructure $s) {
                $staffName = $s->employee_id
                    ? ($s->employee?->user?->name ?? '—')
                    : ($s->teacher?->user?->name ?? '—');
                $staffIdentifier = $s->employee_id
                    ? ($s->employee?->employee_id ?? '—')
                    : ($s->teacher?->staff_id ?? '—');
                $staffType = $s->employee_id ? 'employee' : 'teacher';
                return [
                    'id' => $s->id,
                    'employee_id' => $s->employee_id,
                    'teacher_id' => $s->teacher_id,
                    'staff_type' => $staffType,
                    'employee_name' => $staffName,
                    'employee_identifier' => $staffIdentifier,
                    'basic_salary' => $s->basic_salary,
                    'is_active' => $s->is_active,
                    'allowances' => $s->allowances->map(fn ($a) => [
                        'id' => $a->id,
                        'allowance_id' => $a->allowance_id,
                        'allowance_name' => $a->allowance?->name,
                        'value' => $a->value,
                        'type' => $a->type,
                    ])->values()->all(),
                    'deductions' => $s->deductions->map(fn ($d) => [
                        'id' => $d->id,
                        'deduction_id' => $d->deduction_id,
                        'deduction_name' => $d->deduction?->name,
                        'value' => $d->value,
                        'type' => $d->type,
                    ])->values()->all(),
                ];
            });

        return Inertia::render('dashboard/payroll/SalaryStructures', [
            'salaryStructures' => $structures,
            'employees' => Employee::with('user')->get()->map(fn ($e) => ['id' => $e->id, 'name' => $e->user?->name ?? '—', 'employee_id' => $e->employee_id]),
            'teachers' => Teacher::with('user')->get()->map(fn ($t) => ['id' => $t->id, 'name' => $t->user?->name ?? '—', 'staff_id' => $t->staff_id]),
            'allowances' => Allowance::where('is_active', true)->orderBy('name')->get(['id', 'name', 'type', 'value']),
            'deductions' => Deduction::where('is_active', true)->orderBy('name')->get(['id', 'name', 'type', 'value']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|required_without:teacher_id|exists:employees,id',
            'teacher_id' => 'nullable|required_without:employee_id|exists:teachers,id',
            'basic_salary' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'allowances' => 'array',
            'allowances.*.allowance_id' => 'required_with:allowances|exists:allowances,id',
            'allowances.*.value' => 'required_with:allowances|numeric|min:0',
            'allowances.*.type' => 'required_with:allowances|in:fixed,percentage',
            'deductions' => 'array',
            'deductions.*.deduction_id' => 'required_with:deductions|exists:deductions,id',
            'deductions.*.value' => 'required_with:deductions|numeric|min:0',
            'deductions.*.type' => 'required_with:deductions|in:fixed,percentage',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);

        $structure = SalaryStructure::create([
            'employee_id' => $validated['employee_id'] ?? null,
            'teacher_id' => $validated['teacher_id'] ?? null,
            'basic_salary' => $validated['basic_salary'],
            'is_active' => $validated['is_active'],
        ]);

        foreach ($validated['allowances'] ?? [] as $a) {
            SalaryStructureAllowance::create([
                'salary_structure_id' => $structure->id,
                'allowance_id' => $a['allowance_id'],
                'value' => $a['value'],
                'type' => $a['type'],
                'is_active' => true,
            ]);
        }
        foreach ($validated['deductions'] ?? [] as $d) {
            SalarySturctureDeduction::create([
                'salary_structure_id' => $structure->id,
                'deduction_id' => $d['deduction_id'],
                'value' => $d['value'],
                'type' => $d['type'],
                'is_active' => true,
            ]);
        }

        return back()->with('success', 'Salary structure created successfully.');
    }

    public function update(Request $request, SalaryStructure $salaryStructure)
    {
        $validated = $request->validate([
            'employee_id' => 'nullable|required_without:teacher_id|exists:employees,id',
            'teacher_id' => 'nullable|required_without:employee_id|exists:teachers,id',
            'basic_salary' => 'required|numeric|min:0',
            'is_active' => 'boolean',
            'allowances' => 'array',
            'allowances.*.allowance_id' => 'required_with:allowances|exists:allowances,id',
            'allowances.*.value' => 'required_with:allowances|numeric|min:0',
            'allowances.*.type' => 'required_with:allowances|in:fixed,percentage',
            'deductions' => 'array',
            'deductions.*.deduction_id' => 'required_with:deductions|exists:deductions,id',
            'deductions.*.value' => 'required_with:deductions|numeric|min:0',
            'deductions.*.type' => 'required_with:deductions|in:fixed,percentage',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);

        $salaryStructure->update([
            'employee_id' => $validated['employee_id'] ?? null,
            'teacher_id' => $validated['teacher_id'] ?? null,
            'basic_salary' => $validated['basic_salary'],
            'is_active' => $validated['is_active'],
        ]);

        $salaryStructure->allowances()->delete();
        $salaryStructure->deductions()->delete();
        foreach ($validated['allowances'] ?? [] as $a) {
            SalaryStructureAllowance::create([
                'salary_structure_id' => $salaryStructure->id,
                'allowance_id' => $a['allowance_id'],
                'value' => $a['value'],
                'type' => $a['type'],
                'is_active' => true,
            ]);
        }
        foreach ($validated['deductions'] ?? [] as $d) {
            SalarySturctureDeduction::create([
                'salary_structure_id' => $salaryStructure->id,
                'deduction_id' => $d['deduction_id'],
                'value' => $d['value'],
                'type' => $d['type'],
                'is_active' => true,
            ]);
        }

        return back()->with('success', 'Salary structure updated successfully.');
    }

    public function destroy(SalaryStructure $salaryStructure)
    {
        $salaryStructure->allowances()->delete();
        $salaryStructure->deductions()->delete();
        $salaryStructure->delete();
        return back()->with('success', 'Salary structure deleted successfully.');
    }
}
