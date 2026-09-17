<?php

namespace App\Services\Setting;

use Illuminate\Support\Facades\File;

class EnvMailWriter
{
    protected string $path;

    public function __construct(?string $path = null)
    {
        $this->path = $path ?? base_path('.env');
    }

    /**
     * Update MAIL_* keys in .env from the given array.
     * Keys: mailer, scheme, host, port, username, password (optional - only if provided), from_address, from_name, reply_to
     * Password is only written when non-empty (to avoid overwriting with empty).
     */
    public function updateMailConfig(array $config): bool
    {
        if (! File::exists($this->path)) {
            return false;
        }

        $content = File::get($this->path);

        $map = [
            'MAIL_MAILER' => $config['mailer'] ?? 'log',
            'MAIL_SCHEME' => $this->envValue($config['scheme'] ?? null),
            'MAIL_HOST' => $this->envValue($config['host'] ?? null),
            'MAIL_PORT' => $this->envValue($config['port'] ?? null),
            'MAIL_USERNAME' => $this->envValue($config['username'] ?? null),
            'MAIL_FROM_ADDRESS' => $this->envValue($config['from_address'] ?? null),
            'MAIL_FROM_NAME' => $this->envValue($config['from_name'] ?? null),
            'MAIL_REPLY_TO' => $this->envValue($config['reply_to'] ?? null),
        ];

        if (isset($config['password']) && (string) $config['password'] !== '') {
            $map['MAIL_PASSWORD'] = $this->envValue($config['password']);
        }

        foreach ($map as $key => $value) {
            $content = $this->setEnvLine($content, $key, $value);
        }

        return File::put($this->path, $content) !== false;
    }

    protected function envValue($value): string
    {
        if ($value === null || $value === '') {
            return 'null';
        }
        $value = (string) $value;
        if (preg_match('/\s|#|$|"/', $value)) {
            return '"' . str_replace(['\\', '"'], ['\\\\', '\\"'], $value) . '"';
        }
        return $value;
    }

    protected function setEnvLine(string $content, string $key, string $value): string
    {
        $line = $key . '=' . $value;
        $pattern = '/^' . preg_quote($key, '/') . '=.*$/m';

        if (preg_match($pattern, $content)) {
            return preg_replace($pattern, $line, $content, 1);
        }

        if (preg_match('/^MAIL_/m', $content)) {
            return preg_replace('/(^MAIL_FROM_NAME=.*$)/m', '$1' . "\n" . $line, $content, 1);
        }

        return $content . "\n" . $line . "\n";
    }
}
