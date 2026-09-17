<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_screen_can_be_rendered(): void
    {
        $response = $this->get('/login');

        $response->assertStatus(200);
    }

    public function test_users_can_authenticate_using_the_login_screen(): void
    {
        $user = $this->createActiveUserWithRole();

        $response = $this->post('/login', [
            'login' => $user->id_card_number,
            'password' => 'password',
        ]);

        $this->assertAuthenticated();
        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_users_can_not_authenticate_with_invalid_password(): void
    {
        $user = $this->createActiveUserWithRole();

        $this->post('/login', [
            'login' => $user->id_card_number,
            'password' => 'wrong-password',
        ]);

        $this->assertGuest();
    }

    public function test_users_without_role_cannot_authenticate(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $this->from('/login')->post('/login', [
            'login' => $user->id_card_number,
            'password' => 'password',
        ]);

        $this->assertGuest();
    }

    public function test_inactive_users_cannot_authenticate(): void
    {
        $user = $this->createActiveUserWithRole(['is_active' => false]);

        $this->from('/login')->post('/login', [
            'login' => $user->id_card_number,
            'password' => 'password',
        ]);

        $this->assertGuest();
    }

    public function test_users_can_logout(): void
    {
        $user = $this->createActiveUserWithRole();

        $response = $this->actingAs($user)->post('/logout');

        $this->assertGuest();
        $response->assertRedirect('/');
    }

    /**
     * @param  array<string, mixed>  $overrides
     */
    private function createActiveUserWithRole(array $overrides = []): User
    {
        Role::findOrCreate('employee', 'web');

        $user = User::factory()->create(array_merge(['is_active' => true], $overrides));
        $user->assignRole('employee');

        return $user;
    }
}
