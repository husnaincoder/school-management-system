<?php

namespace App\Http\Controllers\Dashboard\SuperAdmin;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Student;
use App\Models\StudentEnrollment;
use App\Models\Payment;
use App\Models\Expense;
use App\Models\IncomeExpense;
use App\Models\AcademicSession;
use App\Models\Exam;
use App\Models\Notice;
use App\Services\Attendance\AttendanceReportService;
use Illuminate\Http\Request;


class DashboardController extends Controller
{
    public function __construct(
        protected AttendanceReportService $attendanceReportService
    ) {}

    public function index()
    {
        $currentSession = AcademicSession::getCurrentSession();

        $stats = [
            'totalStudents' => Student::count(),
            'totalTeachers' => User::role('teacher')->count(),
            'totalStaff' => User::role(['employee', 'accountant'])->count(),
            'totalParents' => User::role('parent')->count(),
        ];

        $recentPayments = []; // fee_payments table not in use

        $monthlyIncome = IncomeExpense::income()
            ->whereMonth('date', now()->month)
            ->sum('amount');

        $monthlyExpense = IncomeExpense::expense()
            ->whereMonth('date', now()->month)
            ->sum('amount');

        $recentStudents = StudentEnrollment::with([
            'student.user',
            'classSectionGroup.classSection.class',
            'classSectionGroup.classSection.section',
        ])
            ->where('admission_date', '>=', now()->subMonth())
            ->whereNotNull('admission_date')
            ->orderByDesc('admission_date')
            ->take(15)
            ->get();

        $attendanceToday = $this->attendanceReportService->todaySummary($currentSession?->id);

        $weekOffset = max(0, min(3, (int) request('week_offset', 0)));
        $calendarMonth = request('calendar_month', now()->format('Y-m'));
        if (! preg_match('/^\d{4}-\d{2}$/', $calendarMonth)) {
            $calendarMonth = now()->format('Y-m');
        }

        return inertia('dashboard/superadmin/Index', [
            'stats' => $stats,
            'recentPayments' => $recentPayments,
            'monthlyIncome' => $monthlyIncome,
            'monthlyExpense' => $monthlyExpense,
            'netProfit' => $monthlyIncome - $monthlyExpense,
            'recentStudents' => $recentStudents,
            'attendanceToday' => $attendanceToday,
            'charts' => [
                'earnings' => $this->earningsChartData($weekOffset),
                'expenses' => $this->expensesChartData(),
                'students' => $this->studentsChartData(),
            ],
            'weekOffset' => $weekOffset,
            'calendar' => $this->calendarData($calendarMonth),
            'calendarMonth' => $calendarMonth,
            'dashboardNotices' => $this->dashboardNotices(),
        ]);
    }

    private function earningsChartData(int $weekOffset): array
    {
        $end = now()->subWeeks($weekOffset)->endOfDay();
        $start = $end->copy()->subDays(6)->startOfDay();

        $labels = [];
        $collectionsSeries = [];
        $feesSeries = [];

        for ($i = 0; $i < 7; $i++) {
            $day = $start->copy()->addDays($i);
            $dateStr = $day->toDateString();
            $labels[] = $day->format('D');

            $fees = (float) Payment::whereDate('payment_date', $dateStr)->sum('amount');
            $otherIncome = (float) IncomeExpense::income()->whereDate('date', $dateStr)->sum('amount');

            $feesSeries[] = $fees;
            $collectionsSeries[] = $fees + $otherIncome;
        }

        return [
            'rangeLabel' => $start->format('M d').' – '.$end->format('M d, Y'),
            'totalCollections' => array_sum($collectionsSeries),
            'feesCollection' => array_sum($feesSeries),
            'labels' => $labels,
            'collectionsSeries' => $collectionsSeries,
            'feesSeries' => $feesSeries,
        ];
    }

    private function expensesChartData(): array
    {
        $months = [];
        $colors = ['#22c55e', '#3b82f6', '#fb923c'];

        for ($i = 2; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $start = $month->copy()->startOfMonth();
            $end = $month->copy()->endOfMonth();

            $fromExpenses = (float) Expense::whereBetween('expense_date', [$start, $end])->sum('total_amount');
            $fromLedger = (float) IncomeExpense::expense()->whereBetween('date', [$start, $end])->sum('amount');

            $months[] = [
                'label' => $month->format('M Y'),
                'shortLabel' => $month->format('M'),
                'amount' => $fromExpenses + $fromLedger,
                'color' => $colors[2 - $i],
            ];
        }

        return ['months' => $months];
    }

    private function studentsChartData(): array
    {
        $male = Student::where('gender', 'male')->count();
        $female = Student::where('gender', 'female')->count();
        $total = Student::count();
        $other = max(0, $total - $male - $female);

        return [
            'male' => $male,
            'female' => $female,
            'other' => $other,
            'total' => $total,
        ];
    }

    private function calendarData(string $monthKey): array
    {
        try {
            $month = now()->parse($monthKey.'-01')->startOfMonth();
        } catch (\Throwable) {
            $month = now()->startOfMonth();
            $monthKey = $month->format('Y-m');
        }

        $start = $month->copy()->startOfMonth();
        $end = $month->copy()->endOfMonth();
        $eventsByDate = [];

        $addEvent = function (string $dateStr, array $event) use (&$eventsByDate) {
            $eventsByDate[$dateStr] ??= [];
            $eventsByDate[$dateStr][] = $event;
        };

        Exam::query()
            ->whereNotNull('start_date')
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                    ->orWhereBetween('end_date', [$start, $end])
                    ->orWhere(function ($q2) use ($start, $end) {
                        $q2->where('start_date', '<=', $end)
                            ->where(function ($q3) use ($start) {
                                $q3->whereNull('end_date')->orWhere('end_date', '>=', $start);
                            });
                    });
            })
            ->get(['id', 'name', 'start_date', 'end_date'])
            ->each(function (Exam $exam) use ($addEvent, $start, $end) {
                $from = $exam->start_date->copy()->max($start);
                $to = ($exam->end_date ?? $exam->start_date)->copy()->min($end);
                for ($d = $from->copy(); $d <= $to; $d->addDay()) {
                    $addEvent($d->format('Y-m-d'), [
                        'id' => 'exam-'.$exam->id,
                        'title' => $exam->name,
                        'type' => 'exam',
                        'color' => '#f97316',
                    ]);
                }
            });

        Notice::published()
            ->with('category')
            ->get()
            ->each(function (Notice $notice) use ($addEvent, $start, $end) {
                $date = ($notice->publish_at ?? $notice->created_at)->copy()->startOfDay();
                if ($date >= $start && $date <= $end) {
                    $addEvent($date->format('Y-m-d'), [
                        'id' => 'notice-'.$notice->id,
                        'title' => $notice->title,
                        'type' => 'notice',
                        'color' => $notice->category?->color ?? $this->noticePriorityColor($notice->priority),
                    ]);
                }
            });

        AcademicSession::query()
            ->where(function ($q) use ($start, $end) {
                $q->whereBetween('start_date', [$start, $end])
                    ->orWhereBetween('end_date', [$start, $end]);
            })
            ->get(['id', 'name', 'start_date', 'end_date'])
            ->each(function (AcademicSession $session) use ($addEvent) {
                if ($session->start_date) {
                    $addEvent($session->start_date->format('Y-m-d'), [
                        'id' => 'session-start-'.$session->id,
                        'title' => 'Session starts: '.$session->name,
                        'type' => 'session',
                        'color' => '#22c55e',
                    ]);
                }
                if ($session->end_date) {
                    $addEvent($session->end_date->format('Y-m-d'), [
                        'id' => 'session-end-'.$session->id,
                        'title' => 'Session ends: '.$session->name,
                        'type' => 'session',
                        'color' => '#6366f1',
                    ]);
                }
            });

        return [
            'month' => $monthKey,
            'monthLabel' => $month->format('F Y'),
            'eventsByDate' => $eventsByDate,
        ];
    }

    private function dashboardNotices(): array
    {
        return Notice::with(['category', 'createdByEmployee.user', 'createdByTeacher.user'])
            ->published()
            ->orderByRaw('is_pinned DESC, COALESCE(publish_at, created_at) DESC')
            ->limit(5)
            ->get()
            ->map(function (Notice $notice) {
                $at = $notice->publish_at ?? $notice->created_at;

                return [
                    'id' => $notice->id,
                    'title' => $notice->title,
                    'date' => $at->format('d M, Y'),
                    'author' => $notice->createdByEmployee?->user?->name
                        ?? $notice->createdByTeacher?->user?->name
                        ?? 'School Admin',
                    'publishedAt' => $at->toIso8601String(),
                    'barColor' => $notice->category?->color ?? $this->noticePriorityColor($notice->priority),
                    'isPinned' => (bool) $notice->is_pinned,
                ];
            })
            ->values()
            ->all();
    }

    private function noticePriorityColor(?string $priority): string
    {
        return match ($priority) {
            Notice::PRIORITY_URGENT => '#ef4444',
            Notice::PRIORITY_HIGH => '#f97316',
            Notice::PRIORITY_MEDIUM => '#3b82f6',
            Notice::PRIORITY_LOW => '#eab308',
            default => '#ec4899',
        };
    }
}
