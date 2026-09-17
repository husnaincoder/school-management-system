import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableMultiSelect from '@/Components/Dashboard/SearchableMultiSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faPlus,
    faEye,
    faFilePdf,
    faDownload,
    faCalendarAlt,
    faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function personLabel(name, code) {
    const n = (name || '').trim() || '—';
    const c = code != null ? String(code).trim() : '';
    if (!c || c === '—' || c === '()') return n;
    return `${n} (${c})`;
}

function formatMoney(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0';
}

function monthName(m) {
    const d = new Date(2000, parseInt(m, 10) - 1, 1);
    return d.toLocaleString('default', { month: 'long' });
}

function statusBadgeClass(status) {
    switch (status) {
        case 'approved':
            return 'bg-amber-100 text-amber-800';
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'cancelled':
            return 'bg-gray-100 text-gray-700';
        case 'generated':
        default:
            return 'bg-blue-100 text-blue-800';
    }
}

function todayIso() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Payrolls({
    payrolls = [],
    filterMonth,
    filterYear,
    filterStaffType = 'all',
    filterStatus = 'all',
    employees = [],
    teachers = [],
    canGenerate = false,
    canApprove = false,
    canPay = false,
}) {
    const { flash } = usePage().props;
    const list = Array.isArray(payrolls) ? payrolls : [];
    const [showGenerate, setShowGenerate] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        month: filterMonth || String(new Date().getMonth() + 1).padStart(2, '0'),
        year: filterYear || String(new Date().getFullYear()),
        staff_type: 'all',
        employee_ids: [],
        teacher_ids: [],
    });
    const [banner, setBanner] = useState({ type: '', message: '' });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const employeeList = Array.isArray(employees) ? employees : [];
    const teacherList = Array.isArray(teachers) ? teachers : [];

    const employeeOptions = useMemo(
        () =>
            employeeList.map((e) => {
                const label = personLabel(e.name, e.employee_id);
                return {
                    value: String(e.id),
                    label,
                    searchText: `${e.name || ''} ${e.employee_id || ''}`,
                    selectedLabel: label,
                };
            }),
        [employeeList]
    );

    const teacherOptions = useMemo(
        () =>
            teacherList.map((t) => {
                const label = personLabel(t.name, t.staff_id);
                return {
                    value: String(t.id),
                    label,
                    searchText: `${t.name || ''} ${t.staff_id || ''}`,
                    selectedLabel: label,
                };
            }),
        [teacherList]
    );

    const applyFilters = (overrides = {}) => {
        router.get(route('payroll.index'), {
            month: filterMonth,
            year: filterYear,
            staff_type: filterStaffType,
            status: filterStatus,
            ...overrides,
        }, { preserveState: true, replace: true });
    };

    const openGenerate = () => {
        setData({
            month: filterMonth || String(new Date().getMonth() + 1).padStart(2, '0'),
            year: filterYear || String(new Date().getFullYear()),
            staff_type: filterStaffType === 'employee' || filterStaffType === 'teacher' ? filterStaffType : 'all',
            employee_ids: [],
            teacher_ids: [],
        });
        setShowGenerate(true);
    };

    const handleGenerate = (e) => {
        e.preventDefault();
        post(route('payroll.generate'), {
            preserveScroll: true,
            onSuccess: () => {
                setShowGenerate(false);
                reset();
            },
            onError: () => {
                setBanner({ type: 'error', message: 'Could not generate payroll. Check the form errors.' });
            },
        });
    };

    const handleApprove = (id) => {
        router.post(route('payroll.approve', id), {}, { preserveScroll: true });
    };

    const handleMarkPaid = (id) => {
        const paymentDate = window.prompt('Payment date (YYYY-MM-DD):', todayIso());
        if (!paymentDate) return;
        router.post(route('payroll.pay', id), { payment_date: paymentDate }, { preserveScroll: true });
    };

    const grossFor = (p) => {
        if (p.gross != null && p.gross !== '') return Number(p.gross);
        return Number(p.basic_salary || 0) + Number(p.total_allowances || 0);
    };

    const showEmployeeSelect = data.staff_type === 'all' || data.staff_type === 'employee';
    const showTeacherSelect = data.staff_type === 'all' || data.staff_type === 'teacher';

    return (
        <AuthenticatedLayout>
            <Head title="Payrolls" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{banner.message}</div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Payroll Management', href: route('admin.payroll-management') },
                            { label: 'Payroll' },
                        ]}
                    />

                    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarAlt} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
                                <p className="text-sm text-gray-500 mt-0.5">View and generate monthly payroll.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.payroll-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <select
                                value={filterMonth}
                                onChange={(e) => applyFilters({ month: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                {MONTHS.map((m) => (
                                    <option key={m} value={m}>{monthName(m)}</option>
                                ))}
                            </select>
                            <select
                                value={filterYear}
                                onChange={(e) => applyFilters({ year: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <select
                                value={filterStaffType}
                                onChange={(e) => applyFilters({ staff_type: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="all">All Staff</option>
                                <option value="employee">Employee</option>
                                <option value="teacher">Teacher</option>
                            </select>
                            <select
                                value={filterStatus}
                                onChange={(e) => applyFilters({ status: e.target.value })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="all">All Status</option>
                                <option value="generated">Generated</option>
                                <option value="approved">Approved</option>
                                <option value="paid">Paid</option>
                            </select>
                            {canGenerate && (
                                <button
                                    type="button"
                                    onClick={openGenerate}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600"
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Generate Payroll
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Gross</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Deduction</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No payroll records for this period.</td>
                                        </tr>
                                    ) : (
                                        list.map((p) => {
                                            const status = p.status || 'generated';
                                            return (
                                                <tr key={p.id}>
                                                    <td className="px-6 py-4 font-medium text-gray-900">
                                                        {personLabel(p.employee_name, p.employee_identifier)}
                                                    </td>
                                                    <td className="px-6 py-4 text-gray-600 capitalize">{p.staff_type || '—'}</td>
                                                    <td className="px-6 py-4 text-right">{formatMoney(grossFor(p))}</td>
                                                    <td className="px-6 py-4 text-right">{formatMoney(p.total_deductions)}</td>
                                                    <td className="px-6 py-4 text-right font-medium">{formatMoney(p.net_salary)}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(status)}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap items-center justify-end gap-2">
                                                            <Link
                                                                href={route('payroll.show', p.id)}
                                                                className="text-amber-600 hover:text-amber-700"
                                                                title="View"
                                                            >
                                                                <FontAwesomeIcon icon={faEye} />
                                                            </Link>
                                                            <a
                                                                href={route('payroll.payslip.download', p.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:text-blue-700"
                                                                title="Salary Slip"
                                                            >
                                                                <FontAwesomeIcon icon={faFilePdf} />
                                                            </a>
                                                            <a
                                                                href={route('payroll.payslip.download', p.id)}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-gray-600 hover:text-gray-800"
                                                                title="Download"
                                                            >
                                                                <FontAwesomeIcon icon={faDownload} />
                                                            </a>
                                                            {canApprove && status === 'generated' && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleApprove(p.id)}
                                                                    className="px-2 py-1 text-xs rounded bg-amber-500 text-white hover:bg-amber-600"
                                                                >
                                                                    Approve
                                                                </button>
                                                            )}
                                                            {canPay && (status === 'approved' || status === 'generated') && (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleMarkPaid(p.id)}
                                                                    className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700"
                                                                >
                                                                    Mark Paid
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showGenerate && (
                        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto pt-20 pb-8 px-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                                <h2 className="text-xl font-semibold mb-4">Generate Payroll</h2>
                                <form onSubmit={handleGenerate} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                        <select value={data.month} onChange={(e) => setData('month', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required>
                                            {MONTHS.map((m) => (
                                                <option key={m} value={m}>{monthName(m)}</option>
                                            ))}
                                        </select>
                                        {errors.month && <p className="text-red-500 text-sm mt-1">{errors.month}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                        <input type="number" min={2000} max={2100} value={data.year} onChange={(e) => setData('year', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Staff Type</label>
                                        <select
                                            value={data.staff_type}
                                            onChange={(e) => {
                                                setData({
                                                    ...data,
                                                    staff_type: e.target.value,
                                                    employee_ids: e.target.value === 'teacher' ? [] : data.employee_ids,
                                                    teacher_ids: e.target.value === 'employee' ? [] : data.teacher_ids,
                                                });
                                            }}
                                            className="w-full border border-gray-300 rounded px-3 py-2"
                                        >
                                            <option value="all">All</option>
                                            <option value="employee">Employee</option>
                                            <option value="teacher">Teacher</option>
                                        </select>
                                        {errors.staff_type && <p className="text-red-500 text-sm mt-1">{errors.staff_type}</p>}
                                    </div>
                                    {showEmployeeSelect && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Employees (optional)</label>
                                            <SearchableMultiSelect
                                                options={employeeOptions}
                                                value={data.employee_ids}
                                                onChange={(ids) => setData('employee_ids', ids)}
                                                placeholder="Search and select employees..."
                                                emptyText="No employees found"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Empty = all employees with salary structure.</p>
                                            {errors.employee_ids && <p className="text-red-500 text-sm mt-1">{errors.employee_ids}</p>}
                                        </div>
                                    )}
                                    {showTeacherSelect && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Teachers (optional)</label>
                                            <SearchableMultiSelect
                                                options={teacherOptions}
                                                value={data.teacher_ids}
                                                onChange={(ids) => setData('teacher_ids', ids)}
                                                placeholder="Search and select teachers..."
                                                emptyText="No teachers found"
                                            />
                                            <p className="text-xs text-gray-500 mt-1">Empty = all teachers with salary structure.</p>
                                            {errors.teacher_ids && <p className="text-red-500 text-sm mt-1">{errors.teacher_ids}</p>}
                                        </div>
                                    )}
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={() => setShowGenerate(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50">
                                            {processing ? 'Generating…' : 'Generate'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
