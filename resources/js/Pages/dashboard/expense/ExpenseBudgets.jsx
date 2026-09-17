import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faChartLine, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function ExpenseBudgets({ budgets = [], categories = [], filterYear }) {
    const { flash } = usePage().props;
    const list = Array.isArray(budgets) ? budgets : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm({
        category_id: '',
        budget_amount: '',
        year: filterYear || new Date().getFullYear(),
        month: '',
    });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const openAdd = () => {
        setEditingItem(null);
        setData({ category_id: '', budget_amount: '', year: filterYear || new Date().getFullYear(), month: '' });
        setShowModal(true);
    };
    const openEdit = (item) => {
        setEditingItem(item);
        setData({ budget_amount: String(item.budget_amount) });
        setShowModal(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('expense-budgets.update', editingItem.id), { preserveScroll: true, onSuccess: () => { setShowModal(false); reset(); } });
        } else {
            post(route('expense-budgets.store'), { preserveScroll: true, onSuccess: () => { setShowModal(false); reset(); } });
        }
    };
    const handleDelete = (item) => {
        if (!window.confirm(`Delete budget for ${item.category_name}?`)) return;
        router.delete(route('expense-budgets.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Expense Budgets" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{banner.message}</div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Expense Management', href: route('admin.expense-management') },
                            { label: 'Budgets' },
                        ]}
                    />

                    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChartLine} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Expense Budgets</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Set and track budgets by category and year.</p>
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
                            <select
                                value={filterYear}
                                onChange={(e) => router.get(route('expense-budgets.index'), { year: e.target.value })}
                                className="border border-gray-300 rounded-lg px-8 py-2"
                            >
                                {Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">
                                <FontAwesomeIcon icon={faPlus} /> Add Budget
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Budget</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Spent</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Remaining</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No budgets for this year. Add one to get started.</td></tr>
                                ) : (
                                    list.map((b) => (
                                        <tr key={b.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{b.category_name}</td>
                                            <td className="px-6 py-4 text-right">{b.budget_amount}</td>
                                            <td className="px-6 py-4 text-right">{b.spent_amount}</td>
                                            <td className="px-6 py-4 text-right font-medium">{b.remaining}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button type="button" onClick={() => openEdit(b)} className="text-amber-600 hover:text-amber-700 mr-3"><FontAwesomeIcon icon={faPen} /></button>
                                                <button type="button" onClick={() => handleDelete(b)} className="text-red-600 hover:text-red-700"><FontAwesomeIcon icon={faTrashCan} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-semibold mb-4">{editingItem ? 'Edit Budget' : 'Add Budget'}</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {!editingItem && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
                                                <select value={data.category_id} onChange={(e) => setData('category_id', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required>
                                                    <option value="">Select category</option>
                                                    {(categories || []).map((c) => (
                                                        <option key={c.id} value={c.id}>{c.name}</option>
                                                    ))}
                                                </select>
                                                {errors.category_id && <p className="text-red-500 text-sm mt-1">{errors.category_id}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Year *</label>
                                                <input type="number" min={2000} max={2100} value={data.year} onChange={(e) => setData('year', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                                {errors.year && <p className="text-red-500 text-sm mt-1">{errors.year}</p>}
                                            </div>
                                        </>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Budget amount *</label>
                                        <input type="number" step="0.01" min={0} value={editingItem ? data.budget_amount : data.budget_amount} onChange={(e) => setData('budget_amount', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        {errors.budget_amount && <p className="text-red-500 text-sm mt-1">{errors.budget_amount}</p>}
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={() => { setShowModal(false); reset(); }} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50">Save</button>
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
