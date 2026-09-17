<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\Setting\SystemSettingService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_screen_is_blocked_when_disabled(): void
    {
        $response = $this->get('/register');

        $response->assertRedirect(route('login'));
        $response->assertSessionHas('error');
    }

    public function test_registration_post_is_blocked_when_disabled(): void
    {
        $response = $this->post('/register', [
            'name' => 'Test User',
            'id_card_number' => 'ID12345',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertRedirect(route('login'));
        $this->assertGuest();
        $this->assertDatabaseMissing('users', ['email' => 'test@example.com']);
    }

    public function test_registration_screen_can_be_rendered_when_enabled(): void
    {
        $this->enableRegistration();

        $response = $this->get('/register');

        $response->assertStatus(200);
    }

    public function test_new_users_register_pending_without_role_or_session(): void
    {
        $this->enableRegistration();

        $response = $this->post('/register', [
            'name' => 'Test User',
            'id_card_number' => 'ID12345',
            'email' => 'test@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $this->assertGuest();
        $response->assertRedirect(route('login'));
        $response->assertSessionHas('status');

        $user = User::where('email', 'test@example.com')->first();
        $this->assertNotNull($user);
        $this->assertFalse($user->is_active);
        $this->assertCount(0, $user->roles);
    }

    public function test_password_min_length_from_auth_settings_is_enforced(): void
    {
        $this->enableRegistration();
        app(SystemSettingService::class)->setMany('auth', [
            'registration_enabled' => true,
            'password_min_length' => 12,
        ]);

        $response = $this->from('/register')->post('/register', [
            'name' => 'Test User',
            'id_card_number' => 'ID99999',
            'email' => 'short@example.com',
            'password' => 'password',
            'password_confirmation' => 'password',
        ]);

        $response->assertSessionHasErrors('password');
        $this->assertDatabaseMissing('users', ['email' => 'short@example.com']);
    }

    private function enableRegistration(): void
    {
        app(SystemSettingService::class)->setMany('auth', [
            'registration_enabled' => true,
            'password_min_length' => 8,
            'maintenance_mode' => false,
        ]);
    }
}
