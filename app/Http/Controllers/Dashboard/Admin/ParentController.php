<?php

namespace App\Http\Controllers\Dashboard\Admin;

use App\Http\Controllers\Controller;
use App\Http\Concerns\NormalizesOptionalEmail;
use App\Http\Concerns\UpdatesOptionalPassword;
use App\Models\ParentModel;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ParentController extends Controller
{
    use NormalizesOptionalEmail, UpdatesOptionalPassword;

    public function index(Request $request)
    {
        $query = ParentModel::with('user');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('spouse_name', 'like', "%{$search}%")
                    ->orWhere('relation_with_student', 'like', "%{$search}%")
                    ->orWhere('occupation', 'like', "%{$search}%")
                    ->orWhere('father_cnic', 'like', "%{$search}%")
                    ->orWhere('spouse_cnic', 'like', "%{$search}%")
                    ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                        ->orWhere('id_card_number', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $parents = $query->orderBy('created_at', 'desc')->orderBy('id', 'desc')->paginate(20);

        return inertia('dashboard/admin/Parents', [
            'parents' => $parents,
            'filters' => $request->only(['search']),
        ]);
    }

    public function create()
    {
        return inertia('dashboard/admin/ParentCreate');
    }

    public function store(Request $request)
    {
        [$parent, $plainPassword] = $this->createParent($request);

        return redirect()->route('admin.parents')
            ->with('success', "Parent created successfully! Login ID: {$parent->user->id_card_number} | Password: {$plainPassword}")
            ->with('credentials', [
                'parent' => [
                    'name' => $parent->user->name,
                    'login' => $parent->user->id_card_number,
                    'email' => $parent->user->email,
                    'password' => $plainPassword,
                ],
            ]);
    }

    public function storeQuick(Request $request)
    {
        [$parent, $plainPassword] = $this->createParent($request);

        return response()->json([
            'parent' => $parent,
            'generated_password' => $plainPassword,
        ]);
    }

    private function createParent(Request $request): array
    {
        $this->normalizeOptionalEmail($request);
        $this->normalizeOptionalPassword($request);

        if (blank($request->input('id_card_number'))) {
            $nextNumber = (User::max('id') ?? 0) + 1;
            do {
                $candidate = 'PRN' . str_pad((string) $nextNumber, 5, '0', STR_PAD_LEFT);
                $nextNumber++;
            } while (User::where('id_card_number', $candidate)->exists());

            $request->merge(['id_card_number' => $candidate]);
        }

        $request->merge([
            'phone' => filled($request->input('phone')) ? $request->input('phone') : null,
        ]);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'id_card_number' => ['required', 'string', 'max:50', 'unique:users,id_card_number'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'phone' => 'nullable|string|max:20',
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'spouse_name' => 'nullable|string|max:255',
            'relation_with_student' => 'nullable|string|max:255|in:Father,Mother,Guardian',
            'father_cnic' => 'nullable|string|max:15',
            'spouse_cnic' => 'nullable|string|max:15',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'monthly_income' => 'nullable|numeric|min:0',
            'photo' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp|max:5120',
            'is_active' => 'boolean',
        ]);

        $plainPassword = filled($validated['password'] ?? null)
            ? $validated['password']
            : 'prn_' . Str::lower(Str::random(8));

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
            $user->assignRole('parent');

            return $user;
        });

        $isActive = $request->boolean('is_active', true);
        $photoPath = $request->hasFile('photo')
            ? $request->file('photo')->store('parents', 'public')
            : null;

        $parent = ParentModel::create([
            'user_id' => $newUser->id,
            'spouse_name' => $validated['spouse_name'] ?? null,
            'relation_with_student' => $validated['relation_with_student'] ?? 'Father',
            'father_cnic' => $validated['father_cnic'] ?? null,
            'spouse_cnic' => $validated['spouse_cnic'] ?? null,
            'address' => $validated['address'] ?? null,
            'city' => $validated['city'] ?? null,
            'state' => $validated['state'] ?? null,
            'postal_code' => $validated['postal_code'] ?? null,
            'country' => $validated['country'] ?? null,
            'occupation' => $validated['occupation'] ?? null,
            'monthly_income' => $validated['monthly_income'] ?? null,
            'photo' => $photoPath,
            'is_active' => $isActive,
        ])->load('user');

        return [$parent, $plainPassword];
    }

    public function edit(ParentModel $parent)
    {
        return inertia('dashboard/admin/ParentEdit', [
            'parent' => $parent->load('user'),
        ]);
    }

    public function update(Request $request, ParentModel $parent)
    {
        $this->normalizeOptionalEmail($request);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'id_card_number' => ['required', 'string', 'max:50', Rule::unique('users', 'id_card_number')->ignore($parent->user_id)],
            'email' => ['nullable', 'email', 'max:255', Rule::unique('users', 'email')->ignore($parent->user_id)],
            'phone' => 'nullable|string|max:20',
            ...$this->optionalPasswordRules(),
            'spouse_name' => 'nullable|string|max:255',
            'relation_with_student' => 'nullable|string|max:255|in:Father,Mother,Guardian',
            'father_cnic' => 'nullable|string|max:15',
            'spouse_cnic' => 'nullable|string|max:15',
            'address' => 'nullable|string',
            'city' => 'nullable|string|max:255',
            'state' => 'nullable|string|max:255',
            'postal_code' => 'nullable|string|max:50',
            'country' => 'nullable|string|max:255',
            'occupation' => 'nullable|string|max:255',
            'monthly_income' => 'nullable|numeric|min:0',
            'photo' => 'nullable|file|mimes:jpeg,jpg,png,gif,webp|max:5120',
            'is_active' => 'boolean',
        ]);

        $isActive = $request->boolean('is_active', true);

        DB::transaction(function () use ($request, $parent, $validated, $isActive) {
            $parent->user->update($this->userDataWithOptionalPassword([
                'name' => $validated['name'],
                'id_card_number' => $validated['id_card_number'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'] ?? null,
            ], $validated));

            $photoPath = $parent->photo;
            if ($request->hasFile('photo')) {
                if ($parent->photo && Storage::disk('public')->exists($parent->photo)) {
                    Storage::disk('public')->delete($parent->photo);
                }
                $photoPath = $request->file('photo')->store('parents', 'public');
            }

            $parent->update([
                'spouse_name' => $validated['spouse_name'] ?? null,
                'relation_with_student' => $validated['relation_with_student'] ?? 'Father',
                'father_cnic' => $validated['father_cnic'] ?? null,
                'spouse_cnic' => $validated['spouse_cnic'] ?? null,
                'address' => $validated['address'] ?? null,
                'city' => $validated['city'] ?? null,
                'state' => $validated['state'] ?? null,
                'postal_code' => $validated['postal_code'] ?? null,
                'country' => $validated['country'] ?? null,
                'occupation' => $validated['occupation'] ?? null,
                'monthly_income' => $validated['monthly_income'] ?? null,
                'photo' => $photoPath,
                'is_active' => $isActive,
            ]);
        });

        return redirect()->route('admin.parents')->with('success', 'Parent updated.');
    }

    /**
     * Show single parent with user data.
     */
    public function show(ParentModel $parent)
    {
        $parent->load('user', 'students.user');
        return inertia('dashboard/admin/ParentShow', ['parent' => $parent]);
    }

    /**
     * Delete parent record and associated user.
     */
    public function destroy(ParentModel $parent)
    {
        DB::transaction(function () use ($parent) {
            $user = $parent->user;
            $parent->students()->update(['parent_id' => null]);
            $parent->delete();
            if ($user) {
                $user->delete();
            }
        });

        return back()->with('success', 'Parent and user account removed.');
    }
}
