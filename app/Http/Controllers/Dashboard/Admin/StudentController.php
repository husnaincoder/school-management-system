<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Concerns\NormalizesOptionalEmail;
use App\Http\Concerns\UpdatesOptionalPassword;
use App\Models\ClassSectionGroup;
use App\Models\ParentModel;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;
use App\Services\Student\StudentRollNumberService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class StudentController extends Controller
{
    use NormalizesOptionalEmail, UpdatesOptionalPassword;

    public function index(Request $request)
    {
        $query = Student::with(['user', 'parent.user']);

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'like', "%{$search}%")
                    ->orWhere('last_name', 'like', "%{$search}%")
                    ->orWhere('admission_number', 'like', "%{$search}%")
                    ->orWhere('cnic', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                        ->orWhere('id_card_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $students = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate(20);

        return inertia('dashboard/admin/Students', [
            'students' => $students,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        $parents = ParentModel::with('user')->orderBy('id')->get();
        $classSectionGroups = ClassSectionGroup::with(
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'subjectGroup'
        )->orderBy('class_section_id')->orderBy('subject_group_id')->get();

        return inertia('dashboard/admin/StudentCreate', [
            'parents' => $parents,
            'classSectionGroups' => $classSectionGroups,
        ]);
    }

    public function nextRollNumber(Request $request)
    {
        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
        ]);

        $group = ClassSectionGroup::with(
            'classSection.class',
            'classSection.section',
            'subjectGroup'
        )->findOrFail($validated['class_section_group_id']);

        $number = StudentRollNumberService::nextForGroup($group);

        return response()->json(['number' => $number]);
    }

    public function store(Request $request)
    {
        $this->normalizeOptionalEmail($request);
        $this->normalizeOptionalPassword($request);

        $parentId = $request->input('parent_id');
        if (blank($parentId) || $parentId === '0' || $parentId === 0 || $parentId === 'null') {
            $parentId = null;
        }

        if (blank($request->input('class_section_group_id'))) {
            $fallbackGroup = ClassSectionGroup::value('id');
            if ($fallbackGroup) {
                $request->merge(['class_section_group_id' => $fallbackGroup]);
            }
        }

        // Normalize optional fields: convert empty strings to null so validation and database accept them
        $request->merge([
            'phone' => filled($request->input('phone')) ? $request->input('phone') : null,
            'first_name' => filled($request->input('first_name')) ? $request->input('first_name') : null,
            'last_name' => filled($request->input('last_name')) ? $request->input('last_name') : null,
            'cnic' => filled($request->input('cnic')) ? $request->input('cnic') : null,
            'date_of_birth' => filled($request->input('date_of_birth')) ? $request->input('date_of_birth') : null,
            'gender' => filled($request->input('gender')) ? $request->input('gender') : null,
            'address' => filled($request->input('address')) ? $request->input('address') : null,
            'parent_id' => $parentId,
            'enrollment_admission_date' => filled($request->input('enrollment_admission_date')) ? $request->input('enrollment_admission_date') : now()->toDateString(),
            'enrollment_status' => filled($request->input('enrollment_status')) ? $request->input('enrollment_status') : 'active',
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            // 'id_card_number' is automatically generated for students
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone' => 'nullable|string|max:20',
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'cnic' => ['nullable', 'string', 'max:15', 'unique:students,cnic'],
            'profile_photo' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp,svg|max:5120',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'address' => 'nullable|string',
            'parent_id' => 'nullable|exists:parents,id',
            'parent_generated_password' => 'nullable|string',
            'sibling_discount_eligible' => 'sometimes|boolean',
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'enrollment_admission_date' => 'nullable|date',
            'enrollment_status' => 'nullable|string|in:active,promoted,left',
        ]);

        $profilePhotoPath = null;
        if ($request->hasFile('profile_photo')) {
            $profilePhotoPath = $request->file('profile_photo')->store('students', 'public');
        }

        $classSectionGroup = ClassSectionGroup::with(
            'classSection.class',
            'classSection.section',
            'subjectGroup'
        )->findOrFail($validated['class_section_group_id']);

        $studentNumber = StudentRollNumberService::nextForGroup($classSectionGroup);
        $siblingDiscountEligible = $request->boolean('sibling_discount_eligible');

        $studentPassword = filled($validated['password'] ?? null)
            ? $validated['password']
            : 'std_' . Str::lower(Str::random(8));

        DB::transaction(function () use ($validated, $profilePhotoPath, $studentNumber, $siblingDiscountEligible, $studentPassword) {
            $user = User::create([
                'name' => $validated['name'],
                'id_card_number' => $studentNumber,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
                'password' => Hash::make($studentPassword),
                'is_active' => true,
                'email_verified_at' => filled($validated['email'] ?? null) ? now() : null,
            ]);
            $user->assignRole('student');

            $student = Student::create([
                'user_id' => $user->id,
                'parent_id' => $validated['parent_id'] ?? null,
                'sibling_discount_eligible' => $siblingDiscountEligible,
                'first_name' => $validated['first_name'] ?? null,
                'last_name' => $validated['last_name'] ?? null,
                'cnic' => $validated['cnic'] ?? null,
                'profile_photo' => $profilePhotoPath,
                'admission_number' => $studentNumber,
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'address' => $validated['address'] ?? null,
            ]);

            StudentEnrollment::create([
                'student_id' => $student->id,
                'class_section_group_id' => $validated['class_section_group_id'],
                'roll_number' => $studentNumber,
                'admission_date' => $validated['enrollment_admission_date'] ?? null,
                'status' => $validated['enrollment_status'] ?? 'active',
            ]);
        });

        $parent = !empty($validated['parent_id'])
            ? ParentModel::with('user')->find($validated['parent_id'])
            : null;

        $credentials = [
            'student' => [
                'name' => $validated['name'],
                'login' => $studentNumber,
                'email' => $validated['email'] ?? null,
                'password' => $studentPassword,
            ],
        ];

        $successMessage = "Student created successfully! Student Login: {$studentNumber} | Password: {$studentPassword}";

        if ($parent && $request->filled('parent_generated_password')) {
            $parentPassword = $request->input('parent_generated_password');
            $credentials['parent'] = [
                'name' => $parent->user?->name ?? 'Parent',
                'login' => $parent->user?->id_card_number ?? '',
                'email' => $parent->user?->email ?? null,
                'password' => $parentPassword,
            ];
            $successMessage .= " | Parent Login: {$parent->user?->id_card_number} | Password: {$parentPassword}";
        } elseif ($parent) {
            $credentials['parent'] = [
                'name' => $parent->user?->name ?? 'Parent',
                'login' => $parent->user?->id_card_number ?? '',
                'email' => $parent->user?->email ?? null,
                'existing' => true,
            ];
        }

        return redirect()->route('academic.students')
            ->with('success', $successMessage)
            ->with('credentials', $credentials);
    }

    public function edit(Student $student)
    {
        $parents = ParentModel::with('user')->orderBy('id')->get();
        $classSectionGroups = ClassSectionGroup::with(
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'subjectGroup'
        )->orderBy('class_section_id')->orderBy('subject_group_id')->get();

        return inertia('dashboard/admin/StudentEdit', [
            'student' => $student->load(['user', 'enrollment']),
            'parents' => $parents,
            'classSectionGroups' => $classSectionGroups,
        ]);
    }

    public function update(Request $request, Student $student)
    {
        $this->normalizeOptionalEmail($request);

        // Normalize optional fields: convert empty strings to null so validation and database accept them
        $request->merge([
            'phone' => filled($request->input('phone')) ? $request->input('phone') : null,
            'first_name' => filled($request->input('first_name')) ? $request->input('first_name') : null,
            'last_name' => filled($request->input('last_name')) ? $request->input('last_name') : null,
            'cnic' => filled($request->input('cnic')) ? $request->input('cnic') : null,
            'date_of_birth' => filled($request->input('date_of_birth')) ? $request->input('date_of_birth') : null,
            'gender' => filled($request->input('gender')) ? $request->input('gender') : null,
            'address' => filled($request->input('address')) ? $request->input('address') : null,
            'parent_id' => filled($request->input('parent_id')) ? $request->input('parent_id') : null,
            'enrollment_admission_date' => filled($request->input('enrollment_admission_date')) ? $request->input('enrollment_admission_date') : null,
            'enrollment_status' => filled($request->input('enrollment_status')) ? $request->input('enrollment_status') : 'active',
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            // 'id_card_number' is automatically managed for students
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($student->user_id)],
            'phone' => 'nullable|string|max:20',
            ...$this->optionalPasswordRules(),
            'first_name' => 'nullable|string|max:255',
            'last_name' => 'nullable|string|max:255',
            'cnic' => ['nullable', 'string', 'max:15', Rule::unique('students', 'cnic')->ignore($student->id)->whereNull('deleted_at')],
            'profile_photo' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp,svg|max:5120',
            'date_of_birth' => 'nullable|date',
            'gender' => 'nullable|string|in:male,female,other',
            'address' => 'nullable|string',
            'parent_id' => 'nullable|exists:parents,id',
            'sibling_discount_eligible' => 'sometimes|boolean',
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'enrollment_admission_date' => 'nullable|date',
            'enrollment_status' => 'nullable|string|in:active,promoted,left',
        ]);

        $profilePhotoPath = $student->profile_photo;
        if ($request->hasFile('profile_photo')) {
            if ($student->profile_photo && Storage::disk('public')->exists($student->profile_photo)) {
                Storage::disk('public')->delete($student->profile_photo);
            }
            $profilePhotoPath = $request->file('profile_photo')->store('students', 'public');
        }

        $classSectionGroup = ClassSectionGroup::with(
            'classSection.class',
            'classSection.section',
            'subjectGroup'
        )->findOrFail($validated['class_section_group_id']);

        $student->load('enrollment');
        $siblingDiscountEligible = $request->boolean('sibling_discount_eligible');

        DB::transaction(function () use ($student, $validated, $profilePhotoPath, $classSectionGroup, $siblingDiscountEligible) {
            $enrollment = $student->enrollment
                ?? StudentEnrollment::withTrashed()->where('student_id', $student->id)->first();
            $studentNumber = $enrollment && ! $enrollment->trashed()
                ? ($enrollment->roll_number ?? $student->admission_number)
                : $student->admission_number;

            if ($enrollment && ! $enrollment->trashed() && (int) $enrollment->class_section_group_id !== (int) $validated['class_section_group_id']) {
                $studentNumber = StudentRollNumberService::nextForGroup($classSectionGroup);
            } elseif (! $enrollment || $enrollment->trashed()) {
                $studentNumber = StudentRollNumberService::nextForGroup($classSectionGroup);
            }

            $student->user->update($this->userDataWithOptionalPassword([
                'name' => $validated['name'],
                'id_card_number' => $studentNumber,
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
            ], $validated));

            $student->update([
                'first_name' => $validated['first_name'] ?? null,
                'last_name' => $validated['last_name'] ?? null,
                'cnic' => $validated['cnic'] ?? null,
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'gender' => $validated['gender'] ?? null,
                'address' => $validated['address'] ?? null,
                'parent_id' => $validated['parent_id'] ?? null,
                'sibling_discount_eligible' => $siblingDiscountEligible,
                'admission_number' => $studentNumber,
                'profile_photo' => $profilePhotoPath,
            ]);

            StudentEnrollment::enrollOrRestore([
                'student_id' => $student->id,
                'class_section_group_id' => $validated['class_section_group_id'],
                'roll_number' => $studentNumber,
                'admission_date' => $validated['enrollment_admission_date'] ?? null,
                'status' => $validated['enrollment_status'] ?? 'active',
            ]);
        });

        return redirect()->route('academic.students')->with('success', 'Student updated.');
    }

    public function show(Student $student)
    {
        $student->load([
            'user',
            'parent.user',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
            'enrollment.classSectionGroup.subjectGroup',
        ]);

        return inertia('dashboard/admin/StudentShow', ['student' => $student]);
    }

    public function destroy(Student $student)
    {
        DB::transaction(function () use ($student) {
            $user = $student->user;
            $student->enrollments()->delete();
            $student->delete();
            if ($user) {
                $user->delete();
            }
        });

        return back()->with('success', 'Student and user account removed.');
    }
}
