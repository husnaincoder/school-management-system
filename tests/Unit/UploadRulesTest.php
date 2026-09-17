<?php

namespace Tests\Unit;

use App\Support\UploadRules;
use PHPUnit\Framework\TestCase;

class UploadRulesTest extends TestCase
{
    public function test_document_file_rules_include_mime_whitelist(): void
    {
        $rules = UploadRules::documentFile(maxKilobytes: 10240);

        $this->assertContains('nullable', $rules);
        $this->assertContains('file', $rules);
        $this->assertContains('max:10240', $rules);
        $this->assertTrue(
            collect($rules)->contains(fn ($rule) => is_string($rule) && str_starts_with($rule, 'mimes:'))
        );
        $this->assertStringContainsString('pdf', UploadRules::documentExtensionsCsv());
        $this->assertStringNotContainsString('php', UploadRules::documentExtensionsCsv());
        $this->assertStringNotContainsString('exe', UploadRules::documentExtensionsCsv());
        $this->assertStringNotContainsString('svg', UploadRules::documentExtensionsCsv());
    }
}
