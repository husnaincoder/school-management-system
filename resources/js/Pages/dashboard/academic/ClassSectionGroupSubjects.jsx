import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faBookOpen, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { class_section_group_id: '', subject_id: '', teacher_id: '', weekly_classes: '' };

const selectInputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
        hasError ? 'border-red-500' : 'border-gray-300'
    }`;

function classSectionGroupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section;
    const session = cs?.academic_session?.name || '';
    const cls = cs?.class?.name || '';
    const sec = cs?.section?.name || '';
    const group = csg.subject_group?.name || '';
    const parts = [session, cls, sec, group].filter(Boolean);
    return parts.length ? parts.join(' · ') : `#${csg.id}`;
}

function teacherLabel(t) {
    if (!t) return '—';
    const name = t.name || t.user?.name || 'Teacher';
    return t.staff_id ? `${name} (${t.staff_id})` : name;
}

export default function ClassSectionGroupSubjectsIndex({
    classSectionGroupSubjects = [],
    classSectionGroups = [],
    subjects = [],
    teachers = [],
    sessions = [],
    filterSessionId = '',
    filterClassSectionGroupId = '',
}) {
    const { flash } = usePage().props;
    const list = Array.isArray(classSectionGroupSubjects) ? classSectionGroupSubjects : [];
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const subjectsList = Array.isArray(subjects) ? subjects : [];
    const teachersList = Array.isArray(teachers) ? teachers : [];
    const sessionsList = Array.isArray(sessions) ? sessions : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const groupOptions = useMemo(
        () =>
            groups.map((g) => {
                const label = classSectionGroupLabel(g);
                return {
                    value: String(g.id),
                    label,
                    searchText: label,
                    selectedLabel: label,
                    sublabel: g.subject_group?.name || undefined,
                };
            }),
        [groups]
    );

    const subjectOptions = useMemo(
        () =>
            subjectsList.map((s) => {
                const label = s.code ? `${s.name} (${s.code})` : s.name;
                return {
                    value: String(s.id),
                    label,
                    searchText: `${s.name} ${s.code || ''}`,
                    selectedLabel: label,
                };
            }),
        [subjectsList]
    );

    const teacherOptions = useMemo(
        () => [
            { value: '', label: 'No teacher', searchText: 'no teacher none', selectedLabel: 'No teacher' },
            ...teachersList.map((t) => {
                const label = teacherLabel(t);
                return {
                    value: String(t.id),
                    label,
                    searchText: label,
                    selectedLabel: label,
                };
            }),
        ],
        [teachersList]
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
            class_section_group_id: item.class_section_group_id ?? '',
            subject_id: item.subject_id ?? '',
            teacher_id: item.teacher_id ?? '',
            weekly_classes: item.weekly_classes ?? '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('academic.class-section-group-subjects.update', editingItem.id), {
                onSuccess: () => { setShowModal(false); setEditingItem(null); reset(); },
            });
        } else {
            post(route('academic.class-section-group-subjects.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Remove subject "${item.subject?.name}" from this group?`)) return;
        router.delete(route('academic.class-section-group-subjects.destroy', item.id), { preserveScroll: true });
    };

    const applySessionFilter = (value) => {
        router.get(route('academic.class-section-group-subjects'), value ? { academic_session_id: value, class_section_group_id: filterClassSectionGroupId || undefined } : (filterClassSectionGroupId ? { class_section_group_id: filterClassSectionGroupId } : {}), { preserveState: true });
    };
    const applyGroupFilter = (value) => {
        router.get(route('academic.class-section-group-subjects'), value ? { class_section_group_id: value, academic_session_id: filterSessionId || undefined } : (filterSessionId ? { academic_session_id: filterSessionId } : {}), { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Class Section Group Subjects" />
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
                            { label: 'Class Section Group Subjects' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faBookOpen} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Section Group Subjects</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Assign subjects to class section groups (e.g. Science → Physics, Chemistry)</p>
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
                            <label htmlFor="group-filter" className="text-sm font-medium text-gray-700 shrink-0">Group</label>
                            <select
                                id="group-filter"
                                value={filterClassSectionGroupId || ''}
                                onChange={(e) => applyGroupFilter(e.target.value)}
                                className="min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            >
                                <option value="">All groups</option>
                                {groups.map((g) => (
                                    <option key={g.id} value={String(g.id)}>{classSectionGroupLabel(g)}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Subject Assignments</h2>
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Weekly</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                            No subject assignments found. Click &quot;Assign Subject to Group&quot; to create one.
                                        </td>
                                    </tr>
                                ) : (
                                    list.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">{item.class_section_group?.class_section?.academic_session?.name ?? '—'}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.class_section_group?.class_section?.class?.name ?? '—'}</td>
                                            <td className="px-6 py-4">{item.class_section_group?.class_section?.section?.name ?? '—'}</td>
                                            <td className="px-6 py-4">{item.class_section_group?.subject_group?.name ?? '—'}</td>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.subject?.name ?? '—'}</td>
                                            <td className="px-6 py-4">{item.teacher?.user?.name ?? item.teacher?.staff_id ?? '—'}</td>
                                            <td className="px-6 py-4">{item.weekly_classes ?? '—'}</td>
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
                                    <h2 className="text-xl font-semibold">{editingItem ? 'Edit Assignment' : 'Assign Subject to Group'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group</label>
                                            <SearchableSelect
                                                options={groupOptions}
                                                value={data.class_section_group_id}
                                                onChange={(id) => setData('class_section_group_id', id)}
                                                placeholder="Search group..."
                                                inputClassName={selectInputClass(!!errors.class_section_group_id)}
                                                emptyText={groups.length === 0 ? 'No groups found' : 'No group found'}
                                            />
                                            {errors.class_section_group_id && <p className="text-red-500 text-sm mt-1">{errors.class_section_group_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                            <SearchableSelect
                                                options={subjectOptions}
                                                value={data.subject_id}
                                                onChange={(id) => setData('subject_id', id)}
                                                placeholder="Search subject..."
                                                inputClassName={selectInputClass(!!errors.subject_id)}
                                                emptyText={subjectsList.length === 0 ? 'No subjects found' : 'No subject found'}
                                            />
                                            {errors.subject_id && <p className="text-red-500 text-sm mt-1">{errors.subject_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Teacher (optional)</label>
                                            <SearchableSelect
                                                options={teacherOptions}
                                                value={data.teacher_id ?? ''}
                                                onChange={(id) => setData('teacher_id', id || '')}
                                                placeholder="Search teacher..."
                                                inputClassName={selectInputClass(false)}
                                                emptyText="No teacher found"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Weekly classes (optional)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className={`w-full border rounded-lg px-3 py-2 ${errors.weekly_classes ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.weekly_classes}
                                                onChange={(e) => setData('weekly_classes', e.target.value)}
                                                placeholder="e.g. 5"
                                            />
                                            {errors.weekly_classes && <p className="text-red-500 text-sm mt-1">{errors.weekly_classes}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.class_section_group_id || !data.subject_id}
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
