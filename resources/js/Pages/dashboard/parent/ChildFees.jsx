import React from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDollarSign, faArrowLeft, faFileInvoice } from '@fortawesome/free-solid-svg-icons';

const STATUS_LABELS = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };
const STATUS_CLASS = { unpaid: 'bg-red-100 text-red-800', partial: 'bg-amber-100 text-amber-800', paid: 'bg-green-100 text-green-800' };

export default function ChildFees({ student, invoices = [] }) {
    const list = Array.isArray(invoices) ? invoices : [];
    const name = student ? [student.first_name, student.last_name].filter(Boolean).join(' ') : 'Child';

    return (
        <AuthenticatedLayout>
             <Head title="Child Fees" />
            <div className="py-8">
                <div className="max-w-5xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-4">
                        <Link href={route('parent.fee')} className="text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faDollarSign} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{name} – Fee</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Invoices and payment status</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        {list.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue / Due</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {list.map((inv) => (
                                            <tr key={inv.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-3 font-mono text-sm">{inv.invoice_no}</td>
                                                <td className="px-6 py-3 text-sm text-gray-600">{inv.issue_date} / {inv.due_date}</td>
                                                <td className="px-6 py-3 text-sm text-right">{Number(inv.total_amount).toFixed(2)}</td>
                                                <td className="px-6 py-3 text-sm text-right">{Number(inv.paid_amount).toFixed(2)}</td>
                                                <td className="px-6 py-3 text-sm text-right font-medium">{Number(inv.balance).toFixed(2)}</td>
                                                <td className="px-6 py-3 text-center">
                                                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_CLASS[inv.status] || 'bg-gray-100 text-gray-800'}`}>
                                                        {STATUS_LABELS[inv.status] || inv.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-3 text-right">
                                                    <Link href={route('invoices.view', inv.id)} className="text-amber-600 hover:underline text-sm font-medium">View</Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="px-6 py-12 text-center text-gray-500">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-4xl text-gray-300 mb-3" />
                                <p>No invoices yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
