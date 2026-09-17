import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faUserTie, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { class_section_id: '', teacher_id: '', is_active: true };

const selectInputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
        hasError ? 'border-red-500' : 'border-gray-300'
    }`;

function sectionLabel(cs) {
    if (!cs) return '—';
    if (typeof cs === 'object' && cs.name && !cs.class) return cs.name;
    const session = cs.academic_session?.name ?? cs.academicSession?.name ?? '';
    const c = cs.class?.name ?? '';
    const s = cs.section?.name ?? '';
    return [session, c && s ? `${c} - ${s}` : c || s].filter(Boolean).join(' · ') || '—';
}

function teacherLabel(t) {
    if (!t) return '—';
    const name = t.name || t.user?.name || 'Teacher';
    return t.staff_id ? `${name} (${t.staff_id})` : name;
}

export default function ClassInchargesIndex({
    incharges = [],
    classSections = [],
    teachers = [],
    filterClassSectionId = '',
}) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);
    const list = Array.isArray(incharges) ? incharges : [];
    const sections = Array.isArray(classSections) ? classSections : [];
    const teachersList = Array.isArray(teachers) ? teachers : [];

    const sectionOptions = useMemo(
        () => sections.map((cs) => ({
            value: String(cs.id),
            label: cs.name || sectionLabel(cs),
            searchText: cs.name || sectionLabel(cs),
        })),
        [sections]
    );

    const teacherOptions = useMemo(
        () => teachersList.map((t) => ({
            value: String(t.id),
            label: teacherLabel(t),
            searchText: teacherLabel(t),
        })),
        [teachersList]
    );

    const openAdd = () => { setEditing(null); setData(emptyForm); setShowModal(true); };
    const openEdit = (row) => {
        setEditing(row);
        setData({
            class_section_id: String(row.class_section_id ?? ''),
            teacher_id: String(row.teacher_id ?? ''),
            is_active: row.is_active ?? true,
        });
        setShowModal(true);
    };
    const closeModal = () => { setShowModal(false); setEditing(null); reset(); };

    const handleSubmit = (e) => {
        e.preventDefault();
        const opts = { onSuccess: () => { setShowModal(false); setEditing(null); reset(); } };
        if (editing) put(route('academic.class-incharges.update', editing.id), opts);
        else post(route('academic.class-incharges.store'), opts);
    };

    return (
        <AuthenticatedLayout>
            <Head title="Class Incharges" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Academic Session', href: route('admin.academic-session') },
                            { label: 'Class Incharges' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserTie} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Incharges</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Assign teachers as Class Incharge for a whole class/section (not subject group).
                                </p>
                            </div>
                        </div>
                        <Link href={route('admin.academic-session')} className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                        <h2 className="text-base font-semibold mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500" /> Filters
                        </h2>
                        <select
                            value={filterClassSectionId || ''}
                            onChange={(e) => router.get(route('academic.class-incharges'), e.target.value ? { class_section_id: e.target.value } : {}, { preserveState: true })}
                            className="min-w-[260px] border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500"
                        >
                            <option value="">All class sections</option>
                            {sections.map((cs) => <option key={cs.id} value={cs.id}>{cs.name}</option>)}
                        </select>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b flex justify-between items-center gap-4">
                            <div>
                                <h2 className="text-lg font-semibold">Assignments</h2>
                                <p className="text-sm text-gray-500">Total: {list.length}</p>
                            </div>
                            <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm">
                                <FontAwesomeIcon icon={faPlus} /> Assign Incharge
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Section</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {list.length === 0 ? (
                                        <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No incharges found.</td></tr>
                                    ) : list.map((row) => (
                                        <tr key={row.id}>
                                            <td className="px-6 py-4 font-medium">{sectionLabel(row.class_section || row.classSection)}</td>
                                            <td className="px-6 py-4">{row.teacher?.user?.name ?? row.teacher?.staff_id ?? '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-xs rounded ${row.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {row.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button type="button" onClick={() => openEdit(row)} className="text-amber-500 mr-3"><FontAwesomeIcon icon={faPen} /></button>
                                                <button type="button" onClick={() => { if (window.confirm('Remove this assignment?')) router.delete(route('academic.class-incharges.destroy', row.id)); }} className="text-red-500"><FontAwesomeIcon icon={faTrashCan} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                                <div className="flex justify-between mb-4">
                                    <h2 className="text-xl font-semibold">{editing ? 'Edit Incharge' : 'Assign Incharge'}</h2>
                                    <button type="button" onClick={closeModal}>✕</button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Class Section *</label>
                                        <SearchableSelect
                                            options={sectionOptions}
                                            value={data.class_section_id}
                                            onChange={(id) => setData('class_section_id', id)}
                                            placeholder="Search class section..."
                                            inputClassName={selectInputClass(!!errors.class_section_id)}
                                        />
                                        {errors.class_section_id && <p className="text-red-500 text-sm mt-1">{errors.class_section_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Teacher *</label>
                                        <SearchableSelect
                                            options={teacherOptions}
                                            value={data.teacher_id}
                                            onChange={(id) => setData('teacher_id', id)}
                                            placeholder="Search teacher..."
                                            inputClassName={selectInputClass(!!errors.teacher_id)}
                                        />
                                        {errors.teacher_id && <p className="text-red-500 text-sm mt-1">{errors.teacher_id}</p>}
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                                        Active (only one active incharge per class section)
                                    </label>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={closeModal} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                                        <button type="submit" disabled={processing || !data.class_section_id || !data.teacher_id} className="bg-amber-500 text-white px-4 py-2 rounded disabled:opacity-50">
                                            {editing ? 'Update' : 'Save'}
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
