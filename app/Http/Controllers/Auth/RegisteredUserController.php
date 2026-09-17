<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\Setting\SystemSettingService;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    public function __construct(
        private SystemSettingService $settings
    ) {}

    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        $auth = $this->settings->getAuthSettings();

        return Inertia::render('Auth/Register', [
            'passwordMinLength' => $auth['password_min_length'],
        ]);
    }

    /**
     * Handle an incoming registration request.
     *
     * Public self-registration never grants a role or an active session.
     * An administrator must activate the account and assign a role.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->merge([
            'email' => filled($request->input('email')) ? $request->input('email') : null,
        ]);

        $request->validate([
            'name' => 'required|string|max:255',
            'id_card_number' => 'required|string|max:50|unique:'.User::class.',id_card_number',
            'email' => 'nullable|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', $this->settings->passwordRule()],
        ]);

        $user = User::create([
            'name' => $request->name,
            'id_card_number' => $request->id_card_number,
            'email' => $request->email ?: null,
            'password' => Hash::make($request->password),
            'is_active' => false,
            'email_verified_at' => null,
        ]);

        // Never assign a role here — school accounts are provisioned by admins.
        event(new Registered($user));

        return redirect()
            ->route('login')
            ->with(
                'status',
                'Registration received. An administrator must activate your account and assign a role before you can sign in.'
            );
    }
}
