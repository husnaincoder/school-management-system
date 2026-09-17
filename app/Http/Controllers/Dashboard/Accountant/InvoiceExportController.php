<?php

namespace App\Http\Controllers\Dashboard\Accountant;

use App\Http\Controllers\Controller;
use App\Models\Invoice;
use App\Services\Setting\SystemSettingService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class InvoiceExportController extends Controller
{
    public function __construct(
        protected SystemSettingService $settings
    ) {}

    /**
     * Bulk export invoices as one PDF (one invoice per page).
     */
    public function exportPdf(Request $request)
    {
        $this->authorize('viewAny', Invoice::class);

        $query = Invoice::with([
            'enrollment.student',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
            'items.feeType',
            'discounts',
            'payments',
        ]);

        $ids = $request->input('ids', []);
        $ids = is_array($ids) ? array_filter(array_map('intval', $ids)) : [];

        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        } else {
            if ($request->filled('class_section_group_id')) {
                $query->where('class_section_group_id', $request->class_section_group_id);
            }
            if ($request->filled('billing_month')) {
                $query->where('billing_month', $request->billing_month);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
        }

        $invoices = $query->latest('issue_date')->limit(500)->get();

        if ($invoices->isEmpty()) {
            return back()->with('error', 'No invoices match the filters.');
        }

        $pdfBranding = $this->settings->getPdfBranding();
        $logoPath = $pdfBranding['logo_path'];
        $schoolName = $pdfBranding['school_name'];
        $pages = $invoices->map(function (Invoice $invoice) use ($logoPath, $schoolName) {
            $en = $invoice->enrollment;
            $csg = $en?->classSectionGroup;
            $session = $csg && $csg->classSection && $csg->classSection->academicSession
                ? $csg->classSection->academicSession->name : '—';
            $class = $csg && $csg->classSection && $csg->classSection->class
                ? $csg->classSection->class->name : '—';
            $section = $csg && $csg->classSection && $csg->classSection->section
                ? $csg->classSection->section->name : '—';
            $label = $en && $en->student
                ? trim(($en->student->first_name ?? '') . ' ' . ($en->student->last_name ?? '')) . ($en->roll_number ? ' (Roll: ' . $en->roll_number . ')' : '')
                : '—';
            return compact('invoice', 'session', 'class', 'section', 'label', 'logoPath', 'schoolName');
        });

        $pdf = Pdf::loadView('pdf.invoices-bulk', ['pages' => $pages]);
        $filename = 'invoices-' . ($request->billing_month ?? now()->format('Y-m')) . '.pdf';

        return $pdf->download($filename);
    }

    /**
     * Export invoices to CSV (Excel-compatible) by Class Section Group / filters.
     */
    public function exportExcel(Request $request): StreamedResponse
    {
        $this->authorize('viewAny', Invoice::class);

        $query = Invoice::with([
            'enrollment.student',
            'enrollment.classSectionGroup.classSection.academicSession',
            'enrollment.classSectionGroup.classSection.class',
            'enrollment.classSectionGroup.classSection.section',
        ]);

        $ids = $request->input('ids', []);
        $ids = is_array($ids) ? array_filter(array_map('intval', $ids)) : [];

        if (! empty($ids)) {
            $query->whereIn('id', $ids);
        } else {
            if ($request->filled('class_section_group_id')) {
                $query->where('class_section_group_id', $request->class_section_group_id);
            }
            if ($request->filled('billing_month')) {
                $query->where('billing_month', $request->billing_month);
            }
            if ($request->filled('status')) {
                $query->where('status', $request->status);
            }
        }

        $invoices = $query->orderBy('class_section_group_id')->orderBy('issue_date')->limit(10000)->get();

        $filename = 'invoices-' . ($request->billing_month ?? now()->format('Y-m-d')) . '.csv';

        return Response::streamDownload(function () use ($invoices) {
            $out = fopen('php://output', 'w');
            fprintf($out, chr(0xEF) . chr(0xBB) . chr(0xBF)); // UTF-8 BOM for Excel
            fputcsv($out, [
                'Invoice No', 'Student', 'Roll', 'Session', 'Class', 'Section', 'Class Section Group',
                'Issue Date', 'Due Date', 'Total', 'Discount', 'Fine', 'Paid', 'Balance', 'Status', 'Billing Month',
            ]);

            foreach ($invoices as $inv) {
                $en = $inv->enrollment;
                $csg = $en?->classSectionGroup;
                $session = $csg && $csg->classSection && $csg->classSection->academicSession
                    ? $csg->classSection->academicSession->name : '';
                $class = $csg && $csg->classSection && $csg->classSection->class
                    ? $csg->classSection->class->name : '';
                $section = $csg && $csg->classSection && $csg->classSection->section
                    ? $csg->classSection->section->name : '';
                $groupLabel = $csg ? ($session . ' · ' . $class . ' · ' . $section) : '';
                $studentName = $en && $en->student
                    ? trim(($en->student->first_name ?? '') . ' ' . ($en->student->last_name ?? '')) : '';
                $roll = $en ? $en->roll_number : '';

                fputcsv($out, [
                    $inv->invoice_no,
                    $studentName,
                    $roll,
                    $session,
                    $class,
                    $section,
                    $groupLabel,
                    $inv->issue_date?->format('Y-m-d'),
                    $inv->due_date?->format('Y-m-d'),
                    $inv->total_amount,
                    $inv->discount_amount,
                    $inv->fine_amount,
                    $inv->paid_amount,
                    $inv->balance,
                    $inv->status,
                    $inv->billing_month ?? '',
                ]);
            }
            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv; charset=UTF-8',
        ]);
    }
}
