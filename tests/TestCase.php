<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication()
    {
        $this->hydrateEnvFromTestingFile();

        $app = require Application::inferBasePath().'/bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();

        return $app;
    }

    /**
     * Fill missing env vars from .env.testing (e.g. DB_PASSWORD) without
     * overriding values already set by phpunit.xml.
     */
    protected function hydrateEnvFromTestingFile(): void
    {
        $path = Application::inferBasePath().'/.env.testing';
        if (! is_file($path)) {
            $path = Application::inferBasePath().'/.env';
        }
        if (! is_file($path)) {
            return;
        }

        foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $line) {
            $line = trim($line);
            if ($line === '' || str_starts_with($line, '#') || ! str_contains($line, '=')) {
                continue;
            }

            [$name, $value] = explode('=', $line, 2);
            $name = trim($name);
            $value = trim($value);
            if (
                (str_starts_with($value, '"') && str_ends_with($value, '"')) ||
                (str_starts_with($value, "'") && str_ends_with($value, "'"))
            ) {
                $value = substr($value, 1, -1);
            }

            $alreadySet = array_key_exists($name, $_ENV)
                || array_key_exists($name, $_SERVER)
                || getenv($name) !== false;

            if ($alreadySet) {
                continue;
            }

            putenv("{$name}={$value}");
            $_ENV[$name] = $value;
            $_SERVER[$name] = $value;
        }
    }
}
