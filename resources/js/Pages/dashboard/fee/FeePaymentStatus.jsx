import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowLeft,
    faClipboardCheck,
    faFileExcel,
    faFilePdf,
    faFilter,
    faUsers,
    faCircleCheck,
    faCircleExclamation,
    faClock,
    faFileCircleXmark,
    faMoneyBillWave,
    faScaleBalanced,
    faSearch,
    faSchool,
    faWallet,
    faHourglassHalf,
} from '@fortawesome/free-solid-svg-icons';

const selectInputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
}

function sid(value) {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
}

function money(value) {
    return Number(value || 0).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

function formatMonth(ym) {
    if (!ym) return '—';
    const [y, m] = String(ym).split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    if (Number.isNaN(date.getTime())) return ym;
    return date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

function statusBadge(status, label) {
    const map = {
        paid: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        unpaid: 'bg-red-50 text-red-700 border-red-200',
        partial: 'bg-amber-50 text-amber-800 border-amber-200',
        no_invoice: 'bg-gray-100 text-gray-600 border-gray-200',
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${map[status] || map.no_invoice}`}>
            {label}
        </span>
    );
}

function StatCard({ label, value, icon, tone = 'slate', moneyValue = false }) {
    const tones = {
        slate: { wrap: 'border-slate-200 bg-white', icon: 'bg-slate-100 text-slate-600', value: 'text-gray-900' },
        emerald: { wrap: 'border-emerald-200 bg-emerald-50/40', icon: 'bg-emerald-100 text-emerald-700', value: 'text-emerald-700' },
        amber: { wrap: 'border-amber-200 bg-amber-50/50', icon: 'bg-amber-100 text-amber-700', value: 'text-amber-700' },
        red: { wrap: 'border-red-200 bg-red-50/40', icon: 'bg-red-100 text-red-700', value: 'text-red-700' },
        gray: { wrap: 'border-gray-200 bg-gray-50', icon: 'bg-gray-200 text-gray-600', value: 'text-gray-700' },
        blue: { wrap: 'border-sky-200 bg-sky-50/40', icon: 'bg-sky-100 text-sky-700', value: 'text-sky-800' },
    };
    const t = tones[tone] || tones.slate;

    return (
        <div className={`rounded-xl border p-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)] ${t.wrap}`}>
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                    <p className={`mt-1.5 text-xl font-bold tabular-nums ${t.value}`}>
                        {moneyValue ? money(value) : value}
                    </p>
                </div>
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${t.icon}`}>
                    <FontAwesomeIcon icon={icon} className="text-sm" />
                </div>
            </div>
        </div>
    );
}

export default function FeePaymentStatus({
    filterTree = [],
    filters = {},
    rows = [],
    summary = {},
    meta = {},
    ready = false,
    schoolOverview = {},
}) {
    const tree = asArray(filterTree);
    const list = asArray(rows);

    const [billingMonth, setBillingMonth] = useState(filters.billing_month || new Date().toISOString().slice(0, 7));
    const [sessionId, setSessionId] = useState(sid(filters.academic_session_id));
    const [classId, setClassId] = useState(sid(filters.class_id));
    const [sectionId, setSectionId] = useState(sid(filters.section_id));
    const [status, setStatus] = useState(filters.status || 'all');

    useEffect(() => {
        setBillingMonth(filters.billing_month || new Date().toISOString().slice(0, 7));
        setSessionId(sid(filters.academic_session_id));
        setClassId(sid(filters.class_id));
        setSectionId(sid(filters.section_id));
        setStatus(filters.status || 'all');
    }, [filters.billing_month, filters.academic_session_id, filters.class_id, filters.section_id, filters.status]);

    const selectedSession = useMemo(
        () => tree.find((row) => sid(row.id) === sessionId) || null,
        [tree, sessionId]
    );
    const availableClasses = useMemo(() => asArray(selectedSession?.classes), [selectedSession]);
    const selectedClass = useMemo(
        () => availableClasses.find((row) => sid(row.id) === classId) || null,
        [availableClasses, classId]
    );
    const availableSections = useMemo(() => asArray(selectedClass?.sections), [selectedClass]);

    const sessionOptions = useMemo(
        () => tree.map((row) => ({ value: sid(row.id), label: row.name })),
        [tree]
    );
    const classOptions = useMemo(
        () => availableClasses.map((row) => ({ value: sid(row.id), label: row.name })),
        [availableClasses]
    );
    const sectionOptions = useMemo(
        () => availableSections.map((row) => ({ value: sid(row.id), label: row.name })),
        [availableSections]
    );

    const statusChips = [
        { key: 'all', label: 'All' },
        { key: 'paid', label: 'Paid' },
        { key: 'partial', label: 'Partial' },
        { key: 'unpaid', label: 'Unpaid' },
        { key: 'no_invoice', label: 'No Invoice' },
    ];

    const buildParams = (overrides = {}) => {
        const params = {
            billing_month: overrides.billing_month ?? billingMonth,
            academic_session_id: overrides.academic_session_id ?? sessionId,
            class_id: overrides.class_id ?? classId,
            section_id: overrides.section_id ?? sectionId,
            status: overrides.status ?? status,
        };
        Object.keys(params).forEach((key) => {
            if (params[key] === '' || params[key] === null || params[key] === undefined) {
                delete params[key];
            }
            if (key === 'status' && params[key] === 'all') {
                delete params[key];
            }
        });
        return params;
    };

    const applyFilters = (overrides = {}) => {
        router.get(route('fee-payment-status.index'), buildParams(overrides), {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const exportQuery = () => {
        const q = new URLSearchParams();
        const params = buildParams();
        Object.entries(params).forEach(([key, value]) => q.set(key, value));
        return q.toString();
    };

    const canExport = ready && list.length > 0;
    const canSearch = Boolean(sessionId);

    const clearFilters = () => {
        const month = new Date().toISOString().slice(0, 7);
        setBillingMonth(month);
        setSessionId('');
        setClassId('');
        setSectionId('');
        setStatus('all');
        router.get(route('fee-payment-status.index'), { billing_month: month }, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Fee Payment Status" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Fee Payment Status' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-amber-50 border border-amber-100">
                                <FontAwesomeIcon icon={faClipboardCheck} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Fee Payment Status</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Track paid and unpaid fees by session, class, section and month.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            {canExport && (
                                <>
                                    <a
                                        href={`${route('fee-payment-status.export.excel')}?${exportQuery()}`}
                                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faFileExcel} /> Excel
                                    </a>
                                    <a
                                        href={`${route('fee-payment-status.export.pdf')}?${exportQuery()}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faFilePdf} /> PDF
                                    </a>
                                </>
                            )}
                            <Link
                                href={route('admin.accountant-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                        </div>
                    </div>

                    <div className="mb-6 rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 shadow-[0_1px_3px_rgba(0,0,0,0.06)] overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-amber-100/80 flex flex-wrap items-center justify-between gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                    <FontAwesomeIcon icon={faSchool} className="text-amber-500" />
                                    School Fee Overview
                                </h2>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Net after scholarship + sibling discount · Overtime charged full · {schoolOverview.billing_month_label || formatMonth(billingMonth)}
                                </p>
                            </div>
                            {Number(schoolOverview.collection_percent || 0) > 0 && (
                                <span className="inline-flex items-center rounded-full border border-amber-200 bg-white px-3 py-1 text-xs font-semibold text-amber-700">
                                    Month collection {schoolOverview.collection_percent}%
                                </span>
                            )}
                        </div>
                        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">Total School Fee (Net)</p>
                                        <p className="mt-1.5 text-2xl font-bold tabular-nums text-gray-900">
                                            {money(schoolOverview.total_school_fee)}
                                        </p>
                                        <p className="mt-1 text-[11px] text-slate-500">
                                            Gross {money(schoolOverview.total_school_fee_gross)} − Discount {money(schoolOverview.total_discounts)}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-slate-500">
                                            Paid {money(schoolOverview.total_school_paid)} · Due {money(schoolOverview.total_school_balance)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 text-slate-600">
                                        <FontAwesomeIcon icon={faScaleBalanced} />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700/80">Collected This Month</p>
                                        <p className="mt-1.5 text-2xl font-bold tabular-nums text-emerald-700">
                                            {money(schoolOverview.month_collected)}
                                        </p>
                                        <p className="mt-1 text-[11px] text-emerald-800/70">
                                            Month net due {money(schoolOverview.month_billed)} · Discount {money(schoolOverview.month_discounts)}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-emerald-800/70">
                                            Invoice paid {money(schoolOverview.month_invoice_paid)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-emerald-100 text-emerald-700">
                                        <FontAwesomeIcon icon={faWallet} />
                                    </div>
                                </div>
                            </div>
                            <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-4 shadow-sm">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[11px] font-semibold uppercase tracking-wide text-rose-700/80">Remaining This Month</p>
                                        <p className="mt-1.5 text-2xl font-bold tabular-nums text-rose-700">
                                            {money(schoolOverview.month_remaining)}
                                        </p>
                                        <p className="mt-1 text-[11px] text-rose-800/70">
                                            Unpaid balance for {schoolOverview.billing_month_label || formatMonth(billingMonth)}
                                        </p>
                                        <p className="mt-0.5 text-[11px] text-rose-800/70">
                                            Gross billed {money(schoolOverview.month_billed_gross)}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-rose-100 text-rose-700">
                                        <FontAwesomeIcon icon={faHourglassHalf} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-6 overflow-visible relative z-20">
                        <div className="px-5 py-3.5 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-white flex items-center justify-between gap-3 rounded-t-xl">
                            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                                <FontAwesomeIcon icon={faFilter} className="text-amber-500" />
                                Filters
                            </h2>
                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-xs font-medium text-gray-500 hover:text-amber-700 transition-colors"
                            >
                                Reset
                            </button>
                        </div>
                        <div className="p-5">
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Billing month
                                    </label>
                                    <input
                                        type="month"
                                        value={billingMonth}
                                        onChange={(e) => {
                                            const month = e.target.value;
                                            setBillingMonth(month);
                                            router.get(
                                                route('fee-payment-status.index'),
                                                buildParams({ billing_month: month }),
                                                {
                                                    preserveState: true,
                                                    preserveScroll: true,
                                                    only: ['schoolOverview', 'filters', 'rows', 'summary', 'meta', 'ready'],
                                                }
                                            );
                                        }}
                                        className={selectInputClass}
                                    />
                                </div>
                                <div className="min-w-[12rem]">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Session
                                    </label>
                                    <SearchableSelect
                                        options={sessionOptions}
                                        value={sessionId}
                                        onChange={(value) => {
                                            setSessionId(value);
                                            setClassId('');
                                            setSectionId('');
                                        }}
                                        placeholder="Select session..."
                                        emptyText="No sessions found"
                                        inputClassName={selectInputClass}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Class
                                    </label>
                                    <SearchableSelect
                                        options={classOptions}
                                        value={classId}
                                        onChange={(value) => {
                                            setClassId(value);
                                            setSectionId('');
                                        }}
                                        placeholder={sessionId ? 'Select class...' : 'Select session first'}
                                        emptyText={sessionId ? 'No classes found' : 'Select session first'}
                                        inputClassName={`${selectInputClass} ${!sessionId ? 'bg-gray-50 text-gray-400' : ''}`}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        Section
                                    </label>
                                    <SearchableSelect
                                        options={sectionOptions}
                                        value={sectionId}
                                        onChange={(value) => setSectionId(value)}
                                        placeholder={classId ? 'Select section...' : 'Select class first'}
                                        emptyText={classId ? 'No sections found' : 'Select class first'}
                                        inputClassName={`${selectInputClass} ${!classId ? 'bg-gray-50 text-gray-400' : ''}`}
                                    />
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 mb-1.5">
                                        &nbsp;
                                    </label>
                                    <button
                                        type="button"
                                        disabled={!canSearch}
                                        onClick={() => applyFilters()}
                                        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors ${
                                            canSearch
                                                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        <FontAwesomeIcon icon={faSearch} />
                                        Show Students
                                    </button>
                                </div>
                            </div>

                            {ready && (
                                <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-2">
                                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-400 mr-1">
                                        Quick status
                                    </span>
                                    {statusChips.map((chip) => {
                                        const active = (status || 'all') === chip.key;
                                        return (
                                            <button
                                                key={chip.key}
                                                type="button"
                                                onClick={() => {
                                                    setStatus(chip.key);
                                                    applyFilters({ status: chip.key });
                                                }}
                                                className={`px-3 py-1 rounded-full text-xs font-semibold border transition-colors ${
                                                    active
                                                        ? 'bg-amber-500 border-amber-500 text-white'
                                                        : 'bg-white border-gray-200 text-gray-600 hover:border-amber-300 hover:text-amber-700'
                                                }`}
                                            >
                                                {chip.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {ready && (
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-7 gap-3 mb-6">
                            <StatCard label="Students" value={summary.total_students ?? 0} icon={faUsers} tone="slate" />
                            <StatCard label="Paid" value={summary.paid ?? 0} icon={faCircleCheck} tone="emerald" />
                            <StatCard label="Partial" value={summary.partial ?? 0} icon={faClock} tone="amber" />
                            <StatCard label="Unpaid" value={summary.unpaid ?? 0} icon={faCircleExclamation} tone="red" />
                            <StatCard label="No Invoice" value={summary.no_invoice ?? 0} icon={faFileCircleXmark} tone="gray" />
                            <StatCard label="Total Paid" value={summary.total_paid ?? 0} icon={faMoneyBillWave} tone="blue" moneyValue />
                            <StatCard label="Balance" value={summary.total_balance ?? 0} icon={faScaleBalanced} tone="red" moneyValue />
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/60 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                                    <FontAwesomeIcon icon={faUsers} className="text-amber-500" />
                                    Students
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {ready ? (
                                        <>
                                            <span className="font-medium text-gray-700">{formatMonth(billingMonth)}</span>
                                            <span className="mx-1.5 text-gray-300">·</span>
                                            {meta.session_name || '—'}
                                            <span className="mx-1.5 text-gray-300">·</span>
                                            {meta.class_name || '—'}
                                            <span className="mx-1.5 text-gray-300">·</span>
                                            {meta.section_name || '—'}
                                            <span className="mx-1.5 text-gray-300">·</span>
                                            <span>{list.length} result{list.length === 1 ? '' : 's'}</span>
                                        </>
                                    ) : (
                                        'Choose session (and optionally class / section), then click Show Students.'
                                    )}
                                </p>
                            </div>
                        </div>

                        {!ready ? (
                            <div className="px-6 py-16 text-center">
                                <div className="mx-auto w-16 h-16 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center mb-4">
                                    <FontAwesomeIcon icon={faSearch} className="text-amber-500 text-2xl" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">No filters applied yet</h3>
                                <p className="mt-1.5 text-sm text-gray-500 max-w-md mx-auto">
                                    Select a billing month and session above, then press <span className="font-medium text-amber-700">Show Students</span> to load paid / unpaid status.
                                </p>
                            </div>
                        ) : list.length === 0 ? (
                            <div className="px-6 py-14 text-center">
                                <div className="mx-auto w-14 h-14 rounded-2xl bg-gray-50 border border-gray-200 flex items-center justify-center mb-4">
                                    <FontAwesomeIcon icon={faUsers} className="text-gray-400 text-xl" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">No students found</h3>
                                <p className="mt-1.5 text-sm text-gray-500">Try another class, section, or status filter.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/90">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">#</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Roll</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Student</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Class</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Section</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Invoice</th>
                                            <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Gross</th>
                                            <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Discount</th>
                                            <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Payable</th>
                                            <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Paid</th>
                                            <th className="px-4 py-3 text-right text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Balance</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Due</th>
                                            <th className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 bg-white">
                                        {list.map((row, idx) => (
                                            <tr
                                                key={`${row.enrollment_id}-${row.invoice_id || 'none'}-${idx}`}
                                                className="hover:bg-amber-50/40 transition-colors"
                                            >
                                                <td className="px-4 py-3.5 text-sm text-gray-500">{idx + 1}</td>
                                                <td className="px-4 py-3.5 text-sm text-gray-700 font-mono text-xs">{row.roll_number}</td>
                                                <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{row.student_name}</td>
                                                <td className="px-4 py-3.5 text-sm text-gray-700">{row.class_name}</td>
                                                <td className="px-4 py-3.5 text-sm text-gray-700">{row.section_name}</td>
                                                <td className="px-4 py-3.5 text-sm text-gray-700">
                                                    <div className="font-mono text-xs">{row.invoice_no}</div>
                                                    {row.invoice_count > 1 && (
                                                        <div className="text-[11px] text-amber-700 mt-0.5 font-medium">
                                                            {row.invoice_count} invoices combined
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-sm text-right tabular-nums text-gray-700">{money(row.total_amount)}</td>
                                                <td className="px-4 py-3.5 text-sm text-right tabular-nums text-amber-700">{money(row.discount_amount)}</td>
                                                <td className="px-4 py-3.5 text-sm text-right tabular-nums font-semibold text-gray-900">{money(row.payable_amount ?? Math.max(0, (row.total_amount || 0) - (row.discount_amount || 0) + (row.fine_amount || 0)))}</td>
                                                <td className="px-4 py-3.5 text-sm text-right tabular-nums font-medium text-emerald-700">{money(row.paid_amount)}</td>
                                                <td className="px-4 py-3.5 text-sm text-right tabular-nums font-medium text-red-600">{money(row.balance)}</td>
                                                <td className="px-4 py-3.5 text-sm text-gray-600">{row.due_date || '—'}</td>
                                                <td className="px-4 py-3.5">{statusBadge(row.status, row.status_label)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
