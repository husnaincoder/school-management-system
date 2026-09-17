import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf, faArrowLeft, faFileInvoiceDollar } from '@fortawesome/free-solid-svg-icons';

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];

function personLabel(name, code) {
    const n = (name || '').trim() || '—';
    const c = code != null ? String(code).trim() : '';
    return c && c !== '—' ? `${n} (${c})` : n;
}

function formatMoney(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 }) : '0';
}

function monthName(m) {
    if (!m) return '—';
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

export default function SalarySlips({ payrolls = [], filterMonth = '', filterYear = '' }) {
    const list = Array.isArray(payrolls) ? payrolls : [];

    const applyFilters = (overrides = {}) => {
        const params = {
            month: filterMonth || undefined,
            year: filterYear || undefined,
            ...overrides,
        };
        Object.keys(params).forEach((k) => {
            if (params[k] === '' || params[k] == null) delete params[k];
        });
        router.get(route('payroll.slips.index'), params, { preserveState: true, replace: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Salary Slips" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Payroll Management', href: route('admin.payroll-management') },
                            { label: 'Salary Slips' },
                        ]}
                    />

                    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-amber-50">
                                <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Salary Slips</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Download payroll salary slips as PDF.</p>
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
                                value={filterMonth || ''}
                                onChange={(e) => applyFilters({ month: e.target.value || undefined })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">All Months</option>
                                {MONTHS.map((m) => (
                                    <option key={m} value={m}>{monthName(m)}</option>
                                ))}
                            </select>
                            <select
                                value={filterYear || ''}
                                onChange={(e) => applyFilters({ year: e.target.value || undefined })}
                                className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">All Years</option>
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                    <option key={y} value={String(y)}>{y}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Net</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Download PDF</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No salary slips found.</td>
                                        </tr>
                                    ) : (
                                        list.map((p) => (
                                            <tr key={p.id}>
                                                <td className="px-6 py-4 text-gray-700">
                                                    {monthName(p.month)} {p.year}
                                                </td>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {personLabel(p.employee_name, p.employee_identifier)}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 capitalize">{p.staff_type || '—'}</td>
                                                <td className="px-6 py-4 text-right font-medium">{formatMoney(p.net_salary)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusBadgeClass(p.status)}`}>
                                                        {p.status || 'generated'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <a
                                                        href={route('payroll.payslip.download', p.id)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm"
                                                    >
                                                        <FontAwesomeIcon icon={faFilePdf} />
                                                        PDF
                                                    </a>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
