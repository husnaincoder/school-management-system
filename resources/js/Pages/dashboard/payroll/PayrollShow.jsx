import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

function personLabel(name, code) {
    const n = (name || '').trim() || '—';
    const c = code != null ? String(code).trim() : '';
    return c && c !== '—' ? `${n} (${c})` : n;
}

function formatMoney(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0';
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

export default function PayrollShow({ payroll, canApprove = false, canPay = false, canDownload = true }) {
    const { flash } = usePage().props;
    if (!payroll) return null;

    const items = payroll.items || [];
    const allowances = items.filter((i) => i.type === 'allowance');
    const deductions = items.filter((i) => i.type === 'deduction');
    const attendance = payroll.attendance || {};
    const status = payroll.status || 'generated';

    const handleApprove = () => {
        router.post(route('payroll.approve', payroll.id), {}, { preserveScroll: true });
    };

    const handleMarkPaid = () => {
        const paymentDate = window.prompt('Payment date (YYYY-MM-DD):', todayIso());
        if (!paymentDate) return;
        router.post(route('payroll.pay', payroll.id), { payment_date: paymentDate }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Payroll Details" />
            <div className="py-8">
                <div className="max-w-4xl mx-auto sm:px-6 lg:px-8">
                    {(flash?.success || flash?.error) && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${flash.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {flash.success || flash.error}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Payroll Management', href: route('admin.payroll-management') },
                            { label: 'Payroll', href: route('payroll.index') },
                            { label: 'Payroll Details' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <div className="flex flex-wrap items-center gap-3">
                                <h1 className="text-2xl font-bold text-gray-900">Payroll Details</h1>
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(status)}`}>
                                    {status}
                                </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {personLabel(payroll.employee_name, payroll.employee_identifier || payroll.employee_id)} · {payroll.month}/{payroll.year}
                                {payroll.staff_type ? ` · ${payroll.staff_type}` : ''}
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('payroll.index')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            {canApprove && status === 'generated' && (
                                <button
                                    type="button"
                                    onClick={handleApprove}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 text-sm"
                                >
                                    Approve
                                </button>
                            )}
                            {canPay && (status === 'approved' || status === 'generated') && (
                                <button
                                    type="button"
                                    onClick={handleMarkPaid}
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 text-sm"
                                >
                                    Mark Paid
                                </button>
                            )}
                            {canDownload && (
                                <a
                                    href={route('payroll.payslip.download', payroll.id)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600"
                                >
                                    <FontAwesomeIcon icon={faFilePdf} /> Download Payslip
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900">Attendance Summary</h2>
                        </div>
                        <div className="p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Working Days</p>
                                <p className="text-lg font-semibold">{attendance.working_days ?? payroll.working_days ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Present</p>
                                <p className="text-lg font-semibold">{attendance.present_days ?? payroll.present_days ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Absent</p>
                                <p className="text-lg font-semibold">{attendance.absent_days ?? payroll.absent_days ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Late</p>
                                <p className="text-lg font-semibold">{attendance.late_days ?? payroll.late_days ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Paid Leave</p>
                                <p className="text-lg font-semibold">{attendance.paid_leave_days ?? payroll.paid_leave_days ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Unpaid Leave</p>
                                <p className="text-lg font-semibold">{attendance.unpaid_leave_days ?? payroll.unpaid_leave_days ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Overtime Hours</p>
                                <p className="text-lg font-semibold">{attendance.overtime_hours ?? payroll.overtime_hours ?? 0}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Leave Deduction</p>
                                <p className="text-lg font-semibold text-red-600">
                                    {formatMoney(attendance.leave_deduction_amount ?? payroll.leave_deduction_amount ?? 0)}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Basic Salary</p>
                                    <p className="text-lg font-semibold">{formatMoney(payroll.basic_salary)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Allowances</p>
                                    <p className="text-lg font-semibold text-green-600">{formatMoney(payroll.total_allowances)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total Deductions</p>
                                    <p className="text-lg font-semibold text-red-600">{formatMoney(payroll.total_deductions)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Net Salary</p>
                                    <p className="text-lg font-bold">{formatMoney(payroll.net_salary)}</p>
                                </div>
                            </div>
                            {payroll.payment_date && (
                                <div>
                                    <p className="text-sm text-gray-500">Payment Date</p>
                                    <p className="font-medium">{payroll.payment_date}</p>
                                </div>
                            )}
                            {payroll.payment_method && (
                                <div>
                                    <p className="text-sm text-gray-500">Payment Method</p>
                                    <p className="font-medium">{payroll.payment_method}</p>
                                </div>
                            )}
                            <div>
                                <h2 className="text-sm font-medium text-gray-700 mb-2">Allowances</h2>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {allowances.length === 0 ? (
                                            <tr><td colSpan={2} className="px-4 py-3 text-gray-500 text-sm">None</td></tr>
                                        ) : (
                                            allowances.map((i) => (
                                                <tr key={i.id}>
                                                    <td className="px-4 py-2">{i.name}</td>
                                                    <td className="px-4 py-2 text-right">{formatMoney(i.amount)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div>
                                <h2 className="text-sm font-medium text-gray-700 mb-2">Deductions</h2>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Name</th>
                                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {deductions.length === 0 ? (
                                            <tr><td colSpan={2} className="px-4 py-3 text-gray-500 text-sm">None</td></tr>
                                        ) : (
                                            deductions.map((i) => (
                                                <tr key={i.id}>
                                                    <td className="px-4 py-2">{i.name}</td>
                                                    <td className="px-4 py-2 text-right">{formatMoney(i.amount)}</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
