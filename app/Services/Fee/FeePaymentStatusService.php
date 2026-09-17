<?php

namespace App\Services\Fee;

use App\Models\AcademicSession;
use App\Models\ClassSection;
use App\Models\Invoice;
use App\Models\Payment;
use App\Models\StudentEnrollment;
use Carbon\Carbon;

class FeePaymentStatusService
{
    /**
     * Session → class → section cascade for filters.
     *
     * @return array<int, array{id:int,name:string,classes:array<int,array{id:int,name:string,sections:array<int,array{id:int,name:string}>}>}>
     */
    public function filterTree(): array
    {
        $sessions = AcademicSession::query()
            ->orderByDesc('start_date')
            ->get(['id', 'name']);

        $classSections = ClassSection::query()
            ->with(['class:id,name', 'section:id,name'])
            ->orderBy('academic_session_id')
            ->orderBy('class_id')
            ->get(['id', 'academic_session_id', 'class_id', 'section_id']);

        return $sessions->map(function (AcademicSession $session) use ($classSections) {
            $rows = $classSections->where('academic_session_id', $session->id)->values();
            $classIds = $rows->pluck('class_id')->unique()->filter()->values();

            $classes = $classIds->map(function ($classId) use ($rows) {
                $classId = (int) $classId;
                $className = $rows->firstWhere('class_id', $classId)?->class?->name ?? ('Class #'.$classId);
                $sectionRows = $rows->where('class_id', $classId)->values();

                $sections = $sectionRows
                    ->pluck('section_id')
                    ->filter(fn ($id) => $id !== null)
                    ->unique()
                    ->values()
                    ->map(function ($sectionId) use ($sectionRows) {
                        $sectionId = (int) $sectionId;
                        $sectionName = $sectionRows->firstWhere('section_id', $sectionId)?->section?->name
                            ?? ('Section #'.$sectionId);

                        return [
                            'id' => $sectionId,
                            'name' => $sectionName,
                        ];
                    })
                    ->values()
                    ->all();

                return [
                    'id' => $classId,
                    'name' => $className,
                    'sections' => $sections,
                ];
            })->values()->all();

            return [
                'id' => (int) $session->id,
                'name' => $session->name,
                'classes' => $classes,
            ];
        })->values()->all();
    }

    /**
     * Whole-school fee snapshot (independent of class filters).
     * Totals are net of scholarship + sibling discounts (overtime stays full).
     *
     * @return array<string, mixed>
     */
    public function schoolOverview(string $billingMonth): array
    {
        $month = Carbon::createFromFormat('Y-m', $billingMonth)->startOfMonth();
        $monthStart = $month->toDateString();
        $monthEnd = $month->copy()->endOfMonth()->toDateString();
        $monthLabel = $month->format('F Y');

        $allAgg = Invoice::query()
            ->selectRaw('
                COALESCE(SUM(total_amount), 0) as gross,
                COALESCE(SUM(discount_amount), 0) as discounts,
                COALESCE(SUM(fine_amount), 0) as fines,
                COALESCE(SUM(paid_amount), 0) as paid,
                COALESCE(SUM(balance), 0) as remaining
            ')
            ->first();

        $grossAll = (float) ($allAgg->gross ?? 0);
        $discountsAll = (float) ($allAgg->discounts ?? 0);
        $finesAll = (float) ($allAgg->fines ?? 0);
        $netAll = round($grossAll - $discountsAll + $finesAll, 2);
        $paidAll = (float) ($allAgg->paid ?? 0);
        $remainingAll = (float) ($allAgg->remaining ?? 0);

        $monthAgg = Invoice::query()
            ->where(function ($q) use ($billingMonth) {
                $q->where('billing_month', $billingMonth)
                    ->orWhere(function ($q2) use ($billingMonth) {
                        $q2->whereNull('billing_month')
                            ->whereRaw("DATE_FORMAT(issue_date, '%Y-%m') = ?", [$billingMonth]);
                    });
            })
            ->selectRaw('
                COALESCE(SUM(total_amount), 0) as gross,
                COALESCE(SUM(discount_amount), 0) as discounts,
                COALESCE(SUM(fine_amount), 0) as fines,
                COALESCE(SUM(paid_amount), 0) as paid,
                COALESCE(SUM(balance), 0) as remaining
            ')
            ->first();

        $monthGross = (float) ($monthAgg->gross ?? 0);
        $monthDiscounts = (float) ($monthAgg->discounts ?? 0);
        $monthFines = (float) ($monthAgg->fines ?? 0);
        $monthNet = round($monthGross - $monthDiscounts + $monthFines, 2);
        $monthInvoicePaid = (float) ($monthAgg->paid ?? 0);
        $monthRemaining = (float) ($monthAgg->remaining ?? 0);

        $monthCollected = (float) Payment::query()
            ->whereBetween('payment_date', [$monthStart, $monthEnd])
            ->sum('amount');

        return [
            'billing_month' => $billingMonth,
            'billing_month_label' => $monthLabel,
            // All-time
            'total_school_fee_gross' => $grossAll,
            'total_discounts' => $discountsAll,
            'total_school_fee' => $netAll,
            'total_school_paid' => $paidAll,
            'total_school_balance' => $remainingAll,
            // Current month (selected billing month)
            'month_billed_gross' => $monthGross,
            'month_discounts' => $monthDiscounts,
            'month_billed' => $monthNet,
            'month_invoice_paid' => $monthInvoicePaid,
            'month_collected' => $monthCollected,
            'month_remaining' => $monthRemaining,
            'collection_percent' => $monthNet > 0
                ? round(($monthInvoicePaid / $monthNet) * 100, 1)
                : 0.0,
        ];
    }

    /**
     * Students with fee paid/unpaid status for a billing month + class scope.
     *
     * @return array{rows: array<int, array<string, mixed>>, summary: array<string, int|float>, meta: array<string, mixed>}
     */
    public function report(
        string $billingMonth,
        ?int $academicSessionId = null,
        ?int $classId = null,
        ?int $sectionId = null,
        ?string $statusFilter = null
    ): array {
        $classSectionQuery = ClassSection::query()->with(['class:id,name', 'section:id,name', 'academicSession:id,name']);

        if ($academicSessionId) {
            $classSectionQuery->where('academic_session_id', $academicSessionId);
        }
        if ($classId) {
            $classSectionQuery->where('class_id', $classId);
        }
        if ($sectionId) {
            $classSectionQuery->where('section_id', $sectionId);
        }

        $classSections = $classSectionQuery->get();
        $classSectionIds = $classSections->pluck('id')->all();

        $meta = [
            'billing_month' => $billingMonth,
            'session_name' => $classSections->first()?->academicSession?->name ?? '—',
            'class_name' => $classSections->pluck('class.name')->unique()->filter()->implode(', ') ?: '—',
            'section_name' => $classSections->pluck('section.name')->unique()->filter()->implode(', ') ?: '—',
        ];

        if ($classSectionIds === []) {
            return [
                'rows' => [],
                'summary' => $this->emptySummary(),
                'meta' => $meta,
            ];
        }

        $enrollments = StudentEnrollment::query()
            ->with([
                'student.user:id,name',
                'student:id,user_id,first_name,last_name,admission_number',
                'classSectionGroup.classSection.class:id,name',
                'classSectionGroup.classSection.section:id,name',
                'classSectionGroup.classSection.academicSession:id,name',
            ])
            ->whereHas('classSectionGroup', function ($q) use ($classSectionIds) {
                $q->whereIn('class_section_id', $classSectionIds);
            })
            ->where(function ($q) {
                $q->whereNull('status')->orWhere('status', 'active');
            })
            ->orderBy('roll_number')
            ->get();

        $enrollmentIds = $enrollments->pluck('id')->all();

        // Match by billing_month tag, OR by issue_date month (covers mistagged / null billing_month).
        $invoices = Invoice::query()
            ->whereIn('student_enrollment_id', $enrollmentIds ?: [-1])
            ->where(function ($q) use ($billingMonth) {
                $q->where('billing_month', $billingMonth)
                    ->orWhere(function ($q2) use ($billingMonth) {
                        $q2->where(function ($q3) {
                            $q3->whereNull('billing_month')
                                ->orWhere('billing_month', '');
                        })->whereRaw("DATE_FORMAT(issue_date, '%Y-%m') = ?", [$billingMonth]);
                    })
                    ->orWhereRaw("DATE_FORMAT(issue_date, '%Y-%m') = ?", [$billingMonth]);
            })
            ->orderByDesc('id')
            ->get()
            ->groupBy('student_enrollment_id');

        $rows = [];
        foreach ($enrollments as $enrollment) {
            $student = $enrollment->student;
            $name = $student?->user?->name
                ?: trim(($student?->first_name ?? '').' '.($student?->last_name ?? ''));
            $name = $name !== '' ? $name : '—';

            $cs = $enrollment->classSectionGroup?->classSection;
            $studentInvoices = ($invoices->get($enrollment->id) ?? collect())->values();

            if ($studentInvoices->isNotEmpty()) {
                $totalAmount = (float) $studentInvoices->sum('total_amount');
                $discountAmount = (float) $studentInvoices->sum('discount_amount');
                $fineAmount = (float) $studentInvoices->sum('fine_amount');
                $paidAmount = (float) $studentInvoices->sum('paid_amount');
                $balance = (float) $studentInvoices->sum('balance');

                // Overall month status from combined balances (not a single invoice).
                if ($balance <= 0.009 && $paidAmount > 0) {
                    $status = 'paid';
                    $statusLabel = 'Paid';
                } elseif ($balance <= 0.009 && $totalAmount <= 0.009) {
                    $status = 'paid';
                    $statusLabel = 'Paid';
                } elseif ($paidAmount > 0 && $balance > 0) {
                    $status = 'partial';
                    $statusLabel = 'Partial';
                } else {
                    $status = 'unpaid';
                    $statusLabel = 'Unpaid';
                }

                $latest = $studentInvoices->first();
                $invoiceNos = $studentInvoices->pluck('invoice_no')->filter()->values()->all();
                $dueDates = $studentInvoices
                    ->map(fn (Invoice $inv) => $inv->due_date?->format('Y-m-d'))
                    ->filter()
                    ->values();

                $row = [
                    'enrollment_id' => (int) $enrollment->id,
                    'invoice_id' => $latest ? (int) $latest->id : null,
                    'invoice_no' => $invoiceNos !== [] ? implode(', ', $invoiceNos) : '—',
                    'invoice_count' => $studentInvoices->count(),
                    'student_name' => $name,
                    'roll_number' => $enrollment->roll_number ?: '—',
                    'admission_number' => $student?->admission_number ?: '—',
                    'class_name' => $cs?->class?->name ?? '—',
                    'section_name' => $cs?->section?->name ?? '—',
                    'total_amount' => $totalAmount,
                    'discount_amount' => $discountAmount,
                    'fine_amount' => $fineAmount,
                    'payable_amount' => round(max(0, $totalAmount - $discountAmount + $fineAmount), 2),
                    'paid_amount' => $paidAmount,
                    'balance' => $balance,
                    'due_date' => $dueDates->first(),
                    'status' => $status,
                    'status_label' => $statusLabel,
                ];
            } else {
                $row = [
                    'enrollment_id' => (int) $enrollment->id,
                    'invoice_id' => null,
                    'invoice_no' => '—',
                    'invoice_count' => 0,
                    'student_name' => $name,
                    'roll_number' => $enrollment->roll_number ?: '—',
                    'admission_number' => $student?->admission_number ?: '—',
                    'class_name' => $cs?->class?->name ?? '—',
                    'section_name' => $cs?->section?->name ?? '—',
                    'total_amount' => 0.0,
                    'discount_amount' => 0.0,
                    'fine_amount' => 0.0,
                    'payable_amount' => 0.0,
                    'paid_amount' => 0.0,
                    'balance' => 0.0,
                    'due_date' => null,
                    'status' => 'no_invoice',
                    'status_label' => 'No Invoice',
                ];
            }

            if ($statusFilter && $statusFilter !== 'all' && $row['status'] !== $statusFilter) {
                continue;
            }

            $rows[] = $row;
        }

        return [
            'rows' => $rows,
            'summary' => $this->summarize($rows),
            'meta' => $meta,
        ];
    }

    /**
     * @param  array<int, array<string, mixed>>  $rows
     * @return array<string, int|float>
     */
    private function summarize(array $rows): array
    {
        $summary = $this->emptySummary();
        $summary['total_students'] = count($rows);

        foreach ($rows as $row) {
            $status = $row['status'];
            if ($status === 'paid') {
                $summary['paid']++;
            } elseif ($status === 'partial') {
                $summary['partial']++;
            } elseif ($status === 'no_invoice') {
                $summary['no_invoice']++;
            } else {
                $summary['unpaid']++;
            }
            $summary['total_billed'] += (float) ($row['payable_amount'] ?? max(0, ($row['total_amount'] ?? 0) - ($row['discount_amount'] ?? 0) + ($row['fine_amount'] ?? 0)));
            $summary['total_discount'] += (float) ($row['discount_amount'] ?? 0);
            $summary['total_paid'] += (float) ($row['paid_amount'] ?? 0);
            $summary['total_balance'] += (float) ($row['balance'] ?? 0);
        }

        return $summary;
    }

    /**
     * @return array<string, int|float>
     */
    private function emptySummary(): array
    {
        return [
            'total_students' => 0,
            'paid' => 0,
            'unpaid' => 0,
            'partial' => 0,
            'no_invoice' => 0,
            'total_billed' => 0.0,
            'total_discount' => 0.0,
            'total_paid' => 0.0,
            'total_balance' => 0.0,
        ];
    }
}
