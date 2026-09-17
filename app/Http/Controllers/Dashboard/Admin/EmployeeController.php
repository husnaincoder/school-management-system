<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Concerns\NormalizesOptionalEmail;
use App\Http\Concerns\UpdatesOptionalPassword;
use App\Models\Employee;
use App\Models\User;
use App\Models\Salary;
use App\Models\LeaveRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class EmployeeController extends Controller
{
    use NormalizesOptionalEmail, UpdatesOptionalPassword;

    public function index(Request $request)
    {
        $query = Employee::with('user');

        if ($request->filled('department')) {
            $query->where('department', $request->department);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $employees = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate(15);

        $departments = Employee::whereNotNull('department')->distinct()->pluck('department')->sort()->values()->all();
        $designations = Employee::whereNotNull('designation')->distinct()->pluck('designation')->sort()->values()->all();

        return inertia('dashboard/hr/Employees', [
            'employees' => $employees,
            'departments' => $departments,
            'designations' => $designations,
            'filters' => $request->only(['department', 'status']),
        ]);
    }

    public function create()
    {
        $departments = Employee::whereNotNull('department')->distinct()->pluck('department')->sort()->values()->all();
        $designations = Employee::whereNotNull('designation')->distinct()->pluck('designation')->sort()->values()->all();

        return inertia('dashboard/hr/EmployeeCreate', [
            'departments' => $departments,
            'designations' => $designations,
        ]);
    }

    public function store(Request $request)
    {
        $this->normalizeOptionalEmail($request);

        if (blank($request->input('id_card_number'))) {
            $nextNumber = (User::max('id') ?? 0) + 1;
            do {
                $candidate = 'EMP' . str_pad((string) $nextNumber, 5, '0', STR_PAD_LEFT);
                $nextNumber++;
            } while (User::where('id_card_number', $candidate)->exists());

            $request->merge(['id_card_number' => $candidate]);
        }

        $wasAutoPassword = false;
        $plainPassword = $request->input('password');
        if (blank($plainPassword)) {
            $wasAutoPassword = true;
            $plainPassword = 'emp_' . Str::lower(Str::random(8));
            $request->merge([
                'password' => $plainPassword,
                'password_confirmation' => $plainPassword,
            ]);
        } elseif (blank($request->input('password_confirmation'))) {
            $request->merge(['password_confirmation' => $plainPassword]);
        }

        $request->merge([
            'phone' => filled($request->input('phone')) ? $request->input('phone') : null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'id_card_number' => ['required', 'string', 'max:50', 'unique:users,id_card_number'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone' => 'nullable|string|max:20',
            'password' => ['required', 'string', 'min:8', 'confirmed'],

            'employee_id' => 'nullable|string|max:50|unique:employees,employee_id',
            'department' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'joining_date' => 'nullable|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:active,inactive,on_leave,terminated',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:50',
            'qualification' => 'nullable|string',
            'experience' => 'nullable|string',
        ]);

        $newUser = DB::transaction(function () use ($validated, $plainPassword) {
            $user = User::create([
                'name' => $validated['name'],
                'id_card_number' => $validated['id_card_number'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($plainPassword),
                'is_active' => true,
                'email_verified_at' => filled($validated['email'] ?? null) ? now() : null,
            ]);
            $user->assignRole('employee');
            return $user;
        });

        $employeeId = $validated['employee_id'] ?? ('EMP' . str_pad((string) (Employee::max('id') + 1), 5, '0', STR_PAD_LEFT));
        $status = $validated['status'] ?? 'active';

        Employee::create([
            'user_id' => $newUser->id,
            'employee_id' => $employeeId,
            'department' => $validated['department'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'joining_date' => $validated['joining_date'] ?? null,
            'basic_salary' => $validated['basic_salary'] ?? 0.00,
            'status' => $status,
            'address' => $validated['address'] ?? null,
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'emergency_phone' => $validated['emergency_phone'] ?? null,
            'qualification' => $validated['qualification'] ?? null,
            'experience' => $validated['experience'] ?? null,
        ]);

        $successMessage = "Employee {$newUser->name} created successfully!";
        if ($wasAutoPassword) {
            $successMessage .= " Login ID: {$newUser->id_card_number} | Password: {$plainPassword}";
        }

        return redirect()->route('hr.employees')
            ->with('success', $successMessage)
            ->with('credentials', [
                'user' => [
                    'name' => $newUser->name,
                    'login' => $newUser->id_card_number,
                    'email' => $newUser->email,
                    'password' => $plainPassword,
                    'role' => 'employee',
                ],
            ]);
    }

    public function edit(Employee $employee)
    {
        $departments = Employee::whereNotNull('department')->distinct()->pluck('department')->sort()->values()->all();
        $designations = Employee::whereNotNull('designation')->distinct()->pluck('designation')->sort()->values()->all();

        return inertia('dashboard/hr/EmployeeEdit', [
            'employee' => $employee->load('user'),
            'departments' => $departments,
            'designations' => $designations,
        ]);
    }

    public function update(Request $request, Employee $employee)
    {
        $this->normalizeOptionalEmail($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'id_card_number' => ['required', 'string', 'max:50', Rule::unique('users', 'id_card_number')->ignore($employee->user_id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($employee->user_id)],
            'phone' => 'nullable|string|max:20',
            ...$this->optionalPasswordRules(),
            'employee_id' => ['nullable', 'string', 'max:50', Rule::unique('employees', 'employee_id')->ignore($employee->id)],
            'department' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'joining_date' => 'nullable|date',
            'basic_salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:active,inactive,on_leave,terminated',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:50',
            'qualification' => 'nullable|string',
            'experience' => 'nullable|string',
        ]);

        DB::transaction(function () use ($employee, $validated) {
            $employee->user->update($this->userDataWithOptionalPassword([
                'name' => $validated['name'],
                'id_card_number' => $validated['id_card_number'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
            ], $validated));

            $employee->update([
                'employee_id' => $validated['employee_id'] ?? $employee->employee_id,
                'department' => $validated['department'] ?? null,
                'designation' => $validated['designation'] ?? null,
                'joining_date' => $validated['joining_date'] ?? null,
                'basic_salary' => $validated['basic_salary'] ?? null,
                'status' => $validated['status'] ?? $employee->status,
                'address' => $validated['address'] ?? null,
                'emergency_contact' => $validated['emergency_contact'] ?? null,
                'emergency_phone' => $validated['emergency_phone'] ?? null,
                'qualification' => $validated['qualification'] ?? null,
                'experience' => $validated['experience'] ?? null,
            ]);
        });
        return back()->with('success', 'Employee updated successfully.');
    }

    public function salary(Employee $employee)
    {
        $salaries = Salary::where('employee_id', $employee->id)
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->paginate(12);

        return inertia('dashboard/hr/Salary', [
            'employee' => $employee->load('user'),
            'salaries' => $salaries,
        ]);
    }

    public function paySalary(Request $request, Employee $employee)
    {
        $validated = $request->validate([
            'month' => 'required|integer|min:1|max:12',
            'year' => 'required|integer|min:2020',
            'basic_salary' => 'required|numeric|min:0',
            'allowances' => 'nullable|numeric|min:0',
            'deductions' => 'nullable|numeric|min:0',
            'payment_method' => 'required|string',
            'transaction_id' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        $netSalary = $validated['basic_salary'] + ($validated['allowances'] ?? 0) - ($validated['deductions'] ?? 0);

        Salary::create([
            'employee_id' => $employee->id,
            'basic_salary' => $validated['basic_salary'],
            'allowances' => $validated['allowances'] ?? 0,
            'deductions' => $validated['deductions'] ?? 0,
            'net_salary' => $netSalary,
            'month' => $validated['month'],
            'year' => $validated['year'],
            'paid_status' => 'paid',
            'paid_date' => now(),
            'payment_method' => $validated['payment_method'],
            'transaction_id' => $validated['transaction_id'] ?? null,
            'remarks' => $validated['remarks'] ?? null,
        ]);

        return back()->with('success', 'Salary paid successfully.');
    }

    public function leaveRequests(Request $request)
    {
        $query = LeaveRequest::with('employee.user');

        if ($request->status) {
            $query->where('status', $request->status);
        }

        $leaveRequests = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate(15);

        return inertia('dashboard/hr/LeaveRequests', [
            'leaveRequests' => $leaveRequests,
            'filters' => $request->only(['status']),
        ]);
    }

    public function approveLeave(LeaveRequest $leaveRequest)
    {
        $leaveRequest->update([
            'status' => 'approved',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
        ]);

        return back()->with('success', 'Leave approved successfully.');
    }

    public function rejectLeave(Request $request, LeaveRequest $leaveRequest)
    {
        $validated = $request->validate([
            'remarks' => 'required|string',
        ]);

        $leaveRequest->update([
            'status' => 'rejected',
            'approved_by' => Auth::id(),
            'approved_at' => now(),
            'remarks' => $validated['remarks'],
        ]);

        return back()->with('success', 'Leave rejected.');
    }
}
