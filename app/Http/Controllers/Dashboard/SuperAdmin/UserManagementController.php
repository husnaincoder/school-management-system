<?php

namespace App\Http\Controllers\Dashboard\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Http\Concerns\NormalizesOptionalEmail;
use App\Models\User;
use App\Models\Teacher;
use App\Models\Employee;
use App\Models\ParentModel;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\ClassSectionGroup;
use App\Services\Setting\SystemSettingService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class UserManagementController extends Controller
{
    use NormalizesOptionalEmail;

    /**
     * Display a listing of the users.
     */
    public function index(Request $request)
    {
        $query = User::with('roles');

        if ($request->has('search') && $request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('id_card_number', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->has('role') && $request->role) {
            $query->role($request->role);
        }

        if ($request->filled('status')) {
            $query->where('is_active', (bool) $request->status);
        }

        $users = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate(15);
        $roles = Role::all();

        return inertia('dashboard/superadmin/users/Index', [
            'users' => $users,
            'roles' => $roles,
            'filters' => $request->only(['search', 'role', 'status']),
        ]);
    }

    /**
     * Show the form for creating a new user.
     */
    public function create()
    {
        $roles = Role::all();
        return inertia('dashboard/superadmin/users/Create', [
            'roles' => $roles,
        ]);
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request)
    {
        $this->normalizeOptionalEmail($request);

        $settings = app(SystemSettingService::class);

        // 1. Auto-generate ID Card Number if left blank by Super Admin / Admin
        if (blank($request->input('id_card_number'))) {
            $prefix = match ($request->input('role')) {
                'super_admin' => 'SA',
                'admin' => 'ADM',
                'accountant' => 'ACC',
                'teacher' => 'TCH',
                'employee' => 'EMP',
                'student' => 'STD',
                'parent' => 'PRN',
                default => 'USR',
            };
            $nextNumber = (User::max('id') ?? 0) + 1;
            do {
                $candidate = $prefix . str_pad((string) $nextNumber, 5, '0', STR_PAD_LEFT);
                $nextNumber++;
            } while (User::where('id_card_number', $candidate)->exists());

            $request->merge(['id_card_number' => $candidate]);
        }

        // 2. Auto-generate secure password if left blank, or mirror confirmation if confirmation is blank
        $wasAutoPassword = false;
        if (blank($request->input('password'))) {
            $wasAutoPassword = true;
            $generatedPassword = 'Usr@' . Str::random(10) . '1';
            $request->merge([
                'password' => $generatedPassword,
                'password_confirmation' => $generatedPassword,
            ]);
        } elseif (blank($request->input('password_confirmation'))) {
            $request->merge([
                'password_confirmation' => $request->input('password'),
            ]);
        }

        // 3. Normalize phone to null if empty
        $request->merge([
            'phone' => filled($request->input('phone')) ? $request->input('phone') : null,
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'id_card_number' => 'required|string|max:50|unique:users,id_card_number',
            'email' => 'nullable|string|email|max:255|unique:users,email',
            'phone' => 'nullable|string|max:20',
            'password' => ['required', 'confirmed', $settings->passwordRule()],
            'role' => 'required|exists:roles,name',
            'is_active' => 'boolean',
        ]);

        $plainPassword = $request->input('password');

        $user = User::create([
            'name' => $validated['name'],
            'id_card_number' => $validated['id_card_number'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'password' => Hash::make($plainPassword),
            'is_active' => $validated['is_active'] ?? true,
            'email_verified_at' => filled($validated['email'] ?? null) ? now() : null,
        ]);

        $user->assignRole($validated['role']);

        // 4. Synchronize corresponding profile so the user immediately shows up in their dashboard
        match ($validated['role']) {
            'teacher' => Teacher::firstOrCreate(
                ['user_id' => $user->id],
                ['staff_id' => 'TCH' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT), 'status' => 'active']
            ),
            'employee' => Employee::firstOrCreate(
                ['user_id' => $user->id],
                ['employee_id' => 'EMP' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT), 'status' => 'active']
            ),
            'parent' => ParentModel::firstOrCreate(
                ['user_id' => $user->id],
                ['relation_with_student' => 'Father', 'is_active' => true]
            ),
            'student' => tap(Student::firstOrCreate(
                ['user_id' => $user->id],
                [
                    'admission_number' => $user->id_card_number,
                    'first_name' => $user->name,
                ]
            ), function ($student) use ($user) {
                $group = ClassSectionGroup::first();
                if ($group && !StudentEnrollment::where('student_id', $student->id)->exists()) {
                    $roll = \App\Services\Student\StudentRollNumberService::nextForGroup($group);
                    StudentEnrollment::create([
                        'student_id' => $student->id,
                        'class_section_group_id' => $group->id,
                        'roll_number' => $roll,
                        'admission_date' => now()->toDateString(),
                        'status' => 'active',
                    ]);
                    $student->update(['admission_number' => $roll]);
                }
            }),
            default => null,
        };

        $successMessage = "User {$user->name} ({$validated['role']}) created successfully!";
        if ($wasAutoPassword) {
            $successMessage .= " Login: {$user->id_card_number} | Password: {$plainPassword}";
        }

        return redirect()->route('superadmin.users.index')
            ->with('success', $successMessage)
            ->with('credentials', [
                'user' => [
                    'name' => $user->name,
                    'login' => $user->id_card_number,
                    'email' => $user->email,
                    'password' => $plainPassword,
                    'role' => $validated['role'],
                ],
            ]);
    }

    /**
     * Show the form for editing the specified user.
     */
    public function edit(User $user)
    {
        $roles = Role::all();
        return inertia('dashboard/superadmin/users/Edit', [
            'user' => $user->load('roles', 'permissions'),
            'roles' => $roles,
        ]);
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user)
    {
        $this->normalizeOptionalEmail($request);

        $settings = app(SystemSettingService::class);

        $request->merge([
            'phone' => filled($request->input('phone')) ? $request->input('phone') : null,
        ]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'id_card_number' => ['required', 'string', 'max:50', Rule::unique('users', 'id_card_number')->ignore($user->getKey())],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->getKey())],
            'phone' => 'nullable|string|max:20',
            'password' => ['nullable', 'confirmed', $settings->passwordRule()],
            'role' => 'required|exists:roles,name',
            'is_active' => 'boolean',
        ]);

        $emailChanged = ($validated['email'] ?? null) !== $user->email;

        $userData = [
            'name' => $validated['name'],
            'id_card_number' => $validated['id_card_number'],
            'email' => $validated['email'] ?? null,
            'phone' => $validated['phone'] ?? null,
            'is_active' => $validated['is_active'] ?? true,
        ];

        if ($emailChanged) {
            $userData['email_verified_at'] = filled($validated['email'] ?? null) ? now() : null;
        }

        if (! empty($validated['password'])) {
            $userData['password'] = Hash::make($validated['password']);
        }

        $user->update($userData);
        $user->syncRoles($validated['role']);

        // Synchronize role profile if missing
        match ($validated['role']) {
            'teacher' => Teacher::firstOrCreate(
                ['user_id' => $user->id],
                ['staff_id' => 'TCH' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT), 'status' => 'active']
            ),
            'employee' => Employee::firstOrCreate(
                ['user_id' => $user->id],
                ['employee_id' => 'EMP' . str_pad((string) $user->id, 5, '0', STR_PAD_LEFT), 'status' => 'active']
            ),
            'parent' => ParentModel::firstOrCreate(
                ['user_id' => $user->id],
                ['relation_with_student' => 'Father', 'is_active' => true]
            ),
            'student' => Student::firstOrCreate(
                ['user_id' => $user->id],
                ['admission_number' => $user->id_card_number]
            ),
            default => null,
        };

        return redirect()->route('superadmin.users.index')
            ->with('success', 'User updated successfully.');
    }

    /**
     * Toggle user active status.
     */
    public function toggleStatus(User $user)
    {
        // Prevent deactivating self
        if ($user->getKey() === Auth::id()) {
            return back()->with('error', 'You cannot deactivate your own account.');
        }

        // Prevent deactivating other super admins
        if ($user->hasRole('super_admin') && Auth::id() !== $user->getKey()) {
            return back()->with('error', 'Cannot deactivate another super admin.');
        }

        $user->update(['is_active' => !$user->is_active]);

        return back()->with('success', 'User status updated.');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user)
    {
        // Prevent deleting self
        if ($user->getKey() === Auth::id()) {
            return back()->with('error', 'You cannot delete your own account.');
        }

        // Prevent deleting other super admins
        if ($user->hasRole('super_admin')) {
            return back()->with('error', 'Cannot delete super admin.');
        }

        $user->delete();

        return back()->with('success', 'User deleted successfully.');
    }
}
