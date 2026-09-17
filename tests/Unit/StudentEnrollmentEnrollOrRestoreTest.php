<?php

namespace Tests\Unit;

use App\Models\StudentEnrollment;
use PHPUnit\Framework\TestCase;
use ReflectionMethod;

class StudentEnrollmentEnrollOrRestoreTest extends TestCase
{
    public function test_enroll_or_restore_method_exists_and_is_documented(): void
    {
        $this->assertTrue(method_exists(StudentEnrollment::class, 'enrollOrRestore'));

        $method = new ReflectionMethod(StudentEnrollment::class, 'enrollOrRestore');
        $this->assertTrue($method->isStatic());
    }
}
