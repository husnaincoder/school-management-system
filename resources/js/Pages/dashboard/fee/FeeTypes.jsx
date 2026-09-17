import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faMoneyBillWave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const CATEGORY_LABELS = {
    tuition: 'Tuition',
    one_time: 'One Time',
    monthly: 'Monthly',
    fine: 'Fine',
    optional: 'Optional',
};

const emptyForm = { name: '', category: 'monthly', is_refundable: false };

export default function FeeTypesIndex({ feeTypes = [], filterCategory = '', categories = [] }) {
    const { flash } = usePage().props;
    const list = Array.isArray(feeTypes) ? feeTypes : [];
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
            category: item.category || 'monthly',
            is_refundable: item.is_refundable ?? false,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('fee-types.update', editingItem.id), {
                onSuccess: () => { setShowModal(false); setEditingItem(null); reset(); },
            });
        } else {
            post(route('fee-types.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete fee type "${item.name}"?`)) return;
        router.delete(route('fee-types.destroy', item.id), {
            preserveScroll: true,
        });
    };

    const categoryFilter = filterCategory || '';
    const applyCategoryFilter = (value) => {
        router.get(route('fee-types.index'), value === '' ? {} : { category: value }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Fee Types" />
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
                            { label: 'Fee Types' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Fee Types</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage fee types (Tuition, Admission, Transport, etc.)</p>
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

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 justify-end">
                            <label htmlFor="category-filter" className="text-sm font-medium text-gray-700 shrink-0">Category</label>
                            <select
                                id="category-filter"
                                value={categoryFilter}
                                onChange={(e) => applyCategoryFilter(e.target.value)}
                                className="min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="">All</option>
                                {(categories.length ? categories : Object.keys(CATEGORY_LABELS)).map((cat) => (
                                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Fee Types</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} type{list.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Fee Type
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Refundable</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No fee types found. Click &quot;Add Fee Type&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 text-xs rounded bg-[#2E3D50] text-white">
                                                        {CATEGORY_LABELS[item.category] || item.category}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${item.is_refundable ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {item.is_refundable ? 'Yes' : 'No'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => openEditModal(item)} className="text-amber-500 hover:text-amber-600 mr-3"><FontAwesomeIcon icon={faPen} className="text-sm" /></button>
                                                    <button type="button" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-600"><FontAwesomeIcon icon={faTrashCan} className="text-sm" /></button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editingItem ? 'Edit Fee Type' : 'Add Fee Type'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                            <input
                                                type="text"
                                                className={`w-full border rounded-md px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="e.g. Tuition, Admission, Transport"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                maxLength={255}
                                                autoFocus
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                                            <select
                                                className={`w-full border rounded-md px-3 py-2 ${errors.category ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.category}
                                                onChange={(e) => setData('category', e.target.value)}
                                            >
                                                {(categories.length ? categories : Object.keys(CATEGORY_LABELS)).map((cat) => (
                                                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat] || cat}</option>
                                                ))}
                                            </select>
                                            {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_refundable"
                                                checked={data.is_refundable}
                                                onChange={(e) => setData('is_refundable', e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                            <label htmlFor="is_refundable" className="text-sm font-medium text-gray-700">Refundable</label>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                                        <button type="submit" disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">
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
