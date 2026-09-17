<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Concerns\NormalizesOptionalEmail;
use App\Http\Concerns\UpdatesOptionalPassword;
use App\Models\Teacher;
use App\Models\TeacherQualification;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class TeacherManagementController extends Controller
{
    use NormalizesOptionalEmail, UpdatesOptionalPassword;

    private function teacherDocumentRules(bool $forUpdate = false): array
    {
        $fileRules = ['file', 'mimes:jpeg,jpg,png,gif,pdf', 'max:10240'];
        $photoRules = ['file', 'mimes:jpeg,jpg,png,gif', 'max:5120'];

        if ($forUpdate) {
            return [
                'cv' => ['nullable', Rule::when(fn () => request()->hasFile('cv'), $fileRules)],
                'id_card_front' => ['nullable', Rule::when(fn () => request()->hasFile('id_card_front'), $fileRules)],
                'id_card_back' => ['nullable', Rule::when(fn () => request()->hasFile('id_card_back'), $fileRules)],
                'photo' => ['nullable', Rule::when(fn () => request()->hasFile('photo'), $photoRules)],
            ];
        }

        return [
            'cv' => ['nullable', ...$fileRules],
            'id_card_front' => ['nullable', ...$fileRules],
            'id_card_back' => ['nullable', ...$fileRules],
            'photo' => ['nullable', ...$photoRules],
            'qualifications.*.certificate_image' => ['nullable', ...$fileRules],
        ];
    }

    private function resolveDocumentPath(Request $request, string $field, ?string $existing): ?string
    {
        if ($request->hasFile($field)) {
            return $request->file($field)->store('teachers', 'public');
        }

        if (! $request->has($field)) {
            return $existing;
        }

        $submitted = $request->input($field);

        if ($submitted === null || $submitted === '') {
            return null;
        }

        return is_string($submitted) ? $submitted : $existing;
    }

    /**
     * List teachers. Pass users with role 'teacher' for create/update select.
     */
    public function index(Request $request)
    {
        $query = Teacher::with('user', 'qualifications');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('staff_id', 'like', "%{$search}%")
                    ->orWhere('department', 'like', "%{$search}%")
                    ->orWhere('designation', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                        ->orWhere('id_card_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $teachers = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate(20);

        return inertia('dashboard/admin/Teacher/Index', [
            'teachers' => $teachers,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return inertia('dashboard/admin/Teacher/Create');
    }

    /**
     * Create teacher – user_id must be a user with role 'teacher'. Save qualifications. File uploads: cv, id_card_front, id_card_back, photo, qualifications.*.certificate_image.
     */
    public function store(Request $request)
    {
        $this->normalizeOptionalEmail($request);

        if (blank($request->input('id_card_number'))) {
            $nextNumber = (User::max('id') ?? 0) + 1;
            do {
                $candidate = 'TCH' . str_pad((string) $nextNumber, 5, '0', STR_PAD_LEFT);
                $nextNumber++;
            } while (User::where('id_card_number', $candidate)->exists());

            $request->merge(['id_card_number' => $candidate]);
        }

        $wasAutoPassword = false;
        $plainPassword = $request->input('password');
        if (blank($plainPassword)) {
            $wasAutoPassword = true;
            $plainPassword = 'tch_' . Str::lower(Str::random(8));
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
            'staff_id' => 'nullable|string|max:50|unique:teachers,staff_id',
            'department' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'joining_date' => 'nullable|date',
            'specialization' => 'nullable|string|max:255',
            'experience' => 'nullable|string',
            'basic_salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:active,inactive,on_leave,left',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'qualifications' => 'nullable|array',
            'qualifications.*.degree_name' => 'nullable|string|max:255',
            'qualifications.*.field_of_study' => 'nullable|string|max:255',
            'qualifications.*.board_university' => 'nullable|string|max:255',
            'qualifications.*.passing_year' => 'nullable|integer|min:1900|max:2100',
            'qualifications.*.grade_division' => 'nullable|string|max:100',
        ] + $this->teacherDocumentRules());

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
            $user->assignRole('teacher');
            return $user;
        });

        $isActive = $request->boolean('is_active', true);
        $status = $validated['status'] ?? 'active';
        $qualifications = $validated['qualifications'] ?? [];

        $teacherData = [
            'user_id' => $newUser->id,
            'staff_id' => $validated['staff_id'] ?? null,
            'department' => $validated['department'] ?? null,
            'designation' => $validated['designation'] ?? null,
            'joining_date' => $validated['joining_date'] ?? null,
            'specialization' => $validated['specialization'] ?? null,
            'experience' => $validated['experience'] ?? null,
            'basic_salary' => $validated['basic_salary'] ?? null,
            'status' => $status,
            'address' => $validated['address'] ?? null,
            'emergency_contact' => $validated['emergency_contact'] ?? null,
            'emergency_phone' => $validated['emergency_phone'] ?? null,
            'is_active' => $isActive,
            'cv' => $request->hasFile('cv') ? $request->file('cv')->store('teachers', 'public') : null,
            'id_card_front' => $request->hasFile('id_card_front') ? $request->file('id_card_front')->store('teachers', 'public') : null,
            'id_card_back' => $request->hasFile('id_card_back') ? $request->file('id_card_back')->store('teachers', 'public') : null,
            'photo' => $request->hasFile('photo') ? $request->file('photo')->store('teachers', 'public') : null,
        ];

        $teacher = Teacher::create($teacherData);

        foreach ($qualifications as $i => $q) {
            $row = [
                'degree_name' => $q['degree_name'] ?? null,
                'field_of_study' => $q['field_of_study'] ?? null,
                'board_university' => $q['board_university'] ?? null,
                'passing_year' => $q['passing_year'] ?? null,
                'grade_division' => $q['grade_division'] ?? null,
                'certificate_image' => null,
            ];
            if ($request->hasFile("qualifications.{$i}.certificate_image")) {
                $row['certificate_image'] = $request->file("qualifications.{$i}.certificate_image")->store('teacher-qualifications', 'public');
            }
            if (array_filter($row)) {
                $teacher->qualifications()->create($row);
            }
        }

        $successMessage = "Teacher {$newUser->name} created successfully!";
        if ($wasAutoPassword) {
            $successMessage .= " Login ID: {$newUser->id_card_number} | Password: {$plainPassword}";
        }

        return redirect()->route('admin.teachers.show', $teacher->id)
            ->with('success', $successMessage)
            ->with('credentials', [
                'user' => [
                    'name' => $newUser->name,
                    'login' => $newUser->id_card_number,
                    'email' => $newUser->email,
                    'password' => $plainPassword,
                    'role' => 'teacher',
                ],
            ]);
    }

    /**
     * Show edit form.
     */
    public function edit(Teacher $teacher)
    {
        $teacher->load('user', 'qualifications');
        return inertia('dashboard/admin/Teacher/Edit', [
            'teacher' => $teacher,
        ]);
    }

    /**
     * Update teacher – user_id can be another user with role 'teacher'. Replace qualifications. File uploads: cv, id_card_front, id_card_back, photo, qualifications.*.certificate_image (keep existing if no new file).
     */
    public function update(Request $request, Teacher $teacher)
    {
        $this->normalizeOptionalEmail($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'id_card_number' => ['required', 'string', 'max:50', Rule::unique('users', 'id_card_number')->ignore($teacher->user_id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($teacher->user_id)],
            'phone' => 'nullable|string|max:20',
            ...$this->optionalPasswordRules(),
            'staff_id' => ['nullable', 'string', 'max:50', Rule::unique('teachers', 'staff_id')->ignore($teacher->id)],
            'department' => 'nullable|string|max:255',
            'designation' => 'nullable|string|max:255',
            'joining_date' => 'nullable|date',
            'specialization' => 'nullable|string|max:255',
            'experience' => 'nullable|string',
            'basic_salary' => 'nullable|numeric|min:0',
            'status' => 'nullable|string|in:active,inactive,on_leave,left',
            'address' => 'nullable|string',
            'emergency_contact' => 'nullable|string|max:255',
            'emergency_phone' => 'nullable|string|max:50',
            'is_active' => 'boolean',
            'qualifications' => 'nullable|array',
            'qualifications.*.degree_name' => 'nullable|string|max:255',
            'qualifications.*.field_of_study' => 'nullable|string|max:255',
            'qualifications.*.board_university' => 'nullable|string|max:255',
            'qualifications.*.passing_year' => 'nullable|integer|min:1900|max:2100',
            'qualifications.*.grade_division' => 'nullable|string|max:100',
        ] + $this->teacherDocumentRules(forUpdate: true));

        $isActive = $request->boolean('is_active', true);
        $status = $validated['status'] ?? 'active';
        $qualifications = $validated['qualifications'] ?? [];

        DB::transaction(function () use ($teacher, $validated, $request, $isActive, $status) {
            $teacher->user->update($this->userDataWithOptionalPassword([
                'name' => $validated['name'],
                'id_card_number' => $validated['id_card_number'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
            ], $validated));

            $teacher->update([
                'staff_id' => $validated['staff_id'] ?? null,
                'department' => $validated['department'] ?? null,
                'designation' => $validated['designation'] ?? null,
                'joining_date' => $validated['joining_date'] ?? null,
                'specialization' => $validated['specialization'] ?? null,
                'experience' => $validated['experience'] ?? null,
                'basic_salary' => $validated['basic_salary'] ?? null,
                'status' => $status,
                'address' => $validated['address'] ?? null,
                'emergency_contact' => $validated['emergency_contact'] ?? null,
                'emergency_phone' => $validated['emergency_phone'] ?? null,
                'is_active' => $isActive,
                'cv' => $this->resolveDocumentPath($request, 'cv', $teacher->cv),
                'id_card_front' => $this->resolveDocumentPath($request, 'id_card_front', $teacher->id_card_front),
                'id_card_back' => $this->resolveDocumentPath($request, 'id_card_back', $teacher->id_card_back),
                'photo' => $this->resolveDocumentPath($request, 'photo', $teacher->photo),
            ]);
        });

        $teacher->qualifications()->delete();
        foreach ($qualifications as $i => $q) {
            $certPath = null;
            if ($request->hasFile("qualifications.{$i}.certificate_image")) {
                $certPath = $request->file("qualifications.{$i}.certificate_image")->store('teacher-qualifications', 'public');
            } elseif (!empty($q['certificate_image']) && is_string($q['certificate_image'])) {
                $certPath = $q['certificate_image'];
            }
            $row = [
                'degree_name' => $q['degree_name'] ?? null,
                'field_of_study' => $q['field_of_study'] ?? null,
                'board_university' => $q['board_university'] ?? null,
                'passing_year' => $q['passing_year'] ?? null,
                'grade_division' => $q['grade_division'] ?? null,
                'certificate_image' => $certPath,
            ];
            if (array_filter($row)) {
                $teacher->qualifications()->create($row);
            }
        }

        return redirect()->route('admin.teachers.show', $teacher->id)->with('success', 'Teacher updated.');
    }

    /**
     * Show single teacher with user and qualifications.
     */
    public function show(Teacher $teacher)
    {
        $teacher->load('user', 'qualifications');
        return inertia('dashboard/admin/Teacher/Show', ['teacher' => $teacher]);
    }

    /**
     * Soft delete teacher.
     */
    public function destroy(Teacher $teacher)
    {
        $teacher->delete();
        return back()->with('success', 'Teacher removed.');
    }
}
