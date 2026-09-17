<?php

namespace Tests\Feature\Auth;

use App\Models\User;
use App\Services\Setting\SystemSettingService;
use Illuminate\Auth\Events\Verified;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\URL;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_email_verification_screen_can_be_rendered_when_required(): void
    {
        $this->enableEmailVerification();
        $user = $this->unverifiedUserWithRole();

        $response = $this->actingAs($user)->get('/verify-email');

        $response->assertStatus(200);
    }

    public function test_email_verification_screen_redirects_when_not_required(): void
    {
        app(SystemSettingService::class)->setMany('auth', [
            'email_verification_required' => false,
        ]);

        $user = $this->unverifiedUserWithRole();

        $response = $this->actingAs($user)->get('/verify-email');

        $response->assertRedirect(route('dashboard', absolute: false));
    }

    public function test_email_can_be_verified(): void
    {
        $this->enableEmailVerification();
        $user = $this->unverifiedUserWithRole();

        Event::fake();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1($user->email)]
        );

        $response = $this->actingAs($user)->get($verificationUrl);

        Event::assertDispatched(Verified::class);
        $this->assertTrue($user->fresh()->hasVerifiedEmail());
        $response->assertRedirect(route('dashboard', absolute: false).'?verified=1');
    }

    public function test_email_is_not_verified_with_invalid_hash(): void
    {
        $this->enableEmailVerification();
        $user = $this->unverifiedUserWithRole();

        $verificationUrl = URL::temporarySignedRoute(
            'verification.verify',
            now()->addMinutes(60),
            ['id' => $user->id, 'hash' => sha1('wrong-email')]
        );

        $this->actingAs($user)->get($verificationUrl);

        $this->assertFalse($user->fresh()->hasVerifiedEmail());
    }

    public function test_unverified_user_is_redirected_when_verification_required(): void
    {
        $this->enableEmailVerification();
        $user = $this->unverifiedUserWithRole();

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertRedirect(route('verification.notice'));
    }

    public function test_unverified_user_can_access_app_when_verification_disabled(): void
    {
        app(SystemSettingService::class)->setMany('auth', [
            'email_verification_required' => false,
            'maintenance_mode' => false,
        ]);

        $user = $this->unverifiedUserWithRole();

        $response = $this->actingAs($user)->get(route('dashboard'));

        $response->assertRedirect();
        $this->assertNotEquals(route('verification.notice'), $response->headers->get('Location'));
    }

    private function enableEmailVerification(): void
    {
        app(SystemSettingService::class)->setMany('auth', [
            'email_verification_required' => true,
            'maintenance_mode' => false,
        ]);
    }

    private function unverifiedUserWithRole(): User
    {
        Role::findOrCreate('employee', 'web');

        $user = User::factory()->unverified()->create(['is_active' => true]);
        $user->assignRole('employee');

        return $user;
    }
}
