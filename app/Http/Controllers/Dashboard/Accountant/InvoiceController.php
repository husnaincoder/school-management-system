<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\ClassFeeStructure;
use App\Models\ClassSectionGroup;
use App\Models\FeeType;
use App\Models\Invoice;
use App\Models\StudentEnrollment;
use App\Services\Fee\AutoInvoiceService;
use App\Services\Fee\InvoiceService;
use App\Services\Setting\SystemSettingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;
use InvalidArgumentException;

class InvoiceController extends Controller
{
    public function __construct(
        protected InvoiceService $invoiceService,
        protected AutoInvoiceService $autoInvoiceService,
        protected SystemSettingService $settings
    ) {}

    /**
     * Format class section group for display.
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
        $name = $parts ? implode(' · ', $parts) : 'Group #' . $group->id;
        return ['id' => (int) $group->id, 'name' => $name];
    }

    /**
     * Enrollment label (student name + roll).
     */
    private function enrollmentLabel(StudentEnrollment $en): string
    {
        $student = $en->student;
        $label = $student ? trim(($student->first_name ?? '') . ' ' . ($student->last_name ?? '')) : '-';
        if ($en->roll_number !== null && $en->roll_number !== '') {
            $label .= ' (Roll: ' . $en->roll_number . ')';
        }
        return $label;
    }

    /**
     * List invoices with filters.
     */
    public function index(Request $request)
    {
        $query = Invoice::with([
            'enrollment.student',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
        ]);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('class_section_group_id')) {
            $query->where('class_section_group_id', $request->class_section_group_id);
        }

        $invoices = $query->latest('issue_date')->paginate(15)->through(function (Invoice $inv) {
            $en = $inv->enrollment;
            $csg = $en ? $en->classSectionGroup : null;
            $session = $csg && $csg->classSection && $csg->classSection->academicSession
                ? $csg->classSection->academicSession->name : '—';
            $class = $csg && $csg->classSection && $csg->classSection->class
                ? $csg->classSection->class->name : '—';
            $section = $csg && $csg->classSection && $csg->classSection->section
                ? $csg->classSection->section->name : '—';
            return [
                'id' => $inv->id,
                'invoice_no' => $inv->invoice_no,
                'student_enrollment_id' => $inv->student_enrollment_id,
                'class_section_group_id' => $inv->class_section_group_id,
                'issue_date' => $inv->issue_date?->format('Y-m-d'),
                'due_date' => $inv->due_date?->format('Y-m-d'),
                'total_amount' => $inv->total_amount,
                'discount_amount' => $inv->discount_amount,
                'fine_amount' => $inv->fine_amount,
                'paid_amount' => $inv->paid_amount,
                'balance' => $inv->balance,
                'status' => $inv->status,
                'enrollment_label' => $en ? $this->enrollmentLabel($en) : '—',
                'session' => $session,
                'class' => $class,
                'section' => $section,
            ];
        });

        $classSectionGroups = ClassSectionGroup::with([
            'classSection.academicSession',
            'classSection.class',
            'classSection.section',
            'subjectGroup',
        ])->get()->map(fn (ClassSectionGroup $g) => $this->formatClassSectionGroup($g));

        return Inertia::render('dashboard/fee/Invoices', [
            'invoices' => $invoices,
            'classSectionGroups' => $classSectionGroups,
            'filterStatus' => $request->get('status', ''),
            'filterClassSectionGroupId' => $request->get('class_section_group_id', ''),
        ]);
    }

    /**
     * Show create form with class section groups, enrollments, and fee structures.
     * Billing month controls which Over Time Charges are included in the quote
     * (only charges dated in that month are added; other months have no overtime).
     */
    public function create(Request $request)
    {
        $billingMonth = $request->input('billing_month', now()->format('Y-m'));
        if (! is_string($billingMonth) || ! preg_match('/^\d{4}-\d{2}$/', $billingMonth)) {
            $billingMonth = now()->format('Y-m');
        }

        $periodStart = Carbon::parse($billingMonth.'-01')->startOfMonth();
        $periodEnd = $periodStart->copy()->endOfMonth();

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
            'studentScholarShips.scholarship',
        ])
            ->where('status', 'active')
            ->orderBy('roll_number')
            ->get()
            ->map(function (StudentEnrollment $en) use ($periodStart, $periodEnd) {
                $quote = $this->autoInvoiceService->quoteEnrollment($en, $periodStart, $periodEnd);
                $overtimeTotal = collect($quote['lines'] ?? [])
                    ->where('source', 'overtime')
                    ->sum('amount');
                $previousBalanceTotal = (float) ($quote['previous_balance_total'] ?? 0);

                return [
                    'id' => (int) $en->id,
                    'name' => $this->enrollmentLabel($en),
                    'class_section_group_id' => (int) $en->class_section_group_id,
                    'quote' => $quote,
                    'overtime_total' => round((float) $overtimeTotal, 2),
                    'previous_balance_total' => round($previousBalanceTotal, 2),
                ];
            });

        $feeStructures = ClassFeeStructure::with('feeType')
            ->orderBy('class_section_group_id')
            ->get()
            ->map(fn (ClassFeeStructure $row) => [
                'id' => (int) $row->id,
                'class_section_group_id' => (int) $row->class_section_group_id,
                'fee_type_id' => (int) $row->fee_type_id,
                'fee_type_name' => $row->feeType?->name ?? 'Fee',
                'amount' => round((float) $row->amount, 2),
            ])
            ->values();

        return Inertia::render('dashboard/fee/InvoiceCreate', [
            'classSectionGroups' => $classSectionGroups,
            'enrollments' => $enrollments,
            'feeStructures' => $feeStructures,
            'billingMonth' => $billingMonth,
        ]);
    }

    /**
     * Store invoice(s) for one or more students using class fees + scholarships.
     */
    public function store(Request $request)
    {
        $this->authorize('create', Invoice::class);

        $validated = $request->validate([
            'student_enrollment_ids' => 'required|array|min:1',
            'student_enrollment_ids.*' => 'integer|exists:student_enrollments,id',
            'billing_month' => 'required|date_format:Y-m',
            'issue_date' => 'required|date',
            'due_date' => 'required|date|after_or_equal:issue_date',
            'fine_amount' => 'nullable|numeric|min:0',
        ], [
            'student_enrollment_ids.required' => 'Please select at least one student.',
            'student_enrollment_ids.min' => 'Please select at least one student.',
            'billing_month.required' => 'Billing month is required (used for overtime charges).',
            'issue_date.required' => 'Issue date is required.',
            'due_date.required' => 'Due date is required.',
        ]);

        $enrollmentIds = array_values(array_unique(array_map('intval', $validated['student_enrollment_ids'])));
        $enrollments = StudentEnrollment::with([
            'student',
            'studentScholarShips.scholarship',
        ])->whereIn('id', $enrollmentIds)->get();

        if ($enrollments->count() !== count($enrollmentIds)) {
            return back()->with('error', 'One or more selected students were not found.');
        }

        $fine = (float) ($validated['fine_amount'] ?? 0);
        $billingMonth = $validated['billing_month'];
        $created = 0;
        $createdIds = [];
        $skipped = [];

        try {
            foreach ($enrollments as $enrollment) {
                $invoice = $this->autoInvoiceService->createQuotedInvoice(
                    $enrollment,
                    $validated['issue_date'],
                    $validated['due_date'],
                    $fine,
                    $billingMonth
                );

                if (! $invoice) {
                    $skipped[] = $this->enrollmentLabel($enrollment);
                    continue;
                }

                $createdIds[] = (int) $invoice->id;
                $created++;
            }
        } catch (InvalidArgumentException $e) {
            return back()->with('error', $e->getMessage());
        }

        if ($created === 0) {
            $hint = $skipped
                ? ' No class fee / optional fee found for: '.implode(', ', $skipped).'.'
                : '';

            return back()->with('error', 'No invoices created. Add Class Fee Structures for this group first.'.$hint);
        }

        $message = $created === 1
            ? 'Invoice created successfully (fees + overtime + previous balance for '.$billingMonth.' + discounts applied).'
            : $created.' invoices created successfully (fees + overtime + previous balance for '.$billingMonth.' + discounts applied).';

        if ($skipped) {
            $message .= ' Skipped (no fees): '.implode(', ', $skipped).'.';
        }

        return redirect()->route('invoices.index')->with([
            'success' => $message,
            'download_invoice_ids' => $createdIds,
        ]);
    }

    /**
     * Soft-delete an invoice (and its related items / discounts / payments / refunds).
     */
    public function destroy(Invoice $invoice)
    {
        $this->authorize('delete', $invoice);

        $invoiceNo = $invoice->invoice_no;
        $this->invoiceService->deleteInvoice($invoice);

        return back()->with('success', "Invoice {$invoiceNo} deleted.");
    }

    /**
     * Soft-delete multiple invoices.
     */
    public function destroyBulk(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $validated = $request->validate([
            'ids' => 'required|array|min:1',
            'ids.*' => 'integer|exists:invoices,id',
        ]);

        $ids = array_values(array_unique(array_map('intval', $validated['ids'])));
        $invoices = Invoice::whereIn('id', $ids)->get();
        $deleted = 0;

        foreach ($invoices as $invoice) {
            if (! $request->user()->can('delete', $invoice)) {
                continue;
            }
            $this->invoiceService->deleteInvoice($invoice);
            $deleted++;
        }

        if ($deleted === 0) {
            return back()->with('error', 'No invoices were deleted.');
        }

        return back()->with('success', $deleted === 1
            ? '1 invoice deleted.'
            : "{$deleted} invoices deleted.");
    }

    /**
     * Manually update or remove late fine on an invoice.
     * Sets fine_manual so automatic late-fine job will not overwrite it.
     */
    public function updateFine(Request $request, Invoice $invoice)
    {
        $this->authorize('update', $invoice);

        $validated = $request->validate([
            'fine_amount' => 'required|numeric|min:0',
            'resume_auto' => 'sometimes|boolean',
        ]);

        $resumeAuto = $request->boolean('resume_auto');
        $this->invoiceService->updateFineAmount(
            $invoice,
            (float) $validated['fine_amount'],
            ! $resumeAuto
        );

        $message = ((float) $validated['fine_amount']) <= 0
            ? 'Fine removed from invoice.'
            : 'Fine updated successfully.';

        if ($resumeAuto) {
            $message .= ' Auto late fine re-enabled for this invoice.';
        }

        return back()->with('success', $message);
    }

    /**
     * Show single invoice.
     */
    public function show(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $invoice->load([
            'enrollment.student',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
            'items.feeType',
            'discounts',
            'payments',
            'refunds',
        ]);

        $en = $invoice->enrollment;
        $csg = $en?->classSectionGroup;
        $session = $csg && $csg->classSection && $csg->classSection->academicSession
            ? $csg->classSection->academicSession->name : '—';
        $class = $csg && $csg->classSection && $csg->classSection->class
            ? $csg->classSection->class->name : '—';
        $section = $csg && $csg->classSection && $csg->classSection->section
            ? $csg->classSection->section->name : '—';

        $user = request()->user();
        $backHref = $user->hasRole('accountant') || $user->hasRole('admin') || $user->hasRole('super_admin')
            ? route('invoices.index')
            : ($user->hasRole('parent') ? route('parent.fee') : route('student.fees'));

        return Inertia::render('dashboard/fee/InvoiceShow', [
            'backHref' => $backHref,
            'invoice' => [
                'id' => $invoice->id,
                'invoice_no' => $invoice->invoice_no,
                'issue_date' => $invoice->issue_date?->format('Y-m-d'),
                'due_date' => $invoice->due_date?->format('Y-m-d'),
                'total_amount' => $invoice->total_amount,
                'discount_amount' => $invoice->discount_amount,
                'fine_amount' => $invoice->fine_amount,
                'fine_manual' => (bool) $invoice->fine_manual,
                'paid_amount' => $invoice->paid_amount,
                'balance' => $invoice->balance,
                'status' => $invoice->status,
                'enrollment_label' => $en ? $this->enrollmentLabel($en) : '—',
                'session' => $session,
                'class' => $class,
                'section' => $section,
                'items' => $invoice->items->map(fn ($i) => [
                    'id' => $i->id,
                    'fee_type_id' => $i->fee_type_id,
                    'fee_type' => $i->feeType ? ['id' => $i->feeType->id, 'name' => $i->feeType->name] : null,
                    'description' => $i->description,
                    'amount' => $i->amount,
                ]),
                'discounts' => $invoice->discounts->map(fn ($d) => [
                    'id' => $d->id,
                    'type' => $d->type,
                    'value' => $d->value,
                    'calculated_amount' => $d->calculated_amount,
                ]),
                'payments' => $invoice->payments->map(fn ($p) => [
                    'id' => $p->id,
                    'amount' => $p->amount,
                    'method' => $p->method,
                    'transaction_id' => $p->transaction_id,
                    'payment_date' => $p->payment_date?->format('Y-m-d'),
                ]),
                'refunds' => $invoice->refunds->map(fn ($r) => [
                    'id' => $r->id,
                    'amount' => $r->amount,
                    'reason' => $r->reason,
                    'created_at' => $r->created_at?->toIso8601String(),
                ]),
            ],
            'feeTypes' => FeeType::orderBy('name')->get(['id', 'name']),
        ]);
    }

    /**
     * Download single invoice as PDF (School Copy + Student Copy fee voucher).
     */
    public function pdf(Invoice $invoice)
    {
        $this->authorize('view', $invoice);

        $payload = $this->feeVoucherPayload($invoice);
        $pdf = Pdf::loadView('pdf.invoice', $payload)->setPaper('a4', 'landscape');

        return $pdf->download('fee-voucher-' . $invoice->invoice_no . '.pdf');
    }

    /**
     * Download multiple fee vouchers (one page per invoice) as a single PDF.
     * Query: ?ids[]=1&ids[]=2
     */
    public function feeSlips(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $ids = $request->input('ids', []);
        if (is_string($ids)) {
            $ids = array_filter(array_map('intval', explode(',', $ids)));
        } else {
            $ids = array_values(array_filter(array_map('intval', (array) $ids)));
        }

        if ($ids === []) {
            return back()->with('error', 'No invoices selected for fee slips.');
        }

        $invoices = Invoice::with([
            'enrollment.student.user',
            'enrollment.student.parent.user',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
            'items.feeType',
            'discounts',
            'payments',
        ])
            ->whereIn('id', $ids)
            ->get()
            ->sortBy(fn (Invoice $invoice) => array_search((int) $invoice->id, $ids, true))
            ->values();

        if ($invoices->isEmpty()) {
            return back()->with('error', 'No invoices found for fee slips.');
        }

        $pages = $invoices->map(fn (Invoice $invoice) => $this->feeVoucherPayload($invoice))->all();

        $pdf = Pdf::loadView('pdf.fee-slips', ['pages' => $pages])->setPaper('a4', 'landscape');
        $filename = 'fee-slips-'.now()->format('Y-m-d-His').'.pdf';

        return $pdf->download($filename);
    }

    /**
     * @return array<string, mixed>
     */
    private function feeVoucherPayload(Invoice $invoice): array
    {
        $invoice->loadMissing([
            'enrollment.student.user',
            'enrollment.student.parent.user',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
            'items.feeType',
            'discounts',
            'payments',
        ]);

        $en = $invoice->enrollment;
        $student = $en?->student;
        $csg = $en?->classSectionGroup;
        $class = $csg && $csg->classSection && $csg->classSection->class
            ? $csg->classSection->class->name : '—';
        $section = $csg && $csg->classSection && $csg->classSection->section
            ? $csg->classSection->section->name : '—';

        $studentName = $student?->user?->name
            ?: trim(($student?->first_name ?? '') . ' ' . ($student?->last_name ?? ''));
        $studentName = $studentName !== '' ? $studentName : '—';

        $parent = $student?->parent;
        $relation = strtolower((string) ($parent?->relation_with_student ?? ''));
        if ($relation === 'mother') {
            $parentName = $parent?->spouse_name ?: ($parent?->user?->name ?? '—');
        } else {
            $parentName = $parent?->user?->name ?: ($parent?->spouse_name ?? '—');
        }
        $parentName = $parentName !== '' ? $parentName : '—';

        $admissionNo = $student?->admission_number ?: '—';

        $dueMonth = '—';
        if ($invoice->billing_month) {
            try {
                $dueMonth = Carbon::createFromFormat('Y-m', $invoice->billing_month)->format('F - Y');
            } catch (\Throwable) {
                $dueMonth = $invoice->billing_month;
            }
        } elseif ($invoice->due_date) {
            $dueMonth = $invoice->due_date->format('F - Y');
        }

        $dueDate = $invoice->due_date?->format('d M Y') ?? '—';
        $validTill = $invoice->due_date
            ? $invoice->due_date->copy()->endOfMonth()->format('d, F, Y')
            : '—';

        $pdfBranding = $this->settings->getPdfBranding();

        return [
            'invoice' => $invoice,
            'studentName' => $studentName,
            'parentName' => $parentName,
            'class' => $class,
            'section' => $section,
            'admissionNo' => $admissionNo,
            'dueMonth' => $dueMonth,
            'dueDate' => $dueDate,
            'validTill' => $validTill,
            'schoolName' => $pdfBranding['school_name'],
            'logoPath' => $pdfBranding['logo_src'] ?? $pdfBranding['logo_path'],
        ];
    }
}
