import React, { useState, useEffect, useMemo } from 'react';
import { Head, useForm, usePage, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faArrowLeft, faFileInvoice } from '@fortawesome/free-solid-svg-icons';

const emptyItem = () => ({ item_name: '', quantity: 1, unit_price: '', total_price: 0 });

const selectInputClass = (hasError) =>
    `w-full border rounded px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`;

export default function ExpenseForm({ expense = null, categories = [], vendors = [] }) {
    const { flash, errors } = usePage().props;
    const isEdit = !!expense?.id;
    const initialItems = (expense?.items && expense.items.length > 0) ? expense.items.map((i) => ({ ...i, quantity: i.quantity, unit_price: String(i.unit_price), total_price: Number(i.total_price) })) : [emptyItem()];
    const { data, setData, post, put, processing } = useForm({
        category_id: expense?.category_id ? String(expense.category_id) : '',
        vendor_id: expense?.vendor_id ? String(expense.vendor_id) : '',
        expense_date: expense?.expense_date || new Date().toISOString().slice(0, 10),
        notes: expense?.notes || '',
        items: initialItems,
    });
    const [banner, setBanner] = useState({ type: '', message: '' });

    const categoryOptions = useMemo(
        () =>
            (categories || []).map((c) => ({
                value: String(c.id),
                label: c.name,
                searchText: c.name,
            })),
        [categories]
    );

    const vendorOptions = useMemo(
        () => [
            { value: '', label: 'None (no vendor)', searchText: 'none optional' },
            ...(vendors || []).map((v) => ({
                value: String(v.id),
                label: v.name,
                searchText: v.name,
            })),
        ],
        [vendors]
    );

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const updateItem = (idx, field, value) => {
        const next = [...data.items];
        next[idx] = { ...next[idx], [field]: value };
        if (field === 'quantity' || field === 'unit_price') {
            const qty = field === 'quantity' ? Number(value) : Number(next[idx].quantity);
            const unit = field === 'unit_price' ? Number(value) : Number(next[idx].unit_price);
            next[idx].total_price = isNaN(qty) || isNaN(unit) ? 0 : Math.round(qty * unit * 100) / 100;
        }
        setData('items', next);
    };

    const addRow = () => setData('items', [...data.items, emptyItem()]);
    const removeRow = (idx) => {
        if (data.items.length <= 1) return;
        setData('items', data.items.filter((_, i) => i !== idx));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const submitData = {
            ...data,
            items: data.items.map((row) => ({
                item_name: row.item_name,
                quantity: Number(row.quantity) || 1,
                unit_price: Number(row.unit_price) || 0,
            })),
        };
        if (isEdit) {
            put(route('expenses.update', expense.id), { data: submitData, preserveScroll: true });
        } else {
            post(route('expenses.store'), { data: submitData });
        }
    };

    const total = data.items.reduce((sum, row) => sum + (Number(row.total_price) || 0), 0);

    return (
        <AuthenticatedLayout>
            <Head title="Expense Form" />
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
                            { label: isEdit ? 'Edit Expense' : 'New Expense' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Expense' : 'New Expense'}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Enter expense details and line items.</p>
                            </div>
                        </div>
                        <Link
                            href={route('expenses.index')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                    <SearchableSelect
                                        options={categoryOptions}
                                        value={data.category_id ? String(data.category_id) : ''}
                                        onChange={(value) => setData('category_id', value)}
                                        placeholder="Search category..."
                                        inputClassName={selectInputClass(!!errors.category_id)}
                                        emptyText="No categories found"
                                    />
                                    {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                                    <SearchableSelect
                                        options={vendorOptions}
                                        value={data.vendor_id ? String(data.vendor_id) : ''}
                                        onChange={(value) => setData('vendor_id', value)}
                                        placeholder="Search vendor (optional)..."
                                        inputClassName={selectInputClass(false)}
                                        emptyText="No vendors found"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Expense date *</label>
                                    <input type="date" value={data.expense_date} onChange={(e) => setData('expense_date', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                    {errors.expense_date && <p className="text-red-500 text-sm mt-1">{errors.expense_date}</p>}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                                <textarea value={data.notes} onChange={(e) => setData('notes', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" rows={2} />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-2">
                                    <label className="text-sm font-medium text-gray-700">Line items *</label>
                                    <button type="button" onClick={addRow} className="text-sm text-amber-600 hover:text-amber-700 flex items-center gap-1">
                                        <FontAwesomeIcon icon={faPlus} /> Add row
                                    </button>
                                </div>
                                <div className="border border-gray-200 rounded overflow-hidden">
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-24">Qty</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Unit price</th>
                                                <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase w-28">Total</th>
                                                <th className="w-10" />
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {data.items.map((row, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-3 py-2">
                                                        <input type="text" value={row.item_name} onChange={(e) => updateItem(idx, 'item_name', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Item name" required />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <input type="number" min={1} value={row.quantity} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right" />
                                                    </td>
                                                    <td className="px-3 py-2 text-right">
                                                        <input type="number" step="0.01" min={0} value={row.unit_price} onChange={(e) => updateItem(idx, 'unit_price', e.target.value)} className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right" />
                                                    </td>
                                                    <td className="px-3 py-2 text-right text-sm font-medium">{row.total_price?.toFixed(2) ?? '0.00'}</td>
                                                    <td className="px-3 py-2">
                                                        <button type="button" onClick={() => removeRow(idx)} className="text-red-500 hover:text-red-700" disabled={data.items.length <= 1}>
                                                            <FontAwesomeIcon icon={faTrashCan} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                                {errors.items && <p className="text-red-500 text-sm mt-1">{errors.items}</p>}
                                <p className="text-sm text-gray-500 mt-2">Total: <strong>{total.toFixed(2)}</strong></p>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Link href={route('expenses.index')} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</Link>
                                <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 disabled:opacity-50">
                                    {isEdit ? 'Update' : 'Create'} Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
