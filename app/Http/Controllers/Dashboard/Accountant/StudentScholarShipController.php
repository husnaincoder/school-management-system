<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\ScholarShip;
use App\Models\StudentEnrollment;
use App\Models\StudentScholarShip;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StudentScholarShipController extends Controller
{
    public function index(Request $request)
    {
        $assignments = StudentScholarShip::with([
            'enrollment.student',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
            'enrollment.classSectionGroup.subjectGroup',
            'scholarship',
        ])->latest()->paginate(15)->through(function ($row) {
            $en = $row->enrollment;
            $student = $en ? $en->student : null;
            $label = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : '-';
            $csg = $en ? $en->classSectionGroup : null;
            if ($csg && $csg->classSection) {
                $cs = $csg->classSection;
                $parts = array_filter([
                    $cs->academicSession ? $cs->academicSession->name : null,
                    $cs->class ? $cs->class->name : null,
                    $cs->section ? $cs->section->name : null,
                    $csg->subjectGroup ? $csg->subjectGroup->name : null,
                ]);
                if (!empty($parts)) {
                    $label .= ' - ' . implode(' - ', $parts);
                }
            }
            return [
                'id' => $row->id,
                'student_enrollment_id' => $row->student_enrollment_id,
                'scholarship_id' => $row->scholarship_id,
                'enrollment_label' => $label,
                'scholarship' => $row->scholarship ? [
                    'id' => $row->scholarship->id,
                    'name' => $row->scholarship->name,
                    'type' => $row->scholarship->type,
                    'value' => $row->scholarship->value,
                ] : null,
            ];
        });

        $enrollments = StudentEnrollment::with([
            'student',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ])->get()->map(function ($en) {
            $student = $en->student;
            $label = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : '-';
            $csg = $en->classSectionGroup;
            if ($csg && $csg->classSection) {
                $cs = $csg->classSection;
                $parts = array_filter([
                    $cs->academicSession ? $cs->academicSession->name : null,
                    $cs->class ? $cs->class->name : null,
                    $cs->section ? $cs->section->name : null,
                    $csg->subjectGroup ? $csg->subjectGroup->name : null,
                ]);
                if (!empty($parts)) {
                    $label .= ' - ' . implode(' - ', $parts);
                }
            }
            return ['id' => $en->id, 'name' => $label];
        });

        $scholarships = ScholarShip::orderBy('name')->get(['id', 'name', 'type', 'value']);

        return Inertia::render('dashboard/accountant/fee/StudentScholarShips', [
            'assignments' => $assignments,
            'enrollments' => $enrollments,
            'scholarships' => $scholarships,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_enrollment_id' => 'required|exists:student_enrollments,id',
            'scholarship_id' => 'required|exists:scholar_ships,id',
        ]);
        StudentScholarShip::firstOrCreate([
            'student_enrollment_id' => $validated['student_enrollment_id'],
            'scholarship_id' => $validated['scholarship_id'],
        ]);
        return back()->with('success', 'Scholarship assigned successfully.');
    }

    public function destroy(StudentScholarShip $studentScholarShip)
    {
        $studentScholarShip->delete();
        return back()->with('success', 'Scholarship assignment removed.');
    }
}
