<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\Fee\AutoInvoiceService;
use App\Services\Fee\FeePaymentStatusService;
use App\Services\Setting\SystemSettingService;
use App\Support\PdfAssets;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\StreamedResponse;

class FeePaymentStatusController extends Controller
{
    public function __construct(
        protected FeePaymentStatusService $statusService,
        protected AutoInvoiceService $autoInvoiceService,
        protected SystemSettingService $settings
    ) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $filters = $this->validatedFilters($request);
        $hasScope = $filters['academic_session_id'] || $filters['class_id'] || $filters['section_id'];

        // Fix existing invoices: scholarship/sibling must not reduce overtime.
        $this->autoInvoiceService->repairBillingMonthDiscounts($filters['billing_month']);

        $statusFilter = ($filters['status'] ?? 'all') === 'all' ? null : $filters['status'];

        $report = $hasScope
            ? $this->statusService->report(
                $filters['billing_month'],
                $filters['academic_session_id'],
                $filters['class_id'],
                $filters['section_id'],
                $statusFilter
            )
            : [
                'rows' => [],
                'summary' => [
                    'total_students' => 0,
                    'paid' => 0,
                    'unpaid' => 0,
                    'partial' => 0,
                    'no_invoice' => 0,
                    'total_billed' => 0.0,
                    'total_paid' => 0.0,
                    'total_balance' => 0.0,
                ],
                'meta' => [
                    'billing_month' => $filters['billing_month'],
                    'session_name' => '—',
                    'class_name' => '—',
                    'section_name' => '—',
                ],
            ];

        return Inertia::render('dashboard/fee/FeePaymentStatus', [
            'filterTree' => $this->statusService->filterTree(),
            'filters' => $filters,
            'rows' => $report['rows'],
            'summary' => $report['summary'],
            'meta' => $report['meta'],
            'ready' => (bool) $hasScope,
            'schoolOverview' => $this->statusService->schoolOverview($filters['billing_month']),
        ]);
    }

    public function exportExcel(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Invoice::class);

        $filters = $this->validatedFilters($request);
        $statusFilter = ($filters['status'] ?? 'all') === 'all' ? null : $filters['status'];
        $report = $this->statusService->report(
            $filters['billing_month'],
            $filters['academic_session_id'],
            $filters['class_id'],
            $filters['section_id'],
            $statusFilter
        );

        $filename = 'fee-payment-status-'.$filters['billing_month'].'.csv';

        return Response::streamDownload(function () use ($report, $filters) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF).chr(0xBB).chr(0xBF));
            fputcsv($out, [
                'Billing Month',
                'Session',
                'Class',
                'Section',
                'Roll No',
                'Admission No',
                'Student',
                'Invoice No',
                'Total',
                'Discount',
                'Fine',
                'Paid',
                'Balance',
                'Due Date',
                'Status',
            ]);

            foreach ($report['rows'] as $row) {
                fputcsv($out, [
                    $filters['billing_month'],
                    $report['meta']['session_name'] ?? '',
                    $row['class_name'],
                    $row['section_name'],
                    $row['roll_number'],
                    $row['admission_number'],
                    $row['student_name'],
                    $row['invoice_no'],
                    number_format((float) $row['total_amount'], 2, '.', ''),
                    number_format((float) $row['discount_amount'], 2, '.', ''),
                    number_format((float) $row['fine_amount'], 2, '.', ''),
                    number_format((float) $row['paid_amount'], 2, '.', ''),
                    number_format((float) $row['balance'], 2, '.', ''),
                    $row['due_date'] ?? '',
                    $row['status_label'],
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }

    public function exportPdf(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $filters = $this->validatedFilters($request);
        $statusFilter = ($filters['status'] ?? 'all') === 'all' ? null : $filters['status'];
        $report = $this->statusService->report(
            $filters['billing_month'],
            $filters['academic_session_id'],
            $filters['class_id'],
            $filters['section_id'],
            $statusFilter
        );

        $branding = $this->settings->getPdfBranding();
        PdfAssets::boostResources();
        PdfAssets::ensureFontDirectory();

        $pdf = Pdf::loadView('pdf.fee-payment-status', [
            'rows' => $report['rows'],
            'summary' => $report['summary'],
            'meta' => $report['meta'],
            'filters' => $filters,
            'schoolName' => $branding['school_name'] ?? config('app.name', 'School'),
            'logoSrc' => $branding['logo_src'] ?? null,
        ])->setPaper('a4', 'landscape');

        return $pdf->download('fee-payment-status-'.$filters['billing_month'].'.pdf');
    }

    /**
     * @return array{billing_month:string,academic_session_id:?int,class_id:?int,section_id:?int,status:?string}
     */
    private function validatedFilters(Request $request): array
    {
        $validated = $request->validate([
            'billing_month' => 'nullable|date_format:Y-m',
            'academic_session_id' => 'nullable|integer',
            'class_id' => 'nullable|integer',
            'section_id' => 'nullable|integer',
            'status' => 'nullable|in:all,paid,unpaid,partial,no_invoice',
        ]);

        $status = $validated['status'] ?? 'all';
        if ($status === 'all') {
            $status = null;
        }

        return [
            'billing_month' => $validated['billing_month'] ?? now()->format('Y-m'),
            'academic_session_id' => isset($validated['academic_session_id']) ? (int) $validated['academic_session_id'] : null,
            'class_id' => isset($validated['class_id']) ? (int) $validated['class_id'] : null,
            'section_id' => isset($validated['section_id']) ? (int) $validated['section_id'] : null,
            'status' => $validated['status'] ?? 'all',
        ];
    }
}
