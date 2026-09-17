<?php

namespace App\Services\Fee;

use App\Models\SiblingDiscount;
use App\Models\Student;
use App\Models\StudentEnrollment;

class ScholarshipService
{
    /**
     * Total scholarship discount amount for an enrollment (from assigned scholarships).
     * Given a subtotal (e.g. sum of fee items), returns the total discount from percentage + fixed scholarships.
     */
    public function getDiscountForEnrollment(StudentEnrollment $enrollment, float $subtotal): float
    {
        $assignments = $enrollment->studentScholarShips()->with('scholarship')->get();
        $total = 0.0;
        foreach ($assignments as $ass) {
            $sch = $ass->scholarship;
            if (!$sch) {
                continue;
            }
            if ($sch->type === 'percentage') {
                $total += $subtotal * ((float) $sch->value / 100);
            } else {
                $total += (float) $sch->value;
            }
        }
        return round($total, 2);
    }

    /**
     * Count actively enrolled students under the same parent (includes current student).
     */
    public function countActivelyEnrolledSiblings(StudentEnrollment $enrollment): int
    {
        $student = $enrollment->relationLoaded('student')
            ? $enrollment->student
            : $enrollment->student()->first();

        if (! $student || ! $student->parent_id) {
            return 0;
        }

        return Student::query()
            ->where('parent_id', $student->parent_id)
            ->whereHas('enrollments', function ($q) {
                $q->where('status', 'active');
            })
            ->count();
    }

    /**
     * Highest sibling discount % configured by admin, or 0 when none.
     */
    public function configuredSiblingDiscountPercentage(): float
    {
        $discount = SiblingDiscount::query()->orderByDesc('percentage')->first();

        return $discount ? (float) $discount->percentage : 0.0;
    }

    /**
     * Whether admin marked this student as eligible for sibling discount.
     */
    public function isStudentMarkedForSiblingDiscount(StudentEnrollment $enrollment): bool
    {
        $student = $enrollment->relationLoaded('student')
            ? $enrollment->student
            : $enrollment->student()->first();

        return (bool) ($student?->sibling_discount_eligible);
    }

    /**
     * Sibling discount percentage for an enrollment.
     * Applies only when:
     * - admin configured a % rule
     * - this student is marked eligible (checkbox on student)
     * - 2+ siblings are actively studying under the same parent
     */
    public function getSiblingDiscountPercentage(StudentEnrollment $enrollment): float
    {
        if (! $this->isStudentMarkedForSiblingDiscount($enrollment)) {
            return 0.0;
        }

        $siblingCount = $this->countActivelyEnrolledSiblings($enrollment);
        if ($siblingCount < 2) {
            return 0.0;
        }

        return $this->configuredSiblingDiscountPercentage();
    }

    /**
     * Sibling discount amount for a subtotal.
     */
    public function getSiblingDiscountAmount(StudentEnrollment $enrollment, float $subtotal): float
    {
        $pct = $this->getSiblingDiscountPercentage($enrollment);

        return round($subtotal * ($pct / 100), 2);
    }

    /**
     * Sibling discount details for invoice preview.
     *
     * @return array{
     *   eligible: bool,
     *   sibling_count: int,
     *   percentage: float,
     *   amount: float,
     *   label: string
     * }
     */
    public function siblingDiscountDetails(StudentEnrollment $enrollment, float $subtotal): array
    {
        $siblingCount = $this->countActivelyEnrolledSiblings($enrollment);
        $configuredPct = $this->configuredSiblingDiscountPercentage();
        $marked = $this->isStudentMarkedForSiblingDiscount($enrollment);
        $percentage = ($marked && $siblingCount >= 2 && $configuredPct > 0) ? $configuredPct : 0.0;
        $amount = round($subtotal * ($percentage / 100), 2);
        $eligible = $percentage > 0 && $amount > 0;

        if ($configuredPct <= 0) {
            $label = 'No sibling discount rule configured';
        } elseif ($siblingCount < 2) {
            $label = 'No sibling currently studying under the same parent';
        } elseif (! $marked) {
            $label = 'Sibling discount not enabled for this student';
        } else {
            $label = sprintf('Sibling discount %.2f%% (%d siblings enrolled)', $percentage, $siblingCount);
        }

        return [
            'eligible' => $eligible,
            'sibling_count' => $siblingCount,
            'percentage' => $percentage,
            'amount' => $amount,
            'label' => $label,
        ];
    }

    /**
     * Assigned scholarships for display / invoice preview.
     *
     * @return list<array{name: string, type: string, value: float, label: string}>
     */
    public function listForEnrollment(StudentEnrollment $enrollment): array
    {
        $assignments = $enrollment->studentScholarShips()->with('scholarship')->get();
        $out = [];

        foreach ($assignments as $ass) {
            $sch = $ass->scholarship;
            if (! $sch) {
                continue;
            }

            $value = (float) $sch->value;
            $label = $sch->type === 'percentage'
                ? sprintf('%s (%.2f%%)', $sch->name, $value)
                : sprintf('%s (%.2f fixed)', $sch->name, $value);

            $out[] = [
                'name' => (string) $sch->name,
                'type' => (string) $sch->type,
                'value' => $value,
                'label' => $label,
            ];
        }

        return $out;
    }
}
