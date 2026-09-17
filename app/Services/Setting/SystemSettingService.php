<?php

namespace App\Services\Setting;

use App\Models\SystemSetting;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;

class SystemSettingService
{
    public const GROUP_BRANDING = 'branding';

    public const GROUP_AUTH = 'auth';

    public const GROUP_EMAIL = 'email';

    public const BRANDING_KEYS = [
        'company_name',
        'logo_light',
        'logo_dark',
        'logo_small',
        'favicon',
    ];

    public const AUTH_DEFAULTS = [
        'registration_enabled' => false,
        'email_verification_required' => true,
        'password_min_length' => 8,
        'session_timeout' => 120,
        'maintenance_mode' => false,
    ];

    public const EMAIL_DEFAULTS = [
        'mailer' => 'smtp',
        'scheme' => null,
        'host' => null,
        'port' => null,
        'username' => null,
        'from_address' => null,
        'from_name' => null,
        'reply_to' => null,
        'email_enabled' => true,
    ];

    /**
     * Keys that must never be stored or returned as plaintext via System Settings CRUD.
     * Mail password lives only in .env (MAIL_PASSWORD).
     */
    public static function isSensitiveKey(string $key): bool
    {
        $field = str_contains($key, '.')
            ? substr($key, strrpos($key, '.') + 1)
            : $key;

        return (bool) preg_match('/^(password|secret|token|api[_-]?key|private[_-]?key)$/i', $field);
    }

    public function get(string $key, mixed $default = null): mixed
    {
        $row = SystemSetting::query()->where('key', $key)->first();

        return $row?->value ?? $default;
    }

    public function set(string $key, mixed $value, ?string $group = null): void
    {
        if (self::isSensitiveKey($key)) {
            throw new \InvalidArgumentException(
                "Refusing to store sensitive key [{$key}] in system_settings. Use the dedicated settings screen / .env instead."
            );
        }

        if ($group === null && str_contains($key, '.')) {
            $group = explode('.', $key, 2)[0];
        }

        $stored = $this->serializeValue($value);

        SystemSetting::query()->updateOrCreate(
            ['key' => $key],
            ['value' => $stored, 'group' => $group]
        );
    }

    /**
     * @param  array<string, mixed>  $values  field => value (without group prefix)
     */
    public function setMany(string $group, array $values): void
    {
        DB::transaction(function () use ($group, $values) {
            foreach ($values as $field => $value) {
                $fullKey = $group.'.'.$field;
                if (self::isSensitiveKey($fullKey) || self::isSensitiveKey((string) $field)) {
                    continue;
                }
                $this->set($fullKey, $value, $group);
            }
        });
    }

    /**
     * @return array<string, mixed>
     */
    public function getGroup(string $group): array
    {
        $prefix = $group . '.';
        $rows = SystemSetting::query()
            ->where(function ($q) use ($group, $prefix) {
                $q->where('group', $group)
                    ->orWhere('key', 'like', $prefix . '%');
            })
            ->get();

        $out = [];
        foreach ($rows as $row) {
            $field = str_starts_with($row->key, $prefix)
                ? substr($row->key, strlen($prefix))
                : $row->key;
            $out[$field] = $row->value;
        }

        return $out;
    }

    /**
     * Branding payload for settings page / shared Inertia props.
     *
     * @return array<string, mixed>
     */
    public function getBranding(): array
    {
        $data = $this->getGroup(self::GROUP_BRANDING);

        $paths = [
            'logo_light' => $data['logo_light'] ?? null,
            'logo_dark' => $data['logo_dark'] ?? null,
            'logo_small' => $data['logo_small'] ?? null,
            'favicon' => $data['favicon'] ?? null,
        ];

        return [
            'company_name' => $data['company_name'] ?? null,
            'logo_light' => $paths['logo_light'],
            'logo_dark' => $paths['logo_dark'],
            'logo_small' => $paths['logo_small'],
            'favicon' => $paths['favicon'],
            'logo_light_url' => $this->publicUrl($paths['logo_light']),
            'logo_dark_url' => $this->publicUrl($paths['logo_dark']),
            'logo_small_url' => $this->publicUrl($paths['logo_small']),
            'favicon_url' => $this->publicUrl($paths['favicon']),
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function getAuthSettings(): array
    {
        $data = $this->getGroup(self::GROUP_AUTH);
        $merged = array_merge(self::AUTH_DEFAULTS, $data);

        return [
            'registration_enabled' => $this->toBool($merged['registration_enabled']),
            'email_verification_required' => $this->toBool($merged['email_verification_required']),
            'password_min_length' => max(6, (int) $merged['password_min_length']),
            'session_timeout' => max(1, (int) $merged['session_timeout']),
            'maintenance_mode' => $this->toBool($merged['maintenance_mode']),
        ];
    }

    public function passwordRule(): Password
    {
        return Password::min($this->getAuthSettings()['password_min_length']);
    }

    /**
     * Email settings for the UI. Password is never returned — only whether one is configured in .env.
     *
     * @return array<string, mixed>
     */
    public function getEmailSettings(): array
    {
        $data = $this->getGroup(self::GROUP_EMAIL);
        unset($data['password']);
        $merged = array_merge(self::EMAIL_DEFAULTS, $data);

        $port = $merged['port'];
        if ($port === '' || $port === null) {
            $port = null;
        } else {
            $port = (int) $port;
        }

        $envPassword = config('mail.mailers.smtp.password');
        $passwordIsSet = filled($envPassword) && (string) $envPassword !== 'null';

        return [
            'mailer' => $merged['mailer'] ?: 'smtp',
            'scheme' => $merged['scheme'] ?: null,
            'host' => $merged['host'] ?: null,
            'port' => $port,
            'username' => $merged['username'] ?: null,
            'from_address' => $merged['from_address'] ?: null,
            'from_name' => $merged['from_name'] ?: null,
            'reply_to' => $merged['reply_to'] ?: null,
            'email_enabled' => $this->toBool($merged['email_enabled'] ?? true),
            'password_is_set' => $passwordIsSet,
        ];
    }

    public function publicUrl(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        // Root-relative URL so images work on localhost / 127.0.0.1 / any port
        return '/storage/' . ltrim(str_replace('\\', '/', $path), '/');
    }

    /**
     * School name + logo for DomPDF / print views.
     * Name uses APP_NAME (config app.name). Logo prefers School Branding uploads.
     *
     * @return array{school_name: string, logo_path: ?string, logo_src: ?string}
     */
    public function getPdfBranding(): array
    {
        $branding = $this->getBranding();

        $schoolName = (string) config('app.name', 'School');

        $logoPath = $this->resolveLocalFilePath($branding['logo_light'] ?? null)
            ?? $this->resolveLocalFilePath($branding['logo_dark'] ?? null)
            ?? $this->resolveLocalFilePath($branding['logo_small'] ?? null)
            ?? $this->resolveLocalFilePath(config('school.logo_path'));

        return [
            'school_name' => $schoolName,
            'logo_path' => $logoPath,
            'logo_src' => \App\Support\PdfAssets::dataUri($logoPath, 280),
        ];
    }

    /**
     * Resolve a storage/public-relative path to an absolute local file for PDF embedding.
     */
    public function resolveLocalFilePath(?string $path): ?string
    {
        if (! $path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return null;
        }

        $normalized = ltrim(str_replace('\\', '/', $path), '/');
        if (str_starts_with($normalized, 'storage/')) {
            $normalized = substr($normalized, strlen('storage/'));
        }

        $candidates = [
            storage_path('app/public/'.$normalized),
            public_path('storage/'.$normalized),
            public_path($normalized),
        ];

        foreach ($candidates as $candidate) {
            if (is_file($candidate)) {
                return $candidate;
            }
        }

        return null;
    }

    private function serializeValue(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }

        return (string) $value;
    }

    private function toBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array((string) $value, ['1', 'true', 'on', 'yes'], true);
    }
}
