import React, { useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faLayerGroup, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { name: '', capacity: 40, is_active: true };

export default function SectionsIndex({ sections = [], filterIsActive = '' }) {
    const list = Array.isArray(sections) ? sections : [];
    const [showModal, setShowModal] = useState(false);
    const [editingSection, setEditingSection] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const statusFilter = filterIsActive === true || filterIsActive === '1' ? '1' : filterIsActive === '0' ? '0' : '';

    const applyStatusFilter = (value) => {
        router.get(route('academic.sections'), value === '' ? {} : { is_active: value }, { preserveState: true });
    };

    const openAddModal = () => {
        setEditingSection(null);
        setData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (section) => {
        setEditingSection(section);
        setData({
            name: section.name || '',
            capacity: section.capacity ?? 40,
            is_active: section.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingSection) {
            put(route('academic.sections.update', editingSection.id), {
                onSuccess: () => { setShowModal(false); setEditingSection(null); reset(); },
            });
        } else {
            post(route('academic.sections.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (section) => {
        if (!window.confirm(`Delete section "${section.name}"? This may affect class sections.`)) return;
        router.delete(route('academic.sections.destroy', section.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Sections" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Academic Session', href: route('admin.academic-session') },
                            { label: 'Sections' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faLayerGroup} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Section Management</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage your school sections</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.academic-session')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        </Link>
                    </div>

                    {/* Filters Card - image style */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 justify-end">
                            <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 shrink-0">Status</label>
                            <select
                                id="status-filter"
                                value={statusFilter}
                                onChange={(e) => applyStatusFilter(e.target.value)}
                                className="min-w-[140px] border  rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="">All</option>
                                <option value="1">Active</option>
                                <option value="0">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Sections table card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Sections</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} section{list.length !== 1 ? 's' : ''}</p>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used in</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No sections found. Click &quot;Add New Section&quot; to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    list.map(section => (
                                        <tr key={section.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{section.name}</td>
                                            <td className="px-6 py-4">{section.capacity ?? '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 text-xs rounded bg-[#2E3D50] text-white">
                                                    {section.class_sections_count ?? 0} class-sections
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-xs rounded ${section.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {section.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button type="button" onClick={() => openEditModal(section)} className="text-amber-500 hover:text-amber-600 mr-3"><FontAwesomeIcon icon={faPen} className="text-sm" /></button>
                                                <button type="button" onClick={() => handleDelete(section)} className="text-red-500 hover:text-red-600"><FontAwesomeIcon icon={faTrashCan} className="text-sm" /></button>
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
                                    <h2 className="text-xl font-semibold">{editingSection ? 'Edit Section' : 'Add Section'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingSection(null); reset(); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Section Name</label>
                                            <input
                                                type="text"
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                placeholder="e.g., A, B, Morning"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                maxLength={50}
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                                            <input
                                                type="number"
                                                min={1}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                value={data.capacity}
                                                onChange={(e) => setData('capacity', e.target.value)}
                                            />
                                            {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
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
                                        <button type="button" onClick={() => { setShowModal(false); setEditingSection(null); reset(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                                        <button type="submit" disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">
                                            {editingSection ? 'Update' : 'Save'}
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
