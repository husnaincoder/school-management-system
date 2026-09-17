<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AcademicSession;
use App\Models\SchoolClass;
use App\Models\Section;
use App\Models\ClassSection;
use App\Models\Subject;
use App\Models\FeeStructure;

class AcademicDataSeeder extends Seeder
{
    public function run(): void
    {
        // Create Academic Session
        $session = AcademicSession::firstOrCreate(
            ['name' => '2024-2025'],
            [
                'start_date' => '2024-04-01',
                'end_date' => '2025-03-31',
                'is_current' => true,
            ]
        );

        // Create Classes
        $classes = [
            ['name' => 'Nursery', 'class_number' => 0],
            ['name' => 'KG I', 'class_number' => 1],
            ['name' => 'KG II', 'class_number' => 2],
            ['name' => 'Class 1', 'class_number' => 3],
            ['name' => 'Class 2', 'class_number' => 4],
            ['name' => 'Class 3', 'class_number' => 5],
            ['name' => 'Class 4', 'class_number' => 6],
            ['name' => 'Class 5', 'class_number' => 7],
            ['name' => 'Class 6', 'class_number' => 8],
            ['name' => 'Class 7', 'class_number' => 9],
            ['name' => 'Class 8', 'class_number' => 10],
            ['name' => 'Class 9', 'class_number' => 11],
            ['name' => 'Class 10', 'class_number' => 12],
            ['name' => 'Class 11', 'class_number' => 13],
            ['name' => 'Class 12', 'class_number' => 14],
        ];

        $createdClasses = [];
        foreach ($classes as $class) {
            $createdClasses[] = SchoolClass::firstOrCreate(
                ['name' => $class['name']],
                [
                    'class_number' => $class['class_number'],
                    'is_active' => true,
                ]
            );
        }

        // Create standalone sections (e.g. A, B)
        $sectionA = Section::firstOrCreate(
            ['name' => 'A'],
            ['capacity' => 40, 'is_active' => true]
        );
        $sectionB = Section::firstOrCreate(
            ['name' => 'B'],
            ['capacity' => 40, 'is_active' => true]
        );

        // Link classes + sections to session via class_sections
        foreach ($createdClasses as $class) {
            ClassSection::firstOrCreate(
                [
                    'academic_session_id' => $session->id,
                    'class_id' => $class->id,
                    'section_id' => $sectionA->id,
                ],
                ['capacity' => 40, 'is_active' => true]
            );
            ClassSection::firstOrCreate(
                [
                    'academic_session_id' => $session->id,
                    'class_id' => $class->id,
                    'section_id' => $sectionB->id,
                ],
                ['capacity' => 40, 'is_active' => true]
            );
        }

        // Create Subjects for primary classes
        $primaryClass = SchoolClass::where('class_number', '>=', 3)->first();
        if ($primaryClass) {
            $subjects = [
                ['name' => 'English', 'code' => 'ENG', 'type' => 'Theory'],
                ['name' => 'Mathematics', 'code' => 'MATH', 'type' => 'Theory'],
                ['name' => 'Physics', 'code' => 'PHY', 'type' => 'Theory'],
                ['name' => 'Physics Practical', 'code' => 'PHY-P', 'type' => 'Practical'],
                ['name' => 'Chemistry', 'code' => 'CHEM', 'type' => 'Theory'],
                ['name' => 'Chemistry Practical', 'code' => 'CHEM-P', 'type' => 'Practical'],
                ['name' => 'Biology', 'code' => 'BIO', 'type' => 'Theory'],
                ['name' => 'Computer Science', 'code' => 'CS', 'type' => 'Theory'],
            ];

            foreach ($subjects as $subject) {
                Subject::firstOrCreate(
                    [
                        'name' => $subject['name'],
                        'code' => $subject['code'],
                        'type' => $subject['type'],
                    ],
                    [
                        'is_active' => true,
                    ]            
                );
            }
        }

        // Create Fee Structures
        $feeTypes = [
            ['name' => 'Tuition Fee', 'amount' => 1000],
            ['name' => 'Admission Fee', 'amount' => 500],
            ['name' => 'Exam Fee', 'amount' => 300],
            ['name' => 'Transport Fee', 'amount' => 500],
        ];

        foreach ($createdClasses as $class) {
            foreach ($feeTypes as $fee) {
                FeeStructure::firstOrCreate(
                    [
                        'academic_session_id' => $session->id,
                        'class_id' => $class->id,
                        'fee_type' => $fee['name'],
                    ],
                    [
                        'amount' => $fee['amount'],
                        'is_active' => true,
                    ]
                );
            }
        }
    }
}
