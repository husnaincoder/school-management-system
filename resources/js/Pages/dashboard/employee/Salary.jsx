import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function monthLabel(month) {
    const index = parseInt(month, 10);
    return MONTHS[index] || month || '—';
}

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function paymentStatus(payroll) {
    return payroll?.payment_date ? 'Paid' : 'Pending';
}

export default function EmployeeSalary({ employee, payrolls }) {
    const items = payrolls?.data ?? payrolls ?? [];

    return (
        <AuthenticatedLayout>
            <Head title="My Salary" />
            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href={route('dashboard.employee')} className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-6 inline-block">← Back to Dashboard</Link>
                <h1 className="text-2xl font-bold text-gray-900">My Salary</h1>
                <p className="text-sm text-gray-500 mt-0.5">{employee?.user?.name ?? 'Employee'}</p>

                <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Basic</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Allowances</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Deductions</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Net</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Payment Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.length === 0 ? (
                                <tr><td colSpan={7} className="px-6 py-12 text-center text-gray-500">No payroll records yet.</td></tr>
                            ) : items.map((payroll) => (
                                <tr key={payroll.id}>
                                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{monthLabel(payroll.month)} {payroll.year}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{Number(payroll.basic_salary).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{Number(payroll.total_allowances ?? 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{Number(payroll.total_deductions ?? 0).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{Number(payroll.net_salary).toLocaleString()}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{formatDate(payroll.payment_date)}</td>
                                    <td className="px-6 py-4 text-sm capitalize">{paymentStatus(payroll)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
