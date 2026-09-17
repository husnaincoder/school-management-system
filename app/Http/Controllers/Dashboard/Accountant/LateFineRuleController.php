<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\AcademicSession;
use App\Models\ClassSectionGroup;
use App\Models\LateFineRule;
use Illuminate\Http\Request;

class LateFineRuleController extends Controller
{
    /**
     * Format class section group for display.
     */
    private function formatClassSectionGroup(ClassSectionGroup $group): array
    {
        $parts = [];
        $classSection = $group->classSection;
        $academicSessionId = $classSection && $classSection->academicSession ? $classSection->academicSession->id : null;
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
        return ['id' => $group->id, 'name' => $name, 'academic_session_id' => $academicSessionId];
    }

    /**
     * Display a listing of late fine rules.
     */
    public function index(Request $request)
    {
        $query = LateFineRule::with([
            'academicSession',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ]);

        if ($request->filled('academic_session_id')) {
            $query->where('academic_session_id', $request->academic_session_id);
        }
        if ($request->filled('class_section_group_id')) {
            $query->where('class_section_group_id', $request->class_section_group_id);
        }

        $lateFineRules = $query->orderBy('academic_session_id')->orderBy('class_section_group_id')->orderBy('days_from')->get()->map(function (LateFineRule $rule) {
            $group = $rule->classSectionGroup;
            return [
                'id' => $rule->id,
                'academic_session_id' => $rule->academic_session_id,
                'class_section_group_id' => $rule->class_section_group_id,
                'days_from' => $rule->days_from,
                'days_to' => $rule->days_to,
                'fine_type' => $rule->fine_type,
                'amount' => $rule->amount,
                'max_cap' => $rule->max_cap,
                'is_active' => $rule->is_active,
                'academic_session' => $rule->academicSession ? ['id' => $rule->academicSession->id, 'name' => $rule->academicSession->name] : null,
                'class_section_group' => $group ? $this->formatClassSectionGroup($group) : null,
            ];
        });

        $academicSessions = AcademicSession::orderBy('start_date', 'desc')->get()->map(fn ($s) => ['id' => $s->id, 'name' => $s->name]);

        $classSectionGroups = ClassSectionGroup::with([
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'subjectGroup',
        ])->get()->map(fn (ClassSectionGroup $g) => $this->formatClassSectionGroup($g));

        return inertia('dashboard/fee/LateFineRules', [
            'lateFineRules' => $lateFineRules,
            'academicSessions' => $academicSessions,
            'classSectionGroups' => $classSectionGroups,
            'filterAcademicSessionId' => $request->get('academic_session_id', ''),
            'filterClassSectionGroupId' => $request->get('class_section_group_id', ''),
        ]);
    }

    /**
     * Store a newly created late fine rule.
     */
    public function store(Request $request)
    {
        $request->merge([
            'days_to' => $request->input('days_to') ?: null,
            'max_cap' => $request->input('max_cap') ?: null,
            'class_section_group_id' => $request->input('class_section_group_id') ?: null,
        ]);
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'class_section_group_id' => 'nullable|exists:class_section_groups,id',
            'days_from' => 'required|integer|min:0',
            'days_to' => 'nullable|integer|min:0|gte:days_from',
            'fine_type' => 'required|in:fixed,per_day',
            'amount' => 'required|numeric|min:0',
            'max_cap' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ], [
            'academic_session_id.required' => 'Please select an academic session.',
            'days_from.required' => 'Days from is required.',
            'fine_type.required' => 'Fine type is required.',
            'amount.required' => 'Amount is required.',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);

        try {
            LateFineRule::create($validated);
        } catch (\Throwable $e) {
            return back()->with('error', 'Could not save: ' . $e->getMessage())->withInput();
        }

        return back()->with('success', 'Late fine rule added successfully.');
    }

    /**
     * Update the specified late fine rule.
     */
    public function update(Request $request, LateFineRule $lateFineRule)
    {
        $request->merge([
            'days_to' => $request->input('days_to') ?: null,
            'max_cap' => $request->input('max_cap') ?: null,
            'class_section_group_id' => $request->input('class_section_group_id') ?: null,
        ]);
        $validated = $request->validate([
            'academic_session_id' => 'required|exists:academic_sessions,id',
            'class_section_group_id' => 'nullable|exists:class_section_groups,id',
            'days_from' => 'required|integer|min:0',
            'days_to' => 'nullable|integer|min:0|gte:days_from',
            'fine_type' => 'required|in:fixed,per_day',
            'amount' => 'required|numeric|min:0',
            'max_cap' => 'nullable|numeric|min:0',
            'is_active' => 'boolean',
        ], [
            'academic_session_id.required' => 'Please select an academic session.',
            'days_from.required' => 'Days from is required.',
            'fine_type.required' => 'Fine type is required.',
            'amount.required' => 'Amount is required.',
        ]);
        $validated['is_active'] = $request->boolean('is_active', true);

        try {
            $lateFineRule->update($validated);
        } catch (\Throwable $e) {
            return back()->with('error', 'Could not update: ' . $e->getMessage())->withInput();
        }

        return back()->with('success', 'Late fine rule updated successfully.');
    }

    /**
     * Remove the specified late fine rule (soft delete).
     */
    public function destroy(LateFineRule $lateFineRule)
    {
        $lateFineRule->delete();
        return back()->with('success', 'Late fine rule removed successfully.');
    }
}
