import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function FeeReports({
    dailyCollection = 0,
    monthlyCollection = 0,
    classWiseCollection = {},
    defaulters = [],
    fineReport = 0,
    scholarshipReport = 0,
    incomeSummary = {},
    filters = {},
}) {
    return (
        <AuthenticatedLayout>
            <Head title="Fee Reports" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Fee Reports' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChartLine} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Fee Reports</h1>
                                <p className="text-sm text-gray-500 mt-0.5">View fee collection and outstanding reports.</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.accountant-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Daily Collection</p>
                            <p className="text-xl font-semibold">{Number(dailyCollection)}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Monthly Collection</p>
                            <p className="text-xl font-semibold">{Number(monthlyCollection)}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Fine (period)</p>
                            <p className="text-xl font-semibold">{Number(fineReport)}</p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                            <p className="text-sm text-gray-500">Scholarship / Discount (period)</p>
                            <p className="text-xl font-semibold">{Number(scholarshipReport)}</p>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Defaulters (balance &gt; 0)</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-gray-500 uppercase">Invoice</th>
                                        <th className="px-6 py-3 text-left text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-gray-500 uppercase">Due date</th>
                                        <th className="px-6 py-3 text-right text-gray-500 uppercase">Balance</th>
                                        <th className="px-6 py-3 text-right text-gray-500 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {defaulters.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-4 text-center text-gray-500">No defaulters</td></tr>
                                    ) : (
                                        defaulters.map((d) => (
                                            <tr key={d.id}>
                                                <td className="px-6 py-3">{d.invoice_no}</td>
                                                <td className="px-6 py-3">{d.enrollment_label}</td>
                                                <td className="px-6 py-3">{d.due_date}</td>
                                                <td className="px-6 py-3 text-right">{Number(d.balance)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <Link href={route('invoices.show', d.id)} className="text-amber-600 hover:underline">View</Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold mb-2">Income by method</h2>
                        <ul className="space-y-1 text-sm">
                            {Object.entries(incomeSummary).map(([method, total]) => (
                                <li key={method} className="flex justify-between"><span className="capitalize">{method}</span><span>{Number(total)}</span></li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
