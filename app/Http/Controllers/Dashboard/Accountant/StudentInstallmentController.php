<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\ClassSectionGroup;
use App\Models\InstallmentPlan;
use App\Models\StudentEnrollment;
use App\Models\StudentInstallment;
use App\Services\Fee\InstallmentService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use InvalidArgumentException;

class StudentInstallmentController extends Controller
{
    public function __construct(
        protected InstallmentService $installmentService
    ) {}

    /**
     * Format class section group for display (Session · Class · Section · Group).
     */
    private function formatClassSectionGroup(ClassSectionGroup $group): array
    {
        $parts = [];
        $cs = $group->classSection;
        if ($cs && $cs->academicSession) {
            $parts[] = $cs->academicSession->name;
        }
        if ($cs && $cs->class) {
            $parts[] = $cs->class->name;
        }
        if ($cs && $cs->section) {
            $parts[] = $cs->section->name;
        }
        if ($group->subjectGroup) {
            $parts[] = $group->subjectGroup->name;
        }
        $name = $parts ? implode(' · ', $parts) : 'Group #'.$group->id;

        return ['id' => $group->id, 'name' => $name];
    }

    /**
     * Build enrollment label (student name + roll).
     */
    private function enrollmentLabel(StudentEnrollment $en): string
    {
        $student = $en->student;
        $label = $student ? trim(($student->first_name ?? '').' '.($student->last_name ?? '')) : '-';
        if ($en->roll_number !== null && $en->roll_number !== '') {
            $label .= ' (Roll: '.$en->roll_number.')';
        }

        return $label;
    }

    /**
     * Display list of student installment assignments.
     */
    public function index(Request $request)
    {
        $query = StudentInstallment::with([
            'enrollment.student',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
            'enrollment.classSectionGroup.subjectGroup',
            'installmentPlan',
            'schedules.invoice',
        ]);

        if ($request->filled('installment_plan_id')) {
            $query->where('installment_plan_id', $request->installment_plan_id);
        }
        if ($request->filled('class_section_group_id')) {
            $query->whereHas('enrollment', fn ($q) => $q->where('class_section_group_id', $request->class_section_group_id));
        }

        $assignments = $query->latest()->paginate(15)->through(function (StudentInstallment $row) {
            $en = $row->enrollment;
            $csg = $en ? $en->classSectionGroup : null;
            $session = $csg && $csg->classSection && $csg->classSection->academicSession
                ? $csg->classSection->academicSession->name : '—';
            $class = $csg && $csg->classSection && $csg->classSection->class
                ? $csg->classSection->class->name : '—';
            $section = $csg && $csg->classSection && $csg->classSection->section
                ? $csg->classSection->section->name : '—';

            $schedules = $row->schedules->map(fn ($s) => [
                'id' => $s->id,
                'installment_no' => $s->installment_no,
                'amount' => (float) $s->amount,
                'billing_month' => $s->billing_month,
                'due_date' => $s->due_date?->format('Y-m-d'),
                'invoice_id' => $s->invoice_id,
                'invoice_no' => $s->invoice?->invoice_no,
                'invoiced' => $s->invoice_id !== null,
            ])->values();

            $invoicedCount = $schedules->where('invoiced', true)->count();

            return [
                'id' => $row->id,
                'student_enrollment_id' => $row->student_enrollment_id,
                'installment_plan_id' => $row->installment_plan_id,
                'total_amount' => $row->total_amount,
                'start_billing_month' => $row->start_billing_month,
                'enrollment_label' => $en ? $this->enrollmentLabel($en) : '—',
                'session' => $session,
                'class' => $class,
                'section' => $section,
                'class_section_group_id' => $en ? $en->class_section_group_id : null,
                'installment_plan' => $row->installmentPlan ? [
                    'id' => $row->installmentPlan->id,
                    'name' => $row->installmentPlan->name,
                    'number_of_installments' => $row->installmentPlan->number_of_installments,
                ] : null,
                'schedules' => $schedules,
                'invoiced_count' => $invoicedCount,
                'schedule_count' => $schedules->count(),
            ];
        });

        $classSectionGroups = ClassSectionGroup::with([
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'subjectGroup',
        ])->get()->map(fn (ClassSectionGroup $g) => $this->formatClassSectionGroup($g));

        $enrollments = StudentEnrollment::with([
            'student',
            'classSectionGroup.classSection.academicSession',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
        ])->get()->map(function (StudentEnrollment $en) {
            return [
                'id' => (int) $en->id,
                'name' => $this->enrollmentLabel($en),
                'class_section_group_id' => (int) $en->class_section_group_id,
            ];
        });

        $installmentPlans = InstallmentPlan::orderBy('number_of_installments')->get(['id', 'name', 'number_of_installments']);

        return Inertia::render('dashboard/fee/StudentInstallments', [
            'assignments' => $assignments,
            'classSectionGroups' => $classSectionGroups,
            'enrollments' => $enrollments,
            'installmentPlans' => $installmentPlans,
            'filterInstallmentPlanId' => $request->get('installment_plan_id', ''),
            'filterClassSectionGroupId' => $request->get('class_section_group_id', ''),
            'defaultBillingMonth' => now()->format('Y-m'),
        ]);
    }

    /**
     * Assign an installment plan to a student enrollment and build schedule.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'student_enrollment_id' => 'required|exists:student_enrollments,id',
            'installment_plan_id' => 'required|exists:installment_plans,id',
            'total_amount' => 'required|numeric|min:0',
            'start_billing_month' => 'required|date_format:Y-m',
        ], [
            'student_enrollment_id.required' => 'Please select a student enrollment.',
            'installment_plan_id.required' => 'Please select an installment plan.',
            'total_amount.required' => 'Total amount is required.',
            'start_billing_month.required' => 'Start billing month is required.',
        ]);

        try {
            $this->installmentService->assignPlan(
                (int) $validated['student_enrollment_id'],
                (int) $validated['installment_plan_id'],
                (float) $validated['total_amount'],
                $validated['start_billing_month']
            );
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        return back()->with('success', 'Installment plan assigned and schedule created. Use “Generate due invoices” or monthly auto job.');
    }

    /**
     * Generate invoices for due installment schedules.
     */
    public function generate(Request $request)
    {
        $validated = $request->validate([
            'billing_month' => 'nullable|date_format:Y-m',
        ]);

        $billingMonth = $validated['billing_month'] ?? null;
        $result = $this->installmentService->generateDueInvoices($billingMonth);

        $message = sprintf(
            'Installment invoices — created: %d, skipped: %d.',
            $result['created'],
            $result['skipped']
        );
        if (! empty($result['schedules_built'])) {
            $message .= ' Built schedules for '.$result['schedules_built'].' old assignment(s).';
        }

        if ($result['created'] === 0 && empty($result['errors'])) {
            return back()->with(
                'error',
                $message.' No pending installment for this month. Open Schedule to check months, or assign with Start month again.'
            );
        }

        if (! empty($result['errors'])) {
            $first = $result['errors'][0]['message'] ?? 'Some invoices failed.';

            return back()->with('error', $message.' First error: '.$first);
        }

        return back()->with('success', $message.' Open Invoices to download PDF.');
    }

    /**
     * Remove a student installment assignment (blocked if any installment already invoiced).
     */
    public function destroy(StudentInstallment $studentInstallment)
    {
        if ($studentInstallment->schedules()->whereNotNull('invoice_id')->exists()) {
            return back()->with('error', 'Cannot remove assignment: one or more installments already have invoices.');
        }

        $studentInstallment->delete();

        return back()->with('success', 'Assignment removed.');
    }
}
