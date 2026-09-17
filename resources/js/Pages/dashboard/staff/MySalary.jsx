import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilePdf } from '@fortawesome/free-solid-svg-icons';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const money = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function monthLabel(month) {
    const index = parseInt(month, 10);
    return MONTHS[index] || month || '—';
}

const statusClass = {
    generated: 'bg-blue-100 text-blue-800',
    approved: 'bg-amber-100 text-amber-800',
    paid: 'bg-green-100 text-green-800',
};

export default function MySalary({ staffName, staffType, payrolls, dashboardRoute }) {
    const items = payrolls?.data ?? payrolls ?? [];

    return (
        <AuthenticatedLayout>
            <Head title="My Salary" />
            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href={route(dashboardRoute)} className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-6 inline-block">
                    ← Back to Dashboard
                </Link>
                <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Salary</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {staffName} · {staffType}
                        </p>
                    </div>
                    <Link href={route('staff.salary-slips')} className="text-sm font-medium text-amber-600 hover:text-amber-700">
                        My Salary Slips →
                    </Link>
                </div>

                <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Gross</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Deduction</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Net</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Slip</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                                        No payroll records yet.
                                    </td>
                                </tr>
                            ) : (
                                items.map((payroll) => (
                                    <tr key={payroll.id}>
                                        <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                            {monthLabel(payroll.month)} {payroll.year}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-600">
                                            {money(Number(payroll.basic_salary) + Number(payroll.total_allowances || 0))}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right text-gray-600">
                                            {money(payroll.total_deductions)}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-right font-semibold text-gray-900">
                                            {money(payroll.net_salary)}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium capitalize ${statusClass[payroll.status] || 'bg-gray-100 text-gray-700'}`}>
                                                {payroll.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {payroll.can_download ? (
                                                <a
                                                    href={route('payroll.payslip.download', payroll.id)}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-blue-600 hover:text-blue-700"
                                                    title="Download salary slip"
                                                >
                                                    <FontAwesomeIcon icon={faFilePdf} />
                                                </a>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
