import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';

const MONTHS = ['', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const money = (n) =>
    Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });

function monthLabel(month) {
    const index = parseInt(month, 10);
    return MONTHS[index] || month || '—';
}

export default function MySalarySlips({ staffName, staffType, slips = [], dashboardRoute }) {
    const list = Array.isArray(slips) ? slips : [];

    return (
        <AuthenticatedLayout>
            <Head title="My Salary Slips" />
            <div className="py-8 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href={route(dashboardRoute)} className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-6 inline-block">
                    ← Back to Dashboard
                </Link>
                <h1 className="text-2xl font-bold text-gray-900">My Salary Slips</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {staffName} · {staffType}
                </p>

                <div className="mt-6 space-y-3">
                    {list.length === 0 ? (
                        <div className="rounded-xl border border-gray-200 bg-white px-6 py-10 text-center text-gray-500">
                            No salary slips available yet.
                        </div>
                    ) : (
                        list.map((slip) => (
                            <div
                                key={slip.id}
                                className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 bg-white px-5 py-4 shadow-sm"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {monthLabel(slip.month)} {slip.year}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-0.5 capitalize">Status: {slip.status}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="font-semibold text-gray-900">Rs. {money(slip.net_salary)}</span>
                                    <a
                                        href={route('payroll.payslip.download', slip.id)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-3 py-2 text-sm font-medium text-white hover:bg-amber-600"
                                    >
                                        <FontAwesomeIcon icon={faDownload} />
                                        Download
                                    </a>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
