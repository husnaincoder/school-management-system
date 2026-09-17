import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faTags, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { name: '', slug: '', description: '', icon: '', color: '', is_active: true };

export default function NoticeCategoriesIndex({ categories = [] }) {
    const { flash } = usePage().props;
    const list = Array.isArray(categories) ? categories : [];
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
            slug: item.slug || '',
            description: item.description || '',
            icon: item.icon || '',
            color: item.color || '',
            is_active: item.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('notice-categories.update', editingItem.id), {
                onSuccess: () => { setShowModal(false); setEditingItem(null); reset(); },
            });
        } else {
            post(route('notice-categories.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete notice category "${item.name}"?`)) return;
        router.delete(route('notice-categories.destroy', item.id), {
            preserveScroll: true,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Notice Categories" />
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
                            { label: 'Notice Management', href: route('admin.notice-management') },
                            { label: 'Notice Categories' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faTags} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notice Categories</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage notice categories (Exam, Holiday, Fee Notice, etc.)</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.notice-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Notice Categories</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} categor{list.length !== 1 ? 'ies' : 'y'}</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Notice Category
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Slug</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Icon / Color</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No notice categories yet. Click &quot;Add Notice Category&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4 text-gray-600 font-mono text-sm">{item.slug || '—'}</td>
                                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{item.description || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        {item.icon && <span className="text-gray-500">{item.icon}</span>}
                                                        {item.color && (
                                                            <span
                                                                className="inline-block w-5 h-5 rounded border border-gray-300"
                                                                style={{ backgroundColor: item.color }}
                                                                title={item.color}
                                                            />
                                                        )}
                                                        {!item.icon && !item.color && '—'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {item.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => openEditModal(item)} className="text-indigo-500 hover:text-indigo-600 mr-3"><FontAwesomeIcon icon={faPen} className="text-sm" /></button>
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
                            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editingItem ? 'Edit Notice Category' : 'Add Notice Category'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                className={`w-full border rounded-md px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="e.g. Exam, Holiday, Fee Notice"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                maxLength={255}
                                                autoFocus
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Slug</label>
                                            <input
                                                type="text"
                                                className={`w-full border rounded-md px-3 py-2 ${errors.slug ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="auto from name if empty"
                                                value={data.slug}
                                                onChange={(e) => setData('slug', e.target.value)}
                                                maxLength={255}
                                            />
                                            {errors.slug && <p className="text-red-500 text-sm mt-1">{errors.slug}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea
                                                className={`w-full border rounded-md px-3 py-2 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="Optional description"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                                rows={2}
                                            />
                                            {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Icon</label>
                                                <input
                                                    type="text"
                                                    className={`w-full border rounded-md px-3 py-2 ${errors.icon ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="e.g. faBell"
                                                    value={data.icon}
                                                    onChange={(e) => setData('icon', e.target.value)}
                                                    maxLength={100}
                                                />
                                                {errors.icon && <p className="text-red-500 text-sm mt-1">{errors.icon}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Color</label>
                                                <input
                                                    type="text"
                                                    className={`w-full border rounded-md px-3 py-2 ${errors.color ? 'border-red-500' : 'border-gray-300'}`}
                                                    placeholder="e.g. #3B82F6 or blue"
                                                    value={data.color}
                                                    onChange={(e) => setData('color', e.target.value)}
                                                    maxLength={50}
                                                />
                                                {errors.color && <p className="text-red-500 text-sm mt-1">{errors.color}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="rounded border-gray-300"
                                            />
                                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                                        <button type="submit" disabled={processing} className="bg-indigo-500 hover:bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">
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
