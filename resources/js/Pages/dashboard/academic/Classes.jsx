import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faSchool, faTrashCan, faPen, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { name: '', class_number: '', description: '', is_active: true };

export default function ClassesIndex({ classes = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const list = Array.isArray(classes) ? classes : [];

    const openAddModal = () => {
        setEditingClass(null);
        setData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (classItem) => {
        setEditingClass(classItem);
        setData({
            name: classItem.name || '',
            class_number: classItem.class_number ?? '',
            description: classItem.description || '',
            is_active: classItem.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingClass) {
            put(route('academic.classes.update', editingClass.id), {
                onSuccess: () => { setShowModal(false); setEditingClass(null); reset(); },
            });
        } else {
            post(route('academic.classes.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (classItem) => {
        if (!window.confirm(`Delete class "${classItem.name}"?`)) return;
        router.delete(route('academic.classes.destroy', classItem.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Classes" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Academic Session', href: route('admin.academic-session') },
                            { label: 'Classes' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faSchool} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Classes</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage school classes and grades</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.academic-session')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">All Classes</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Total: {list.length} class{list.length !== 1 ? 'es' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Number</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class-Sections</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                No classes found. Click &quot;Add Class&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((classItem, index) => (
                                            <tr key={classItem.id}>
                                                <td className="px-6 py-4 text-gray-600">{index + 1}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{classItem.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{classItem.class_number ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600 max-w-xs truncate">{classItem.description || '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 text-xs rounded bg-[#2E3D50] text-white">
                                                        {classItem.class_sections_count ?? 0}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${classItem.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {classItem.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(classItem)}
                                                        className="text-amber-500 hover:text-amber-600 mr-3"
                                                        title="Edit"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(classItem)}
                                                        className="text-red-500 hover:text-red-600"
                                                        title="Delete"
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

                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editingClass ? 'Edit Class' : 'Add Class'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingClass(null); reset(); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Name</label>
                                            <input type="text" className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g., Class One" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Number</label>
                                            <input type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" value={data.class_number} onChange={(e) => setData('class_number', e.target.value)} />
                                            {errors.class_number && <p className="text-red-500 text-sm mt-1">{errors.class_number}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                            <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows="3" value={data.description} onChange={(e) => setData('description', e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setShowModal(false); setEditingClass(null); reset(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                                        <button type="submit" disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">{editingClass ? 'Update' : 'Save'}</button>
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
