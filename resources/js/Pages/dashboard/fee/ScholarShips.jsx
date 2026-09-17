import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faPercent, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const TYPE_LABELS = {
    percentage: 'Percentage (%)',
    fixed: 'Fixed Amount',
};

const emptyForm = { name: '', type: 'percentage', value: '' };

export default function ScholarShipsIndex({ scholarShips = [], filterType = '', types = [] }) {
    const { flash } = usePage().props;
    const list = Array.isArray(scholarShips) ? scholarShips : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const openAddModal = () => {
        setEditingItem(null);
        setData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setData({
            name: item.name || '',
            type: item.type || 'percentage',
            value: item.value ?? '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('scholarships.update', editingItem.id), {
                onSuccess: () => { setShowModal(false); setEditingItem(null); reset(); },
            });
        } else {
            post(route('scholarships.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete scholarship "${item.name}"?`)) return;
        router.delete(route('scholarships.destroy', item.id), {
            preserveScroll: true,
        });
    };

    const typeFilter = filterType || '';
    const allTypes = types && types.length ? types : Object.keys(TYPE_LABELS);

    const applyTypeFilter = (value) => {
        const params = value === '' ? {} : { type: value };
        router.get(route('scholarships.index'), params, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Scholarships" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="alert">
                            {banner.message}
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Scholarships' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faPercent} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Scholarships</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Manage scholarships / discounts (percentage or fixed amount) that can be applied to students.
                                </p>
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

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 justify-end">
                            <label htmlFor="type-filter" className="text-sm font-medium text-gray-700 shrink-0">Type</label>
                            <select
                                id="type-filter"
                                value={typeFilter}
                                onChange={(e) => applyTypeFilter(e.target.value)}
                                className="min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="">All</option>
                                {allTypes.map((t) => (
                                    <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Scholarships</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Total: {list.length} scholarship{list.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Scholarship
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No scholarships found. Click &quot;Add Scholarship&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 text-xs rounded bg-[#2E3D50] text-white">
                                                        {TYPE_LABELS[item.type] || item.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.type === 'percentage'
                                                        ? `${item.value}%`
                                                        : item.value}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(item)}
                                                        className="text-amber-500 hover:text-amber-600 mr-3"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add/Edit Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">
                                        {editingItem ? 'Edit Scholarship' : 'Add Scholarship'}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); setEditingItem(null); reset(); }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                            <input
                                                type="text"
                                                className={`w-full border rounded-md px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="e.g. Merit Scholarship 50%"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                maxLength={255}
                                                autoFocus
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                            <select
                                                className={`w-full border rounded-md px-3 py-2 ${errors.type ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.type}
                                                onChange={(e) => setData('type', e.target.value)}
                                            >
                                                {allTypes.map((t) => (
                                                    <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>
                                                ))}
                                            </select>
                                            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                                            <input
                                                type="number"
                                                className={`w-full border rounded-md px-3 py-2 ${errors.value ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.value}
                                                onChange={(e) => setData('value', e.target.value)}
                                                min={0}
                                                step="0.01"
                                            />
                                            {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
                                            <p className="text-xs text-gray-400 mt-1">
                                                If type is percentage, enter 0–100. If fixed, enter the currency amount.
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingItem(null); reset(); }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
                                            {editingItem ? 'Update' : 'Save'}
                                        </button>
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

