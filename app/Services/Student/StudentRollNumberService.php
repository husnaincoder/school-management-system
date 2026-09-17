<?php

namespace App\Services\Student;

use App\Models\ClassSectionGroup;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\User;

class StudentRollNumberService
{
    public static function buildPrefix(ClassSectionGroup $group): string
    {
        $group->loadMissing('classSection.class', 'classSection.section', 'subjectGroup');

        $parts = array_filter([
            self::slugPart($group->classSection?->class?->name),
            self::slugPart($group->classSection?->section?->name),
            self::slugPart($group->subjectGroup?->name),
        ]);

        if ($parts === []) {
            return 'CSG'.$group->id;
        }

        return implode('-', $parts);
    }

    public static function nextForGroup(ClassSectionGroup $group): string
    {
        $prefix = self::buildPrefix($group);

        $existing = StudentEnrollment::withTrashed()
            ->where('class_section_group_id', $group->id)
            ->where('roll_number', 'like', $prefix.'-%')
            ->pluck('roll_number');

        $max = 0;
        foreach ($existing as $rollNumber) {
            if (preg_match('/-(\d+)$/', (string) $rollNumber, $matches)) {
                $max = max($max, (int) $matches[1]);
            }
        }

        $next = $max + 1;

        // Ensure collision-free uniqueness across StudentEnrollment, Student, and User
        do {
            $candidate = $prefix.'-'.str_pad((string) $next, 2, '0', STR_PAD_LEFT);
            $exists = StudentEnrollment::withTrashed()->where('roll_number', $candidate)->exists()
                || Student::withTrashed()->where('admission_number', $candidate)->exists()
                || User::where('id_card_number', $candidate)->exists();

            if ($exists) {
                $next++;
            }
        } while ($exists);

        return $candidate;
    }

    private static function slugPart(?string $value): string
    {
        if ($value === null || trim($value) === '') {
            return '';
        }

        $value = preg_replace('/\s+/', '', trim($value));

        return preg_replace('/[^A-Za-z0-9]/', '', (string) $value);
    }
}
