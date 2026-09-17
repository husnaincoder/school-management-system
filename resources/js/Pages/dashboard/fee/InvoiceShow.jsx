import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileInvoice, faArrowLeft, faPlus, faPen, faTrashCan, faUndo, faFilePdf } from '@fortawesome/free-solid-svg-icons';

const STATUS_LABELS = { unpaid: 'Unpaid', partial: 'Partial', paid: 'Paid' };

const emptyItemForm = { fee_type_id: '', description: '', amount: '' };
const emptyDiscountForm = { type: 'percentage', value: '' };
const emptyPaymentForm = { amount: '', method: 'cash', transaction_id: '', payment_date: new Date().toISOString().slice(0, 10) };
const emptyRefundForm = { amount: '', reason: '' };
const PAYMENT_METHOD_LABELS = { cash: 'Cash', bank: 'Bank', card: 'Card', online: 'Online', cheque: 'Cheque' };

export default function InvoiceShow({ invoice, feeTypes = [], backHref }) {
    const { flash, auth } = usePage().props;
    const userRoles = auth?.user?.roles ?? [];
    const canEdit = !userRoles.includes('student') && !userRoles.includes('parent');
    const [showAddItem, setShowAddItem] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [showAddDiscount, setShowAddDiscount] = useState(false);
    const [editingDiscount, setEditingDiscount] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const addForm = useForm({ ...emptyItemForm });
    const editForm = useForm({ ...emptyItemForm });
    const addDiscountForm = useForm({ ...emptyDiscountForm });
    const editDiscountForm = useForm({ ...emptyDiscountForm });
    const [showAddPayment, setShowAddPayment] = useState(false);
    const addPaymentForm = useForm({ ...emptyPaymentForm });
    const [showRefund, setShowRefund] = useState(false);
    const refundForm = useForm({ ...emptyRefundForm });
    const [editingFine, setEditingFine] = useState(false);
    const fineForm = useForm({
        fine_amount: invoice?.fine_amount != null ? String(invoice.fine_amount) : '0',
        resume_auto: false,
    });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const openAddItem = () => {
        setEditingItem(null);
        addForm.setData(emptyItemForm);
        setShowAddItem(true);
    };

    const openEditItem = (item) => {
        setEditingItem(item);
        editForm.setData({
            fee_type_id: String(item.fee_type_id ?? ''),
            description: item.description ?? '',
            amount: item.amount ?? '',
        });
        setShowAddItem(false);
    };

    const closeEdit = () => setEditingItem(null);

    const submitAddItem = (e) => {
        e.preventDefault();
        addForm.post(route('invoice-items.store', invoice.id), {
            onSuccess: () => { setShowAddItem(false); addForm.reset(); },
            onError: () => {},
        });
    };

    const submitEditItem = (e) => {
        e.preventDefault();
        if (!editingItem) return;
        editForm.put(route('invoice-items.update', { invoice: invoice.id, invoice_item: editingItem.id }), {
            onSuccess: () => { closeEdit(); editForm.reset(); },
            onError: () => {},
        });
    };

    const deleteItem = (item) => {
        if (!confirm('Remove this line item?')) return;
        router.delete(route('invoice-items.destroy', { invoice: invoice.id, invoice_item: item.id }));
    };

    const openAddDiscount = () => {
        setEditingDiscount(null);
        addDiscountForm.setData(emptyDiscountForm);
        setShowAddDiscount(true);
    };

    const openEditDiscount = (d) => {
        setEditingDiscount(d);
        editDiscountForm.setData({ type: d.type, value: d.value ?? '' });
        setShowAddDiscount(false);
    };

    const closeEditDiscount = () => setEditingDiscount(null);

    const submitAddDiscount = (e) => {
        e.preventDefault();
        addDiscountForm.post(route('invoice-discounts.store', invoice.id), {
            onSuccess: () => { setShowAddDiscount(false); addDiscountForm.reset(); },
            onError: () => {},
        });
    };

    const submitEditDiscount = (e) => {
        e.preventDefault();
        if (!editingDiscount) return;
        editDiscountForm.put(route('invoice-discounts.update', { invoice: invoice.id, invoice_discount: editingDiscount.id }), {
            onSuccess: () => { closeEditDiscount(); editDiscountForm.reset(); },
            onError: () => {},
        });
    };

    const deleteDiscount = (d) => {
        if (!confirm('Remove this discount?')) return;
        router.delete(route('invoice-discounts.destroy', { invoice: invoice.id, invoice_discount: d.id }));
    };

    const openEditFine = () => {
        fineForm.setData({
            fine_amount: invoice?.fine_amount != null ? String(invoice.fine_amount) : '0',
            resume_auto: false,
        });
        setEditingFine(true);
    };

    const submitFine = (e) => {
        e.preventDefault();
        fineForm.put(route('invoices.update-fine', invoice.id), {
            onSuccess: () => setEditingFine(false),
        });
    };

    const removeFine = () => {
        if (!confirm('Remove fine from this invoice? Auto late fine will stop updating this invoice until you re-enable it.')) return;
        router.put(route('invoices.update-fine', invoice.id), {
            fine_amount: 0,
            resume_auto: false,
        }, {
            preserveScroll: true,
            onSuccess: () => setEditingFine(false),
        });
    };

    const openAddPayment = () => {
        addPaymentForm.setData({ ...emptyPaymentForm, payment_date: new Date().toISOString().slice(0, 10) });
        setShowAddPayment(true);
    };

    const submitAddPayment = (e) => {
        e.preventDefault();
        addPaymentForm.post(route('invoice-payments.store', invoice.id), {
            onSuccess: () => { setShowAddPayment(false); addPaymentForm.reset(); },
            onError: () => {},
        });
    };

    const deletePayment = (p) => {
        if (!confirm('Remove this payment record?')) return;
        router.delete(route('invoice-payments.destroy', { invoice: invoice.id, payment: p.id }));
    };

    const submitRefund = (e) => {
        e.preventDefault();
        refundForm.post(route('invoice-refunds.store', invoice.id), {
            onSuccess: () => { setShowRefund(false); refundForm.reset(); },
            onError: () => {},
        });
    };

    if (!invoice) {
        return (
            <AuthenticatedLayout>
                <div className="py-8 max-w-7xl mx-auto px-6">
                    <p className="text-gray-500">Invoice not found.</p>
                    <Link href={route('invoices.index')} className="text-amber-500 hover:underline mt-2 inline-block">
                        Back to list
                    </Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    const feeTypesList = Array.isArray(feeTypes) ? feeTypes : [];

    return (
        <AuthenticatedLayout>
             <Head title="Invoice Details" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-2 rounded ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Invoices', href: route('invoices.index') },
                            { label: `Invoice ${invoice.invoice_no}` },
                        ]}
                    />

                    <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Invoice {invoice.invoice_no}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {invoice.enrollment_label} · {invoice.session} · {invoice.class} · {invoice.section}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={backHref || route('invoices.index')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                        <a
                            href={route(canEdit ? 'invoices.pdf' : 'invoices.view.pdf', invoice.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700"
                        >
                            <FontAwesomeIcon icon={faFilePdf} /> Download PDF
                        </a>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm text-gray-500">Invoice No</p>
                                    <p className="font-mono font-semibold text-gray-900">{invoice.invoice_no}</p>
                                </div>
                                <span className={`px-3 py-1 rounded text-sm font-medium ${
                                    invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                                    invoice.status === 'partial' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {STATUS_LABELS[invoice.status] || invoice.status}
                                </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500">Issue date:</span>
                                    <span className="ml-2 text-gray-900">{invoice.issue_date}</span>
                                </div>
                                <div>
                                    <span className="text-gray-500">Due date:</span>
                                    <span className="ml-2 text-gray-900">{invoice.due_date}</span>
                                </div>
                            </div>
                        </div>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h3 className="text-sm font-medium text-gray-500 uppercase mb-2">Amounts</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Total</span>
                                    <span className="font-medium">{Number(invoice.total_amount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Discount</span>
                                    <span>{Number(invoice.discount_amount)}</span>
                                </div>
                                <div className="flex justify-between items-start gap-2">
                                    <span className="text-gray-600">
                                        Fine
                                        {invoice.fine_manual ? (
                                            <span className="ml-1 text-xs text-amber-600">(manual)</span>
                                        ) : null}
                                    </span>
                                    <span className="text-right">
                                        <span className="block">{Number(invoice.fine_amount)}</span>
                                        {canEdit && !editingFine && (
                                            <span className="mt-1 flex justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={openEditFine}
                                                    className="text-xs text-amber-600 hover:text-amber-700 font-medium"
                                                >
                                                    Edit
                                                </button>
                                                {Number(invoice.fine_amount) > 0 && (
                                                    <button
                                                        type="button"
                                                        onClick={removeFine}
                                                        className="text-xs text-red-600 hover:text-red-700 font-medium"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </span>
                                        )}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Paid</span>
                                    <span>{Number(invoice.paid_amount)}</span>
                                </div>
                                <div className="flex justify-between col-span-2 pt-2 border-t border-gray-100">
                                    <span className="font-medium text-gray-900">Balance</span>
                                    <span className="font-semibold">{Number(invoice.balance)}</span>
                                </div>
                            </div>
                            {canEdit && editingFine && (
                                <form onSubmit={submitFine} className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                                    <p className="text-sm font-medium text-gray-700">Edit fine</p>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-600 mb-1">Fine amount</label>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={fineForm.data.fine_amount}
                                            onChange={(e) => fineForm.setData('fine_amount', e.target.value)}
                                            className="w-full rounded border-gray-300 text-sm"
                                            required
                                        />
                                        {fineForm.errors.fine_amount && (
                                            <p className="text-red-500 text-xs mt-0.5">{fineForm.errors.fine_amount}</p>
                                        )}
                                    </div>
                                    <label className="inline-flex items-start gap-2 text-sm text-gray-700">
                                        <input
                                            type="checkbox"
                                            className="mt-0.5 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                            checked={!!fineForm.data.resume_auto}
                                            onChange={(e) => fineForm.setData('resume_auto', e.target.checked)}
                                        />
                                        <span>
                                            Re-enable automatic late fine
                                            <span className="block text-xs text-gray-500">
                                                If checked, nightly job can update fine again from Late Fine Rules.
                                            </span>
                                        </span>
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="submit"
                                            disabled={fineForm.processing}
                                            className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50"
                                        >
                                            Save fine
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                fineForm.setData('fine_amount', '0');
                                                fineForm.setData('resume_auto', false);
                                            }}
                                            className="px-3 py-1.5 border border-red-200 text-red-700 rounded text-sm hover:bg-red-50"
                                        >
                                            Set to 0
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingFine(false)}
                                            className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                        <div className="px-6 py-4 border-b border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Discounts</h3>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={openAddDiscount}
                                        className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Add discount
                                    </button>
                                )}
                            </div>
                            {canEdit && showAddDiscount && (
                                <form onSubmit={submitAddDiscount} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                                            <select
                                                value={addDiscountForm.data.type}
                                                onChange={(e) => addDiscountForm.setData('type', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                            >
                                                <option value="percentage">Percentage</option>
                                                <option value="fixed">Fixed amount</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">{addDiscountForm.data.type === 'percentage' ? 'Percentage (%) *' : 'Amount *'}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={addDiscountForm.data.type === 'percentage' ? 100 : undefined}
                                                value={addDiscountForm.data.value}
                                                onChange={(e) => addDiscountForm.setData('value', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                required
                                            />
                                            {addDiscountForm.errors.value && <p className="text-red-500 text-xs mt-0.5">{addDiscountForm.errors.value}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={addDiscountForm.processing} className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50">
                                            Add
                                        </button>
                                        <button type="button" onClick={() => setShowAddDiscount(false)} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {canEdit && editingDiscount && (
                                <form onSubmit={submitEditDiscount} className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                                    <p className="text-sm font-medium text-gray-700">Edit discount</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Type *</label>
                                            <select
                                                value={editDiscountForm.data.type}
                                                onChange={(e) => editDiscountForm.setData('type', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                            >
                                                <option value="percentage">Percentage</option>
                                                <option value="fixed">Fixed amount</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">{editDiscountForm.data.type === 'percentage' ? 'Percentage (%) *' : 'Amount *'}</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                max={editDiscountForm.data.type === 'percentage' ? 100 : undefined}
                                                value={editDiscountForm.data.value}
                                                onChange={(e) => editDiscountForm.setData('value', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                required
                                            />
                                            {editDiscountForm.errors.value && <p className="text-red-500 text-xs mt-0.5">{editDiscountForm.errors.value}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={editDiscountForm.processing} className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50">
                                            Update
                                        </button>
                                        <button type="button" onClick={closeEditDiscount} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {invoice.discounts && invoice.discounts.length > 0 ? (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-left text-gray-500">
                                            <th className="pb-2">Type</th>
                                            <th className="pb-2">Value</th>
                                            <th className="pb-2 text-right">Amount</th>
                                            {canEdit && <th className="pb-2 w-20">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.discounts.map((d) => (
                                            <tr key={d.id}>
                                                <td className="py-2">{d.type === 'percentage' ? 'Percentage' : 'Fixed'}</td>
                                                <td className="py-2">{d.type === 'percentage' ? `${Number(d.value)}%` : Number(d.value)}</td>
                                                <td className="py-2 text-right">{Number(d.calculated_amount)}</td>
                                                {canEdit && (
                                                    <td className="py-2">
                                                        <button type="button" onClick={() => openEditDiscount(d)} className="text-amber-600 hover:text-amber-700 mr-2" title="Edit">
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button>
                                                        <button type="button" onClick={() => deleteDiscount(d)} className="text-red-600 hover:text-red-700" title="Delete">
                                                            <FontAwesomeIcon icon={faTrashCan} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm text-gray-500 py-2">{canEdit ? 'No discounts yet. Add one above.' : 'No discounts.'}</p>
                            )}
                        </div>
                        <div className="px-6 py-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Line items</h3>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={openAddItem}
                                        className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Add line item
                                    </button>
                                )}
                            </div>
                            {canEdit && showAddItem && (
                                <form onSubmit={submitAddItem} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Fee type *</label>
                                            <select
                                                value={addForm.data.fee_type_id}
                                                onChange={(e) => addForm.setData('fee_type_id', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                required
                                            >
                                                <option value="">Select</option>
                                                {feeTypesList.map((ft) => (
                                                    <option key={ft.id} value={ft.id}>{ft.name}</option>
                                                ))}
                                            </select>
                                            {addForm.errors.fee_type_id && <p className="text-red-500 text-xs mt-0.5">{addForm.errors.fee_type_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={addForm.data.description}
                                                onChange={(e) => addForm.setData('description', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                placeholder="Optional"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={addForm.data.amount}
                                                onChange={(e) => addForm.setData('amount', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                required
                                            />
                                            {addForm.errors.amount && <p className="text-red-500 text-xs mt-0.5">{addForm.errors.amount}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={addForm.processing} className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50">
                                            Add
                                        </button>
                                        <button type="button" onClick={() => setShowAddItem(false)} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {canEdit && editingItem && (
                                <form onSubmit={submitEditItem} className="mb-4 p-4 bg-amber-50 rounded-lg border border-amber-200 space-y-3">
                                    <p className="text-sm font-medium text-gray-700">Edit line item</p>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Fee type *</label>
                                            <select
                                                value={editForm.data.fee_type_id}
                                                onChange={(e) => editForm.setData('fee_type_id', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                required
                                            >
                                                <option value="">Select</option>
                                                {feeTypesList.map((ft) => (
                                                    <option key={ft.id} value={ft.id}>{ft.name}</option>
                                                ))}
                                            </select>
                                            {editForm.errors.fee_type_id && <p className="text-red-500 text-xs mt-0.5">{editForm.errors.fee_type_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                                            <input
                                                type="text"
                                                value={editForm.data.description}
                                                onChange={(e) => editForm.setData('description', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={editForm.data.amount}
                                                onChange={(e) => editForm.setData('amount', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                required
                                            />
                                            {editForm.errors.amount && <p className="text-red-500 text-xs mt-0.5">{editForm.errors.amount}</p>}
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={editForm.processing} className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50">
                                            Update
                                        </button>
                                        <button type="button" onClick={closeEdit} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {invoice.items && invoice.items.length > 0 ? (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-left text-gray-500">
                                            <th className="pb-2">Fee type</th>
                                            <th className="pb-2">Description</th>
                                            <th className="pb-2 text-right">Amount</th>
                                            {canEdit && <th className="pb-2 w-20">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.items.map((item) => (
                                            <tr key={item.id}>
                                                <td className="py-2">{item.fee_type?.name ?? '—'}</td>
                                                <td className="py-2">{item.description ?? '—'}</td>
                                                <td className="py-2 text-right">{Number(item.amount)}</td>
                                                {canEdit && (
                                                    <td className="py-2">
                                                        <button type="button" onClick={() => openEditItem(item)} className="text-amber-600 hover:text-amber-700 mr-2" title="Edit">
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button>
                                                        <button type="button" onClick={() => deleteItem(item)} className="text-red-600 hover:text-red-700" title="Delete">
                                                            <FontAwesomeIcon icon={faTrashCan} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm text-gray-500 py-2">{canEdit ? 'No line items yet. Add one above.' : 'No line items.'}</p>
                            )}
                        </div>
                        <div className="px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-sm font-medium text-gray-500 uppercase">Payments</h3>
                                {canEdit && (
                                    <button
                                        type="button"
                                        onClick={openAddPayment}
                                        className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Record payment
                                    </button>
                                )}
                            </div>
                            {canEdit && showAddPayment && (
                                <form onSubmit={submitAddPayment} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                value={addPaymentForm.data.amount}
                                                onChange={(e) => addPaymentForm.setData('amount', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                required
                                            />
                                            {addPaymentForm.errors.amount && <p className="text-red-500 text-xs mt-0.5">{addPaymentForm.errors.amount}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Method *</label>
                                            <select
                                                value={addPaymentForm.data.method}
                                                onChange={(e) => addPaymentForm.setData('method', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                            >
                                                {Object.entries(PAYMENT_METHOD_LABELS).map(([k, v]) => (
                                                    <option key={k} value={k}>{v}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Payment date *</label>
                                            <input
                                                type="date"
                                                value={addPaymentForm.data.payment_date}
                                                onChange={(e) => addPaymentForm.setData('payment_date', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                required
                                            />
                                            {addPaymentForm.errors.payment_date && <p className="text-red-500 text-xs mt-0.5">{addPaymentForm.errors.payment_date}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-600 mb-1">Transaction ID</label>
                                            <input
                                                type="text"
                                                value={addPaymentForm.data.transaction_id}
                                                onChange={(e) => addPaymentForm.setData('transaction_id', e.target.value)}
                                                className="w-full rounded border-gray-300 text-sm"
                                                placeholder="Optional"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button type="submit" disabled={addPaymentForm.processing} className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50">
                                            Record
                                        </button>
                                        <button type="button" onClick={() => setShowAddPayment(false)} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            )}
                            {invoice.payments && invoice.payments.length > 0 ? (
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-left text-gray-500">
                                            <th className="pb-2">Date</th>
                                            <th className="pb-2">Method</th>
                                            <th className="pb-2">Transaction ID</th>
                                            <th className="pb-2 text-right">Amount</th>
                                            {canEdit && <th className="pb-2 w-20">Actions</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {invoice.payments.map((p) => (
                                            <tr key={p.id}>
                                                <td className="py-2">{p.payment_date}</td>
                                                <td className="py-2">{PAYMENT_METHOD_LABELS[p.method] ?? p.method}</td>
                                                <td className="py-2">{p.transaction_id ?? '—'}</td>
                                                <td className="py-2 text-right">{Number(p.amount)}</td>
                                                {canEdit && (
                                                    <td className="py-2">
                                                        <button type="button" onClick={() => deletePayment(p)} className="text-red-600 hover:text-red-700" title="Remove">
                                                            <FontAwesomeIcon icon={faTrashCan} />
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            ) : (
                                <p className="text-sm text-gray-500 py-2">{canEdit ? 'No payments yet. Record one above.' : 'No payments yet.'}</p>
                            )}
                        </div>
                        {Number(invoice.paid_amount || 0) > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-medium text-gray-500 uppercase">Refunds</h3>
                                    {canEdit && (
                                        <button
                                            type="button"
                                            onClick={() => setShowRefund(!showRefund)}
                                            className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
                                        >
                                            <FontAwesomeIcon icon={faUndo} /> {showRefund ? 'Cancel' : 'Refund'}
                                        </button>
                                    )}
                                </div>
                                {canEdit && showRefund && (
                                    <form onSubmit={submitRefund} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                                        <p className="text-xs text-gray-600">Max refundable: {Number(invoice.paid_amount).toFixed(2)}</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Amount *</label>
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    min="0.01"
                                                    max={Number(invoice.paid_amount)}
                                                    value={refundForm.data.amount}
                                                    onChange={(e) => refundForm.setData('amount', e.target.value)}
                                                    className="w-full rounded border-gray-300 text-sm"
                                                    required
                                                />
                                                {refundForm.errors.amount && <p className="text-red-500 text-xs mt-0.5">{refundForm.errors.amount}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-medium text-gray-600 mb-1">Reason *</label>
                                                <input
                                                    type="text"
                                                    value={refundForm.data.reason}
                                                    onChange={(e) => refundForm.setData('reason', e.target.value)}
                                                    className="w-full rounded border-gray-300 text-sm"
                                                    placeholder="e.g. Duplicate payment"
                                                    required
                                                />
                                                {refundForm.errors.reason && <p className="text-red-500 text-xs mt-0.5">{refundForm.errors.reason}</p>}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button type="submit" disabled={refundForm.processing} className="px-3 py-1.5 bg-amber-500 text-white rounded text-sm hover:bg-amber-600 disabled:opacity-50">
                                                Process refund
                                            </button>
                                            <button type="button" onClick={() => setShowRefund(false)} className="px-3 py-1.5 border border-gray-300 rounded text-sm hover:bg-gray-50">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                )}
                                {invoice.refunds && invoice.refunds.length > 0 ? (
                                    <table className="min-w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-left text-gray-500">
                                                <th className="pb-2">Amount</th>
                                                <th className="pb-2">Reason</th>
                                                <th className="pb-2">Date</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {invoice.refunds.map((r) => (
                                                <tr key={r.id}>
                                                    <td className="py-2 text-right">{Number(r.amount).toFixed(2)}</td>
                                                    <td className="py-2">{r.reason ?? '—'}</td>
                                                    <td className="py-2">{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <p className="text-sm text-gray-500 py-2">No refunds yet.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
