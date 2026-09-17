<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Services\Fee\FeeReportService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FeeReportController extends Controller
{
    public function __construct(
        protected FeeReportService $reportService
    ) {}

    public function index(Request $request)
    {
        $startDate = $request->get('start_date', now()->startOfMonth()->format('Y-m-d'));
        $endDate = $request->get('end_date', now()->format('Y-m-d'));
        $month = $request->get('month', now()->format('Y-m'));
        $classSectionGroupId = $request->get('class_section_group_id');

        $dailyCollection = $this->reportService->dailyCollection($endDate);
        $monthlyCollection = $this->reportService->monthlyCollection($month);
        $classWiseCollection = $this->reportService->classWiseCollection($startDate, $endDate);
        $defaulters = $this->reportService->defaultersList($classSectionGroupId);
        $fineReport = $this->reportService->fineReport($startDate, $endDate);
        $scholarshipReport = $this->reportService->scholarshipReport($startDate, $endDate);
        $incomeSummary = $this->reportService->incomeSummary($startDate, $endDate, true);

        return Inertia::render('dashboard/fee/FeeReports', [
            'dailyCollection' => $dailyCollection,
            'monthlyCollection' => $monthlyCollection,
            'classWiseCollection' => $classWiseCollection,
            'defaulters' => $defaulters->map(fn ($inv) => [
                'id' => $inv->id,
                'invoice_no' => $inv->invoice_no,
                'student_enrollment_id' => $inv->student_enrollment_id,
                'balance' => (float) $inv->balance,
                'due_date' => $inv->due_date?->format('Y-m-d'),
                'enrollment_label' => $inv->enrollment && $inv->enrollment->student ? trim(($inv->enrollment->student->first_name ?? '') . ' ' . ($inv->enrollment->student->last_name ?? '')) : '—',
            ]),
            'fineReport' => $fineReport,
            'scholarshipReport' => $scholarshipReport,
            'incomeSummary' => $incomeSummary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'month' => $month,
                'class_section_group_id' => $classSectionGroupId,
            ],
        ]);
    }
}
