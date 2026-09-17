<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\ClassFeeStructure;
use App\Models\ClassSectionGroup;
use App\Models\FeeType;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ClassFeeStructureController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        // Helper to build a readable label for class-section-groups
        $formatClassSectionGroup = function (ClassSectionGroup $group): array {
            $parts = [];

            $classSection = $group->classSection;
            if ($classSection && $classSection->academicSession) {
                $parts[] = $classSection->academicSession->name;
            }
            if ($classSection && $classSection->class) {
                $parts[] = $classSection->class->name;
            }
            if ($classSection && $classSection->section) {
                $parts[] = $classSection->section->name;
            }
            if ($group->subjectGroup) {
                $parts[] = $group->subjectGroup->name;
            }

            $name = $parts ? implode(' · ', $parts) : 'Group #' . $group->id;

            return [
                'id' => $group->id,
                'name' => $name,
            ];
        };

        $feeStructures = ClassFeeStructure::with([
                'feeType',
                'classSectionGroup.classSection.academicSession',
                'classSectionGroup.classSection.class',
                'classSectionGroup.classSection.section',
                'classSectionGroup.subjectGroup',
            ])
            ->paginate(20)
            ->through(function (ClassFeeStructure $item) use ($formatClassSectionGroup) {
                $group = $item->classSectionGroup;

                return [
                    'id' => $item->id,
                    'class_section_group_id' => $item->class_section_group_id,
                    'fee_type_id' => $item->fee_type_id,
                    'amount' => $item->amount,
                    'class_section_group' => $group ? $formatClassSectionGroup($group) : null,
                    'fee_type' => $item->feeType ? [
                        'id' => $item->feeType->id,
                        'name' => $item->feeType->name,
                    ] : null,
                ];
            });

        $feeTypes = FeeType::all()->map(function (FeeType $type) {
            return [
                'id' => $type->id,
                'name' => $type->name,
            ];
        });

        $classSectionGroups = ClassSectionGroup::with([
                'classSection.academicSession',
                'classSection.class',
                'classSection.section',
                'subjectGroup',
            ])
            ->get()
            ->map($formatClassSectionGroup);

        return Inertia::render('dashboard/accountant/fee/ClassFeeStructures', [
            'feeStructures' => $feeStructures,
            'feeTypes' => $feeTypes,
            'classSectionGroups' => $classSectionGroups,
        ]);
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $feeTypes = FeeType::all();
        $classSectionGroups = ClassSectionGroup::all();

        return view('class_fee_structures.create', compact('feeTypes', 'classSectionGroups'));
    }
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'amount' => 'required|numeric|min:0',
        ]);

        ClassFeeStructure::create($validated);

        return redirect()->route('class-fee-structures.index')->with('success', 'Fee structure added successfully.');
    }
    public function edit(ClassFeeStructure $classFeeStructure)
    {
        $feeTypes = FeeType::all();
        $classSectionGroups = ClassSectionGroup::all();

        return view('class_fee_structures.edit', compact('classFeeStructure', 'feeTypes', 'classSectionGroups'));
    }
    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, ClassFeeStructure $classFeeStructure)
    {
        $validated = $request->validate([
            'class_section_group_id' => 'required|exists:class_section_groups,id',
            'fee_type_id' => 'required|exists:fee_types,id',
            'amount' => 'required|numeric|min:0',
        ]);

        $classFeeStructure->update($validated);

        return redirect()->route('class-fee-structures.index')->with('success', 'Fee structure updated successfully.');
    }
    /**
     * Remove the specified resource from storage.
     */
    public function destroy(ClassFeeStructure $classFeeStructure)
    {
        $classFeeStructure->delete();

        return redirect()->route('class-fee-structures.index')->with('success', 'Fee structure deleted successfully.');
    }
}
