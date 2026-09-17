import React, { useState, useEffect } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faPen, faTrashCan, faFileInvoice, faFilter, faFilePdf, faFileExcel, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const statusClass = (s) => {
    const map = { pending: 'bg-yellow-100 text-yellow-800', partial: 'bg-blue-100 text-blue-800', paid: 'bg-green-100 text-green-800' };
    return map[s] || 'bg-gray-100 text-gray-800';
};

export default function Expenses({ expenses = [], categories = [], vendors = [], filters = {} }) {
    const { flash } = usePage().props;
    const list = Array.isArray(expenses) ? expenses : [];
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [status, setStatus] = useState(filters.status || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');
    const [fromDate, setFromDate] = useState(filters.from_date || '');
    const [toDate, setToDate] = useState(filters.to_date || '');
    const [selectedIds, setSelectedIds] = useState([]);

    const allIds = list.map((e) => e.id);
    const allSelected = allIds.length > 0 && selectedIds.length === allIds.length;
    const someSelected = selectedIds.length > 0;

    const toggleOne = (id) => {
        setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    };
    const toggleAll = () => {
        setSelectedIds(allSelected ? [] : [...allIds]);
    };

    const buildExportParams = () => {
        if (someSelected) {
            const params = new URLSearchParams();
            selectedIds.forEach((id) => params.append('ids[]', id));
            return params.toString();
        }
        const params = new URLSearchParams();
        if (status) params.set('status', status);
        if (categoryId) params.set('category_id', categoryId);
        if (fromDate) params.set('from_date', fromDate);
        if (toDate) params.set('to_date', toDate);
        return params.toString();
    };

    const exportPdf = () => {
        const qs = buildExportParams();
        window.location.href = route('expenses.export.pdf') + (qs ? `?${qs}` : '');
    };
    const exportExcel = () => {
        const qs = buildExportParams();
        window.location.href = route('expenses.export.excel') + (qs ? `?${qs}` : '');
    };

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const applyFilters = () => {
        router.get(route('expenses.index'), { status: status || undefined, category_id: categoryId || undefined, from_date: fromDate || undefined, to_date: toDate || undefined }, { preserveState: true });
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete expense ${item.expense_number}?`)) return;
        router.delete(route('expenses.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Expenses" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{banner.message}</div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Expense Management', href: route('admin.expense-management') },
                            { label: 'Expenses' },
                        ]}
                    />

                    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faFileInvoice} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Expenses</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage expenses, items and payments.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.expense-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <button type="button" onClick={exportPdf} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700">
                                <FontAwesomeIcon icon={faFilePdf} /> Download PDF
                            </button>
                            <button type="button" onClick={exportExcel} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700">
                                <FontAwesomeIcon icon={faFileExcel} /> Download Excel
                            </button>
                            <a href={route('expenses.create')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">
                                <FontAwesomeIcon icon={faPlus} /> Add Expense
                            </a>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FontAwesomeIcon icon={faFilter} className="text-amber-500" /> Filters</h2>
                        <div className="flex flex-wrap gap-3 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                <select value={status} onChange={(e) => setStatus(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
                                    <option value="">All</option>
                                    <option value="pending">Pending</option>
                                    <option value="partial">Partial</option>
                                    <option value="paid">Paid</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Category</label>
                                <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm">
                                    <option value="">All</option>
                                    {(categories || []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
                                <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
                                <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="border border-gray-300 rounded px-3 py-2 text-sm" />
                            </div>
                            <button type="button" onClick={applyFilters} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm font-medium">Apply</button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">
                                        <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={list.length === 0} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" title="Select all" />
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Paid</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr><td colSpan={9} className="px-6 py-8 text-center text-gray-500">No expenses. Add one to get started.</td></tr>
                                ) : (
                                    list.map((e) => (
                                        <tr key={e.id}>
                                            <td className="px-4 py-4">
                                                <input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => toggleOne(e.id)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                            </td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{e.expense_number}</td>
                                            <td className="px-6 py-4 text-gray-600">{e.expense_date}</td>
                                            <td className="px-6 py-4 text-gray-600">{e.category_name || '—'}</td>
                                            <td className="px-6 py-4 text-gray-600">{e.vendor_name || '—'}</td>
                                            <td className="px-6 py-4 text-right">{e.total_amount}</td>
                                            <td className="px-6 py-4 text-right">{e.paid_amount}</td>
                                            <td className="px-6 py-4"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusClass(e.status)}`}>{e.status}</span></td>
                                            <td className="px-6 py-4 text-right">
                                                <a href={route('expenses.show', e.id)} className="text-amber-600 hover:text-amber-700 mr-3" title="View"><FontAwesomeIcon icon={faEye} /></a>
                                                <a href={route('expenses.edit', e.id)} className="text-blue-600 hover:text-blue-700 mr-3" title="Edit"><FontAwesomeIcon icon={faPen} /></a>
                                                <button type="button" onClick={() => handleDelete(e)} className="text-red-600 hover:text-red-700" title="Delete"><FontAwesomeIcon icon={faTrashCan} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
