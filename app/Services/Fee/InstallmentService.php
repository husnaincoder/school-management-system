<?php

namespace App\Services\Fee;

use App\Models\FeeType;
use App\Models\InstallmentPlan;
use App\Models\StudentEnrollment;
use App\Models\StudentInstallment;
use App\Models\StudentInstallmentSchedule;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use InvalidArgumentException;

class InstallmentService
{
    public function __construct(
        protected InvoiceService $invoiceService
    ) {}

    /**
     * Get assigned installment plan and total for an enrollment.
     */
    public function getAssignment(StudentEnrollment $enrollment): ?array
    {
        $si = StudentInstallment::with('installmentPlan')
            ->where('student_enrollment_id', $enrollment->id)
            ->first();
        if (! $si) {
            return null;
        }

        return [
            'installment_plan_id' => $si->installment_plan_id,
            'plan_name' => $si->installmentPlan?->name,
            'number_of_installments' => $si->installmentPlan?->number_of_installments,
            'total_amount' => (float) $si->total_amount,
            'start_billing_month' => $si->start_billing_month,
        ];
    }

    /**
     * Whether this enrollment has an installment schedule for the billing month.
     */
    public function hasScheduleForMonth(int $studentEnrollmentId, string $billingMonth): bool
    {
        return StudentInstallmentSchedule::query()
            ->where('billing_month', $billingMonth)
            ->whereHas('studentInstallment', function ($q) use ($studentEnrollmentId) {
                $q->where('student_enrollment_id', $studentEnrollmentId);
            })
            ->exists();
    }

    /**
     * Assign plan, build N schedule rows (amount split), return assignment.
     */
    public function assignPlan(
        int $studentEnrollmentId,
        int $installmentPlanId,
        float $totalAmount,
        string $startBillingMonth
    ): StudentInstallment {
        if (! preg_match('/^\d{4}-\d{2}$/', $startBillingMonth)) {
            throw new InvalidArgumentException('Start billing month must be YYYY-MM.');
        }

        if (StudentInstallment::where('student_enrollment_id', $studentEnrollmentId)->exists()) {
            throw new InvalidArgumentException('This student already has an installment plan assigned.');
        }

        $plan = InstallmentPlan::findOrFail($installmentPlanId);
        $n = max(1, (int) $plan->number_of_installments);
        $totalAmount = round(max(0, $totalAmount), 2);

        return DB::transaction(function () use ($studentEnrollmentId, $installmentPlanId, $totalAmount, $startBillingMonth, $n) {
            $assignment = StudentInstallment::create([
                'student_enrollment_id' => $studentEnrollmentId,
                'installment_plan_id' => $installmentPlanId,
                'total_amount' => $totalAmount,
                'start_billing_month' => $startBillingMonth,
            ]);

            $this->buildSchedules($assignment, $n, $totalAmount, $startBillingMonth);

            return $assignment->load(['installmentPlan', 'schedules']);
        });
    }

    /**
     * Split total into N schedule rows starting from billing month.
     */
    public function buildSchedules(
        StudentInstallment $assignment,
        int $numberOfInstallments,
        float $totalAmount,
        string $startBillingMonth
    ): void {
        $base = $numberOfInstallments > 0
            ? round($totalAmount / $numberOfInstallments, 2)
            : 0.0;
        $allocated = 0.0;
        $start = Carbon::parse($startBillingMonth.'-01')->startOfMonth();

        for ($i = 1; $i <= $numberOfInstallments; $i++) {
            $month = $start->copy()->addMonths($i - 1);
            $amount = $i === $numberOfInstallments
                ? round($totalAmount - $allocated, 2)
                : $base;
            $allocated = round($allocated + $amount, 2);

            StudentInstallmentSchedule::create([
                'student_installment_id' => $assignment->id,
                'installment_no' => $i,
                'amount' => $amount,
                'billing_month' => $month->format('Y-m'),
                'due_date' => $month->copy()->addDays(9)->toDateString(),
                'invoice_id' => null,
            ]);
        }
    }

    /**
     * Build missing schedules for legacy assignments (no schedule rows yet).
     */
    public function ensureSchedulesForAll(?string $defaultStartMonth = null): int
    {
        $defaultStartMonth = $defaultStartMonth ?: now()->format('Y-m');
        $built = 0;

        StudentInstallment::query()
            ->with(['installmentPlan', 'schedules'])
            ->whereDoesntHave('schedules')
            ->get()
            ->each(function (StudentInstallment $assignment) use ($defaultStartMonth, &$built) {
                if ($this->ensureSchedules($assignment, $defaultStartMonth)) {
                    $built++;
                }
            });

        return $built;
    }

    /**
     * Ensure one assignment has schedule rows. Returns true if schedules were created.
     */
    public function ensureSchedules(StudentInstallment $assignment, ?string $defaultStartMonth = null): bool
    {
        $assignment->loadMissing(['installmentPlan', 'schedules']);
        if ($assignment->schedules->isNotEmpty()) {
            return false;
        }

        $plan = $assignment->installmentPlan;
        $n = max(1, (int) ($plan?->number_of_installments ?? 1));
        $start = $assignment->start_billing_month;
        if (! $start || ! preg_match('/^\d{4}-\d{2}$/', $start)) {
            $start = $defaultStartMonth ?: now()->format('Y-m');
            $assignment->update(['start_billing_month' => $start]);
        }

        $this->buildSchedules(
            $assignment,
            $n,
            (float) $assignment->total_amount,
            $start
        );

        return true;
    }

    /**
     * Generate invoices for due installment schedules (optionally one billing month).
     *
     * @return array{created: int, skipped: int, schedules_built: int, errors: list<array{schedule_id?: int, message: string}>}
     */
    public function generateDueInvoices(?string $billingMonth = null): array
    {
        $schedulesBuilt = $this->ensureSchedulesForAll($billingMonth ?: now()->format('Y-m'));

        $query = StudentInstallmentSchedule::query()
            ->with([
                'studentInstallment.enrollment',
                'studentInstallment.installmentPlan',
            ])
            ->whereNull('invoice_id');

        if ($billingMonth) {
            $query->where('billing_month', $billingMonth);
        } else {
            // Default: current month and any overdue unpaid schedule months up to today
            $query->where('billing_month', '<=', now()->format('Y-m'));
        }

        $schedules = $query->orderBy('billing_month')->orderBy('installment_no')->get();
        $created = 0;
        $skipped = 0;
        $errors = [];

        foreach ($schedules as $schedule) {
            try {
                $invoice = $this->createInvoiceForSchedule($schedule);
                if ($invoice) {
                    $created++;
                } else {
                    $skipped++;
                }
            } catch (\Throwable $e) {
                Log::warning('Installment invoice failed for schedule '.$schedule->id.': '.$e->getMessage());
                $errors[] = ['schedule_id' => $schedule->id, 'message' => $e->getMessage()];
            }
        }

        return [
            'created' => $created,
            'skipped' => $skipped,
            'schedules_built' => $schedulesBuilt,
            'errors' => $errors,
        ];
    }

    /**
     * Create invoice for one schedule row if not already invoiced.
     */
    public function createInvoiceForSchedule(StudentInstallmentSchedule $schedule): ?\App\Models\Invoice
    {
        $schedule->loadMissing([
            'studentInstallment.enrollment',
            'studentInstallment.installmentPlan',
        ]);

        if ($schedule->invoice_id) {
            return null;
        }

        $assignment = $schedule->studentInstallment;
        $enrollment = $assignment?->enrollment;
        if (! $assignment || ! $enrollment) {
            throw new InvalidArgumentException('Installment assignment or enrollment missing.');
        }

        $amount = round((float) $schedule->amount, 2);
        if ($amount <= 0) {
            return null;
        }

        $billingMonth = $schedule->billing_month;
        if ($this->invoiceService->hasInvoiceForBillingMonth((int) $enrollment->id, $billingMonth)) {
            throw new InvalidArgumentException(
                'An invoice already exists for this student for billing period '.$billingMonth.'.'
            );
        }

        $planName = $assignment->installmentPlan?->name ?? 'Installment';
        $n = (int) ($assignment->installmentPlan?->number_of_installments ?? 0);
        $issueDate = Carbon::parse($billingMonth.'-01')->format('Y-m-d');
        $dueDate = $schedule->due_date
            ? $schedule->due_date->format('Y-m-d')
            : Carbon::parse($billingMonth.'-01')->addDays(9)->format('Y-m-d');

        $feeType = $this->installmentFeeType();
        $description = sprintf(
            '%s — Installment %d/%d (%s)',
            $planName,
            (int) $schedule->installment_no,
            max($n, (int) $schedule->installment_no),
            $billingMonth
        );

        return DB::transaction(function () use ($schedule, $enrollment, $amount, $issueDate, $dueDate, $billingMonth, $feeType, $description) {
            $schedule->refresh();
            if ($schedule->invoice_id) {
                return $schedule->invoice;
            }

            $invoice = $this->invoiceService->createInvoice(
                $enrollment,
                $issueDate,
                $dueDate,
                $amount,
                0,
                0,
                $billingMonth
            );

            $this->invoiceService->addItem(
                $invoice,
                (int) $feeType->id,
                $description,
                $amount
            );

            $schedule->update(['invoice_id' => $invoice->id]);

            return $invoice->fresh(['items']);
        });
    }

    protected function installmentFeeType(): FeeType
    {
        return FeeType::firstOrCreate(
            ['name' => 'Installment'],
            ['category' => 'monthly', 'is_refundable' => false]
        );
    }
}
