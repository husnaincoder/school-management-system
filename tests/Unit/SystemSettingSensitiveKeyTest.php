<?php

namespace Tests\Unit;

use App\Services\Setting\SystemSettingService;
use PHPUnit\Framework\TestCase;

class SystemSettingSensitiveKeyTest extends TestCase
{
    public function test_detects_secret_keys(): void
    {
        $this->assertTrue(SystemSettingService::isSensitiveKey('email.password'));
        $this->assertTrue(SystemSettingService::isSensitiveKey('password'));
        $this->assertTrue(SystemSettingService::isSensitiveKey('api_key'));
        $this->assertTrue(SystemSettingService::isSensitiveKey('app.secret'));
        $this->assertTrue(SystemSettingService::isSensitiveKey('oauth.token'));
    }

    public function test_allows_non_secret_keys(): void
    {
        $this->assertFalse(SystemSettingService::isSensitiveKey('auth.password_min_length'));
        $this->assertFalse(SystemSettingService::isSensitiveKey('email.host'));
        $this->assertFalse(SystemSettingService::isSensitiveKey('email.username'));
        $this->assertFalse(SystemSettingService::isSensitiveKey('branding.company_name'));
    }
}
