import React, { useState, useEffect } from 'react';
import {Head, router, useForm, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPen, faTrashCan, faPlus, faMoneyBillWave, faFileInvoice } from '@fortawesome/free-solid-svg-icons';

const statusClass = (s) => {
    const map = { pending: 'bg-yellow-100 text-yellow-800', partial: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800' };
    return map[s] || 'bg-gray-100 text-gray-800';
};

export default function ExpenseShow({ expense }) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: '',
        transaction_id: '',
        remarks: '',
    });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    if (!expense) return null;

    const items = expense.items || [];
    const payments = expense.payments || [];

    const handleAddPayment = (e) => {
        e.preventDefault();
        post(route('expenses.payments.store', expense.id), {
            onSuccess: () => { setShowPaymentModal(false); reset(); setData('payment_date', new Date().toISOString().slice(0, 10)); },
        });
    };

    const handleDelete = () => {
        if (!window.confirm('Delete this expense? This cannot be undone.')) return;
        router.delete(route('expenses.destroy', expense.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Expense Details" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{banner.message}</div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Expense Management', href: route('admin.expense-management') },
                            { label: 'Expenses', href: route('expenses.index') },
                            { label: expense.expense_number },
                        ]}
                    />

                    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{expense.expense_number}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {expense.category_name}{expense.vendor_name ? ` · ${expense.vendor_name}` : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('expenses.index')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <Link href={route('expenses.edit', expense.id)} className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                                <FontAwesomeIcon icon={faPen} /> Edit
                            </Link>
                            <button type="button" onClick={handleDelete} className="inline-flex items-center gap-2 px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50">
                                <FontAwesomeIcon icon={faTrashCan} /> Delete
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Summary</h2>
                            </div>
                            <span className={`px-3 py-1 rounded text-sm font-medium ${statusClass(expense.status)}`}>{expense.status}</span>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">Date</p>
                                    <p className="font-medium">{expense.expense_date}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Total</p>
                                    <p className="font-semibold">{expense.total_amount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Paid</p>
                                    <p className="font-semibold text-green-600">{expense.paid_amount}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Due</p>
                                    <p className="font-semibold text-red-600">{expense.due_amount}</p>
                                </div>
                            </div>
                            {expense.notes && (
                                <div>
                                    <p className="text-sm text-gray-500">Notes</p>
                                    <p className="text-gray-700">{expense.notes}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                        <div className="px-6 py-3 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Line items</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Unit price</th>
                                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {items.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No items</td></tr>
                                    ) : (
                                        items.map((i) => (
                                            <tr key={i.id}>
                                                <td className="px-6 py-3 font-medium text-gray-900">{i.item_name}</td>
                                                <td className="px-6 py-3 text-right">{i.quantity}</td>
                                                <td className="px-6 py-3 text-right">{i.unit_price}</td>
                                                <td className="px-6 py-3 text-right">{i.total_price}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mb-6">
                        <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                            <h2 className="text-lg font-semibold text-gray-900">Payments</h2>
                            {Number(expense.due_amount) > 0 && (
                                <button type="button" onClick={() => setShowPaymentModal(true)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600">
                                    <FontAwesomeIcon icon={faPlus} /> Add payment
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {payments.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-4 text-center text-gray-500">No payments yet</td></tr>
                                    ) : (
                                        payments.map((p) => (
                                            <tr key={p.id}>
                                                <td className="px-6 py-3">{p.payment_date}</td>
                                                <td className="px-6 py-3 text-right font-medium">{p.amount}</td>
                                                <td className="px-6 py-3 text-gray-600">{p.payment_method || '—'}</td>
                                                <td className="px-6 py-3 text-gray-600">{p.remarks || '—'}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showPaymentModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><FontAwesomeIcon icon={faMoneyBillWave} className="text-amber-500" /> Add payment</h2>
                                <form onSubmit={handleAddPayment} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                        <input type="number" step="0.01" min="0.01" value={data.amount} onChange={(e) => setData('amount', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                                        <p className="text-xs text-gray-500 mt-1">Due: {expense.due_amount}</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment date *</label>
                                        <input type="date" value={data.payment_date} onChange={(e) => setData('payment_date', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        {errors.payment_date && <p className="text-red-500 text-sm mt-1">{errors.payment_date}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Payment method</label>
                                        <input type="text" value={data.payment_method} onChange={(e) => setData('payment_method', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="e.g. Bank, Cash" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Transaction ID</label>
                                        <input type="text" value={data.transaction_id} onChange={(e) => setData('transaction_id', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <textarea value={data.remarks} onChange={(e) => setData('remarks', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" rows={2} />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={() => { setShowPaymentModal(false); reset(); }} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50">Record payment</button>
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
