import { router } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisVertical, faChevronDown } from '@fortawesome/free-solid-svg-icons';

const CHART_HEIGHT = 150;
const CHART_WIDTH = 300;
const CHART_PADDING = 12;

function formatAmount(value) {
    const n = Number(value) || 0;
    return n.toLocaleString('en-PK', { maximumFractionDigits: 0 });
}

function seriesToPoints(values, width = CHART_WIDTH, height = CHART_HEIGHT, padding = CHART_PADDING) {
    if (!values?.length) return [];
    const max = Math.max(...values, 1);
    const step = values.length > 1 ? width / (values.length - 1) : 0;
    return values.map((v, i) => ({
        x: i * step,
        y: height - padding - (v / max) * (height - padding * 2),
    }));
}

function buildLinePath(points) {
    if (!points.length) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
}

function buildAreaPath(points, height = CHART_HEIGHT) {
    if (!points.length) return '';
    const line = buildLinePath(points);
    const last = points[points.length - 1];
    const first = points[0];
    return `${line} L${last.x},${height} L${first.x},${height} Z`;
}

const WEEK_OPTIONS = [
    { offset: 0, label: 'This week' },
    { offset: 1, label: 'Last week' },
    { offset: 2, label: '2 weeks ago' },
    { offset: 3, label: '3 weeks ago' },
];

export default function IncomeExpensesCharts({
    charts = {},
    weekOffset = 0,
    calendarMonth = '',
}) {
    const earnings = charts.earnings ?? {
        rangeLabel: '',
        totalCollections: 0,
        feesCollection: 0,
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        collectionsSeries: [0, 0, 0, 0, 0, 0, 0],
        feesSeries: [0, 0, 0, 0, 0, 0, 0],
    };
    const expenses = charts.expenses ?? { months: [] };
    const students = charts.students ?? { male: 0, female: 0, other: 0, total: 0 };

    const collectionPoints = seriesToPoints(earnings.collectionsSeries);
    const feesPoints = seriesToPoints(earnings.feesSeries);

    const expenseMonths = expenses.months?.length
        ? expenses.months
        : [
            { label: '—', shortLabel: '—', amount: 0, color: '#22c55e' },
            { label: '—', shortLabel: '—', amount: 0, color: '#3b82f6' },
            { label: '—', shortLabel: '—', amount: 0, color: '#fb923c' },
        ];
    const maxExpense = Math.max(...expenseMonths.map((m) => m.amount), 1);

    const totalStudents = students.total || 0;
    const femaleCount = students.female || 0;
    const maleCount = students.male || 0;
    const otherCount = students.other || 0;
    const circumference = 2 * Math.PI * 80;
    const femaleArc = totalStudents > 0 ? (femaleCount / totalStudents) * circumference : 0;
    const maleArc = totalStudents > 0 ? (maleCount / totalStudents) * circumference : 0;
    const otherArc = totalStudents > 0 ? (otherCount / totalStudents) * circumference : 0;

    const changeWeek = (offset) => {
        router.get(route('dashboard.superadmin'), {
            week_offset: offset,
            ...(calendarMonth ? { calendar_month: calendarMonth } : {}),
        }, { preserveState: true, preserveScroll: true });
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            {/* Earnings */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4 gap-2">
                    <h3 className="text-lg font-bold text-slate-800">Earnings</h3>
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <select
                                value={weekOffset}
                                onChange={(e) => changeWeek(Number(e.target.value))}
                                className="appearance-none text-xs text-slate-600 border border-slate-200 rounded pl-2 pr-7 py-1 bg-white cursor-pointer focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                aria-label="Select week"
                            >
                                {WEEK_OPTIONS.map((opt) => (
                                    <option key={opt.offset} value={opt.offset}>{opt.label}</option>
                                ))}
                            </select>
                            <FontAwesomeIcon
                                icon={faChevronDown}
                                className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                            />
                        </div>
                    </div>
                </div>

                <p className="text-xs text-slate-400 mb-3">{earnings.rangeLabel}</p>

                <div className="flex items-center gap-6 mb-4 flex-wrap">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-xs text-slate-500">Total Collections</span>
                        </div>
                        <p className="text-xl font-bold text-slate-800">{formatAmount(earnings.totalCollections)}</p>
                    </div>
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-3 h-3 rounded-full bg-red-500" />
                            <span className="text-xs text-slate-500">Fees Collection</span>
                        </div>
                        <p className="text-xl font-bold text-slate-800">{formatAmount(earnings.feesCollection)}</p>
                    </div>
                </div>

                <div className="h-48 relative">
                    <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="w-full h-full" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.3" />
                                <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        <path fill="url(#blueGrad)" d={buildAreaPath(collectionPoints)} />
                        <path fill="none" stroke="#3b82f6" strokeWidth="2" d={buildLinePath(collectionPoints)} />
                        <path fill="url(#redGrad)" d={buildAreaPath(feesPoints)} />
                        <path fill="none" stroke="#ef4444" strokeWidth="2" d={buildLinePath(feesPoints)} />
                    </svg>
                    <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-slate-400 px-2">
                        {(earnings.labels || []).map((label) => (
                            <span key={label}>{label}</span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Expenses</h3>
                    <button type="button" className="text-slate-400 hover:text-slate-600 p-1" aria-hidden>
                        <FontAwesomeIcon icon={faEllipsisVertical} className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center gap-4 mb-4 flex-wrap">
                    {expenseMonths.map((month) => (
                        <div key={month.label} className="flex flex-col items-start gap-0.5 min-w-0">
                            <span className="text-xs text-slate-600 truncate">
                                {month.label} {formatAmount(month.amount)}
                            </span>
                            <span className="block w-full h-0.5 rounded" style={{ backgroundColor: month.color }} />
                        </div>
                    ))}
                </div>

                <div className="h-48 flex items-end justify-around gap-2 px-4">
                    {expenseMonths.map((month) => {
                        const barHeight = Math.max(4, (month.amount / maxExpense) * 140);
                        return (
                            <div key={month.shortLabel + month.label} className="flex flex-col items-center gap-1 flex-1">
                                <div
                                    className="w-full rounded-t transition-all"
                                    style={{ height: `${barHeight}px`, backgroundColor: month.color }}
                                    title={`${month.label}: ${formatAmount(month.amount)}`}
                                />
                                <span className="text-xs text-slate-400">{month.shortLabel}</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Students */}
            <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-slate-800">Students</h3>
                    <button type="button" className="text-slate-400 hover:text-slate-600 p-1" aria-hidden>
                        <FontAwesomeIcon icon={faEllipsisVertical} className="w-4 h-4" />
                    </button>
                </div>

                <div className="flex items-center justify-center mb-6">
                    {totalStudents === 0 ? (
                        <div className="w-48 h-48 rounded-full border-[30px] border-slate-100 flex items-center justify-center">
                            <span className="text-sm text-slate-400">No data</span>
                        </div>
                    ) : (
                        <svg viewBox="0 0 200 200" className="w-48 h-48">
                            <circle
                                cx="100"
                                cy="100"
                                r="80"
                                fill="none"
                                stroke="#e2e8f0"
                                strokeWidth="30"
                            />
                            {femaleArc > 0 && (
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="30"
                                    strokeDasharray={`${femaleArc} ${circumference}`}
                                    transform="rotate(-90 100 100)"
                                />
                            )}
                            {maleArc > 0 && (
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#f97316"
                                    strokeWidth="30"
                                    strokeDasharray={`${maleArc} ${circumference}`}
                                    strokeDashoffset={-femaleArc}
                                    transform="rotate(-90 100 100)"
                                />
                            )}
                            {otherArc > 0 && (
                                <circle
                                    cx="100"
                                    cy="100"
                                    r="80"
                                    fill="none"
                                    stroke="#94a3b8"
                                    strokeWidth="30"
                                    strokeDasharray={`${otherArc} ${circumference}`}
                                    strokeDashoffset={-(femaleArc + maleArc)}
                                    transform="rotate(-90 100 100)"
                                />
                            )}
                        </svg>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-blue-500" />
                            <span className="text-sm text-slate-600">Female Students</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{formatAmount(femaleCount)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-500" />
                            <span className="text-sm text-slate-600">Male Students</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{formatAmount(maleCount)}</span>
                    </div>
                    {otherCount > 0 && (
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full bg-slate-400" />
                                <span className="text-sm text-slate-600">Other / Not set</span>
                            </div>
                            <span className="text-sm font-bold text-slate-800">{formatAmount(otherCount)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                        <span className="text-sm font-medium text-slate-600">Total</span>
                        <span className="text-sm font-bold text-slate-800">{formatAmount(totalStudents)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
