import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faClipboardList, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { name: '' };

export default function ExamTypesIndex({ examTypes = [] }) {
    const { flash } = usePage().props;
    const list = Array.isArray(examTypes) ? examTypes : [];
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
        reset();
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setData({ name: item.name || '' });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('academic.exam-types.update', editingItem.id), {
                onSuccess: () => { setShowModal(false); setEditingItem(null); reset(); },
            });
        } else {
            post(route('academic.exam-types.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete exam type "${item.name}"?`)) return;
        router.delete(route('academic.exam-types.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Exam Types" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${banner.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Exam & Schedule', href: route('admin.exam-schedule') },
                            { label: 'Exam Types' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClipboardList} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Exam Types</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage exam types (e.g. Mid Term, Final Term)</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.exam-schedule')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Exam Types</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} type{list.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Exam Type
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-12 text-center text-gray-500">
                                                No exam types yet. Click &quot;Add Exam Type&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item, idx) => (
                                            <tr key={item.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 text-sm text-gray-600">{idx + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => openEditModal(item)} className="text-amber-600 hover:text-amber-800 font-medium text-sm mr-3">
                                                        <FontAwesomeIcon icon={faPen} className="text-sm mr-1" /> Edit
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800 font-medium text-sm">
                                                        <FontAwesomeIcon icon={faTrashCan} className="text-sm mr-1" /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">{editingItem ? 'Edit Exam Type' : 'Add Exam Type'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input
                                            type="text"
                                            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="e.g. Mid Term, Final Term"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            maxLength={255}
                                            autoFocus
                                        />
                                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
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
