<?php

namespace App\Services\Attendance;

use App\Models\AttendanceSession;
use App\Models\StudentAttendance;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceExportService
{
    public function __construct(
        protected AttendanceReportService $reportService
    ) {}

    /**
     * Export daily/monthly attendance to CSV (Excel-compatible).
     */
    public function exportToCsv(
        int $academicSessionId,
        string $dateFrom,
        string $dateTo,
        ?int $classSectionGroupId = null
    ): StreamedResponse {
        $sessions = AttendanceSession::with([
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'studentAttendances.studentEnrollment.student.user',
        ])
            ->where('academic_session_id', $academicSessionId)
            ->where('type', 'student')
            ->whereBetween('attendance_date', [$dateFrom, $dateTo]);

        if ($classSectionGroupId !== null) {
            $sessions->where('class_section_group_id', $classSectionGroupId);
        }

        $sessions = $sessions->orderBy('attendance_date')->orderBy('class_section_group_id')->get();

        $headers = [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => 'attachment; filename="attendance-' . $dateFrom . '-to-' . $dateTo . '.csv"',
        ];

        return response()->streamDownload(function () use ($sessions) {
            $out = fopen('php://output', 'w');
            // UTF-8 BOM so Excel opens CSV with correct encoding
            fwrite($out, "\xEF\xBB\xBF");
            fputcsv($out, ['Date', 'Class Section Group', 'Roll No', 'Student Name', 'Status', 'Check In', 'Check Out', 'Remarks']);

            foreach ($sessions as $session) {
                $groupLabel = $this->groupLabel($session->classSectionGroup);
                $dateStr = $session->attendance_date
                    ? \Carbon\Carbon::parse($session->attendance_date)->format('Y-m-d')
                    : '';
                foreach ($session->studentAttendances as $att) {
                    $en = $att->studentEnrollment;
                    $checkIn = $att->check_in instanceof \Carbon\Carbon
                        ? $att->check_in->format('H:i')
                        : ($att->check_in ?? '');
                    $checkOut = $att->check_out instanceof \Carbon\Carbon
                        ? $att->check_out->format('H:i')
                        : ($att->check_out ?? '');
                    // Prefix date and times with tab so Excel treats them as text (avoids ######## and wrong formatting)
                    fputcsv($out, [
                        $dateStr !== '' ? "\t" . $dateStr : '',
                        $groupLabel,
                        $en?->roll_number ?? '',
                        $en?->student?->full_name ?? $en?->student?->user?->name ?? '',
                        $att->status ?? '',
                        $checkIn !== '' ? "\t" . $checkIn : '',
                        $checkOut !== '' ? "\t" . $checkOut : '',
                        $att->remarks ?? '',
                    ]);
                }
            }
            fclose($out);
        }, 'attendance-' . $dateFrom . '-to-' . $dateTo . '.csv', $headers);
    }

    /**
     * Export for Excel: same CSV content with .csv extension so Excel can open it.
     * (Real .xlsx would require PhpSpreadsheet; CSV with .csv extension opens correctly in Excel.)
     */
    public function exportToExcel(
        int $academicSessionId,
        string $dateFrom,
        string $dateTo,
        ?int $classSectionGroupId = null
    ): StreamedResponse {
        $response = $this->exportToCsv($academicSessionId, $dateFrom, $dateTo, $classSectionGroupId);
        $response->headers->set('Content-Disposition', 'attachment; filename="attendance-' . $dateFrom . '-to-' . $dateTo . '.csv"');
        return $response;
    }

    /**
     * Export to PDF using a simple HTML view (or DomPDF). For production, use barryvdh/laravel-dompdf.
     * Here we return a minimal HTML that can be printed as PDF from browser.
     */
    public function exportToPdfHtml(
        int $academicSessionId,
        string $dateFrom,
        string $dateTo,
        ?int $classSectionGroupId = null
    ): string {
        $sessions = AttendanceSession::with([
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
            'classSectionGroup.subjectGroup',
            'studentAttendances.studentEnrollment.student.user',
        ])
            ->where('academic_session_id', $academicSessionId)
            ->where('type', 'student')
            ->whereBetween('attendance_date', [$dateFrom, $dateTo]);

        if ($classSectionGroupId !== null) {
            $sessions->where('class_section_group_id', $classSectionGroupId);
        }

        $sessions = $sessions->orderBy('attendance_date')->orderBy('class_section_group_id')->get();

        $rows = '';
        foreach ($sessions as $session) {
            $groupLabel = $this->groupLabel($session->classSectionGroup);
            $dateStr = $session->attendance_date ? \Carbon\Carbon::parse($session->attendance_date)->format('Y-m-d') : '';
            foreach ($session->studentAttendances as $att) {
                $en = $att->studentEnrollment;
                $checkIn = $att->check_in instanceof \Carbon\Carbon ? $att->check_in->format('H:i') : ($att->check_in ?? '');
                $checkOut = $att->check_out instanceof \Carbon\Carbon ? $att->check_out->format('H:i') : ($att->check_out ?? '');
                $rows .= sprintf(
                    '<tr><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td><td>%s</td></tr>',
                    e($dateStr),
                    e($groupLabel),
                    e($en?->roll_number ?? ''),
                    e($en?->student?->full_name ?? $en?->student?->user?->name ?? ''),
                    e($att->status ?? ''),
                    e($checkIn),
                    e($checkOut),
                    e($att->remarks ?? ''),
                );
            }
        }

        return '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Attendance Report</title></head><body>
<table border="1" cellpadding="4" style="border-collapse:collapse;width:100%%">
<thead><tr><th>Date</th><th>Class Section Group</th><th>Roll No</th><th>Student Name</th><th>Status</th><th>Check In</th><th>Check Out</th><th>Remarks</th></tr></thead>
<tbody>' . $rows . '</tbody></table></body></html>';
    }

    protected function groupLabel($csg): string
    {
        if (! $csg) {
            return '—';
        }
        $cs = $csg->classSection ?? $csg->class_section;
        $c = $cs?->class ?? $cs?->class;
        $s = $cs?->section ?? $cs?->section;
        $g = $csg->subjectGroup ?? $csg->subject_group;
        $parts = array_filter([
            $c->name ?? null,
            $s->name ?? null,
            $g->name ?? null,
        ]);
        return implode(' ', $parts) ?: '—';
    }
}
