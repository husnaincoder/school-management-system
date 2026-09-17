import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faObjectGroup, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { class_section_id: '', subject_group_id: '' };

const selectInputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
        hasError ? 'border-red-500' : 'border-gray-300'
    }`;

function classSectionLabel(cs) {
    if (!cs) return '—';
    const session = cs.academic_session?.name || '';
    const cls = cs.class?.name || '';
    const sec = cs.section?.name || '';
    return [session, cls, sec].filter(Boolean).join(' · ') || String(cs.id);
}

export default function ClassSectionGroupsIndex({
    classSectionGroups = [],
    classSections = [],
    subjectGroups = [],
    sessions = [],
    filterSessionId = '',
    filterClassSectionId = '',
}) {
    const { flash } = usePage().props;
    const list = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const sections = Array.isArray(classSections) ? classSections : [];
    const groups = Array.isArray(subjectGroups) ? subjectGroups : [];
    const sessionsList = Array.isArray(sessions) ? sessions : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const classSectionOptions = useMemo(
        () =>
            sections.map((cs) => {
                const label = classSectionLabel(cs);
                return {
                    value: String(cs.id),
                    label,
                    searchText: label,
                    selectedLabel: label,
                    sublabel: [cs.class?.name, cs.section?.name].filter(Boolean).join(' · ') || undefined,
                };
            }),
        [sections]
    );

    const subjectGroupOptions = useMemo(
        () =>
            groups.map((g) => ({
                value: String(g.id),
                label: g.name,
                searchText: g.name,
                selectedLabel: g.name,
            })),
        [groups]
    );

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
            class_section_id: item.class_section_id ?? '',
            subject_group_id: item.subject_group_id ?? '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('academic.class-section-groups.update', editingItem.id), {
                onSuccess: () => { setShowModal(false); setEditingItem(null); reset(); },
            });
        } else {
            post(route('academic.class-section-groups.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Remove subject group "${item.subject_group?.name}" from this class section?`)) return;
        router.delete(route('academic.class-section-groups.destroy', item.id), { preserveScroll: true });
    };

    const applySessionFilter = (value) => {
        router.get(route('academic.class-section-groups'), value ? { academic_session_id: value, class_section_id: filterClassSectionId || undefined } : (filterClassSectionId ? { class_section_id: filterClassSectionId } : {}), { preserveState: true });
    };
    const applyClassSectionFilter = (value) => {
        router.get(route('academic.class-section-groups'), value ? { class_section_id: value, academic_session_id: filterSessionId || undefined } : (filterSessionId ? { academic_session_id: filterSessionId } : {}), { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Class Section Group" />
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
                            { label: 'Academic Session', href: route('admin.academic-session') },
                            { label: 'Class Section Groups' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faObjectGroup} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Section Groups</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Assign subject groups to class sections</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.academic-session')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        </Link>
                    </div>

                    {/* Filters Card - same as Sections */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <div className="flex flex-wrap items-center gap-4 justify-end">
                            <label htmlFor="session-filter" className="text-sm font-medium text-gray-700 shrink-0">Session</label>
                            <select
                                id="session-filter"
                                value={filterSessionId || ''}
                                onChange={(e) => applySessionFilter(e.target.value)}
                                className="min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="">All sessions</option>
                                {sessionsList.map((s) => (
                                    <option key={s.id} value={String(s.id)}>{s.name}</option>
                                ))}
                            </select>
                            <label htmlFor="class-section-filter" className="text-sm font-medium text-gray-700 shrink-0">Class Section</label>
                            <select
                                id="class-section-filter"
                                value={filterClassSectionId || ''}
                                onChange={(e) => applyClassSectionFilter(e.target.value)}
                                className="min-w-[180px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="">All class sections</option>
                                {sections.map((cs) => (
                                    <option key={cs.id} value={String(cs.id)}>{classSectionLabel(cs)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Class Section Groups</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} assignment{list.length !== 1 ? 's' : ''}</p>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject Group</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                            No class section groups found. Click &quot;Add New Class Section Group&quot; to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    list.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">{item.class_section?.academic_session?.name ?? '—'}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.class_section?.class?.name ?? '—'}</td>
                                            <td className="px-6 py-4">{item.class_section?.section?.name ?? '—'}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.subject_group?.name ?? '—'}</td>
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
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md overflow-visible shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editingItem ? 'Edit Class Section Group' : 'Add Class Section Group'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Section</label>
                                            <SearchableSelect
                                                options={classSectionOptions}
                                                value={data.class_section_id}
                                                onChange={(id) => setData('class_section_id', id)}
                                                placeholder="Search session, class or section..."
                                                inputClassName={selectInputClass(!!errors.class_section_id)}
                                                emptyText={sections.length === 0 ? 'No class sections found' : 'No class section found'}
                                            />
                                            {errors.class_section_id && <p className="text-red-500 text-sm mt-1">{errors.class_section_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject Group</label>
                                            <SearchableSelect
                                                options={subjectGroupOptions}
                                                value={data.subject_group_id}
                                                onChange={(id) => setData('subject_group_id', id)}
                                                placeholder="Search subject group..."
                                                inputClassName={selectInputClass(!!errors.subject_group_id)}
                                                emptyText={groups.length === 0 ? 'No subject groups found' : 'No subject group found'}
                                            />
                                            {errors.subject_group_id && <p className="text-red-500 text-sm mt-1">{errors.subject_group_id}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.class_section_id || !data.subject_group_id}
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
