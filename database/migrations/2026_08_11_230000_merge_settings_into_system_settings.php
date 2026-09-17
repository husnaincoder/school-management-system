<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Merge legacy school_brandings / auth_settings / email_settings into system_settings
     * (if those tables still exist), then ensure default keys exist.
     * attendance_settings is intentionally left alone.
     */
    public function up(): void
    {
        $now = now();

        $upsert = function (string $key, ?string $value, string $group) use ($now): void {
            $exists = DB::table('system_settings')->where('key', $key)->exists();
            if ($exists) {
                DB::table('system_settings')->where('key', $key)->update([
                    'value' => $value,
                    'group' => $group,
                    'updated_at' => $now,
                ]);
            } else {
                DB::table('system_settings')->insert([
                    'key' => $key,
                    'value' => $value,
                    'group' => $group,
                    'created_at' => $now,
                    'updated_at' => $now,
                ]);
            }
        };

        $insertIfMissing = function (string $key, ?string $value, string $group) use ($now): void {
            if (DB::table('system_settings')->where('key', $key)->exists()) {
                return;
            }
            DB::table('system_settings')->insert([
                'key' => $key,
                'value' => $value,
                'group' => $group,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        };

        $bool = fn ($v) => $v ? '1' : '0';

        if (Schema::hasTable('school_brandings')) {
            $row = DB::table('school_brandings')->orderBy('id')->first();
            if ($row) {
                $upsert('branding.company_name', $row->company_name, 'branding');
                $upsert('branding.logo_light', $row->logo_light, 'branding');
                $upsert('branding.logo_dark', $row->logo_dark, 'branding');
                $upsert('branding.logo_small', $row->logo_small, 'branding');
                $upsert('branding.favicon', $row->favicon, 'branding');
            }
            Schema::dropIfExists('school_brandings');
        }

        if (Schema::hasTable('auth_settings')) {
            $row = DB::table('auth_settings')->orderBy('id')->first();
            if ($row) {
                $upsert('auth.registration_enabled', $bool((bool) $row->registration_enabled), 'auth');
                $upsert('auth.email_verification_required', $bool((bool) $row->email_verification_required), 'auth');
                $upsert('auth.password_min_length', (string) $row->password_min_length, 'auth');
                $upsert('auth.session_timeout', (string) $row->session_timeout, 'auth');
                $upsert('auth.maintenance_mode', $bool((bool) $row->maintenance_mode), 'auth');
            }
            Schema::dropIfExists('auth_settings');
        }

        if (Schema::hasTable('email_settings')) {
            $row = DB::table('email_settings')->orderBy('id')->first();
            if ($row) {
                $upsert('email.mailer', $row->mailer ?? 'smtp', 'email');
                $upsert('email.scheme', $row->scheme, 'email');
                $upsert('email.host', $row->host, 'email');
                $upsert('email.port', $row->port !== null ? (string) $row->port : null, 'email');
                $upsert('email.username', $row->username, 'email');
                // Never store SMTP password in system_settings — write to .env only.
                if (filled($row->password ?? null)) {
                    try {
                        (new \App\Services\Setting\EnvMailWriter())->updateMailConfig([
                            'password' => $row->password,
                        ]);
                    } catch (\Throwable) {
                        // continue merge even if .env is not writable
                    }
                }
                $upsert('email.from_address', $row->from_address, 'email');
                $upsert('email.from_name', $row->from_name, 'email');
                $upsert('email.reply_to', $row->reply_to, 'email');
                $upsert('email.email_enabled', $bool((bool) ($row->email_enabled ?? true)), 'email');
            }
            Schema::dropIfExists('email_settings');
        }

        // Defaults for fresh installs (when legacy tables were never present)
        $insertIfMissing('auth.registration_enabled', '0', 'auth');
        $insertIfMissing('auth.email_verification_required', '1', 'auth');
        $insertIfMissing('auth.password_min_length', '8', 'auth');
        $insertIfMissing('auth.session_timeout', '120', 'auth');
        $insertIfMissing('auth.maintenance_mode', '0', 'auth');
        $insertIfMissing('email.mailer', 'smtp', 'email');
        $insertIfMissing('email.email_enabled', '1', 'email');
    }

    public function down(): void
    {
        DB::table('system_settings')
            ->whereIn('group', ['branding', 'auth', 'email'])
            ->orWhere('key', 'like', 'branding.%')
            ->orWhere('key', 'like', 'auth.%')
            ->orWhere('key', 'like', 'email.%')
            ->delete();
    }
};
