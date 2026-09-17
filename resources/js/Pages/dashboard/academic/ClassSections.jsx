import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faChalkboard, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { academic_session_id: '', class_id: '', section_id: '', capacity: 40, is_active: true };

const selectInputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
        hasError ? 'border-red-500' : 'border-gray-300'
    }`;

export default function ClassSectionsIndex(props) {
    const { props: pageProps } = usePage();
    const classSections = Array.isArray(props.classSections) ? props.classSections : (pageProps.classSections || []);
    const classes = Array.isArray(props.classes) ? props.classes : (pageProps.classes || []);
    const sections = Array.isArray(props.sections) ? props.sections : (pageProps.sections || []);
    const filterSessionId = props.filterSessionId ?? pageProps.filterSessionId ?? '';
    const filterClassId = props.filterClassId ?? pageProps.filterClassId ?? '';
    const sessions = Array.isArray(pageProps.sessionsList)
        ? pageProps.sessionsList
        : (Array.isArray(props.academicSessions)
            ? props.academicSessions
            : (Array.isArray(pageProps.academicSessions) ? pageProps.academicSessions : []));
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const sessionOptions = useMemo(
        () =>
            sessions.map((s) => ({
                value: String(s.id),
                label: s.name,
                searchText: s.name,
                selectedLabel: s.name,
            })),
        [sessions]
    );

    const classOptions = useMemo(
        () =>
            classes.map((c) => ({
                value: String(c.id),
                label: c.name,
                searchText: c.name,
                selectedLabel: c.name,
            })),
        [classes]
    );

    const sectionOptions = useMemo(
        () => [
            { value: '', label: 'None', searchText: 'none', selectedLabel: 'None' },
            ...sections.map((s) => ({
                value: String(s.id),
                label: s.name,
                searchText: s.name,
                selectedLabel: s.name,
            })),
        ],
        [sections]
    );

    const filterSessionOptions = useMemo(
        () => [{ value: '', label: 'All sessions' }, ...sessionOptions],
        [sessionOptions]
    );

    const filterClassOptions = useMemo(
        () => [{ value: '', label: 'All classes' }, ...classOptions],
        [classOptions]
    );

    const openAdd = () => {
        setEditing(null);
        setData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setData({
            academic_session_id: row.academic_session_id ?? '',
            class_id: row.class_id ?? '',
            section_id: row.section_id ?? '',
            capacity: row.capacity ?? 40,
            is_active: row.is_active ?? true,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditing(null);
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('academic.class-sections.update', editing.id), {
                onSuccess: () => {
                    setShowModal(false);
                    setEditing(null);
                    reset();
                },
            });
        } else {
            post(route('academic.class-sections.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (row) => {
        if (!window.confirm('Remove this class section?')) return;
        router.delete(route('academic.class-sections.destroy', row.id));
    };

    const applySessionFilter = (value) => {
        router.get(
            route('academic.class-sections'),
            value
                ? { academic_session_id: value, class_id: filterClassId || undefined }
                : (filterClassId ? { class_id: filterClassId } : {}),
            { preserveState: true }
        );
    };

    const applyClassFilter = (value) => {
        router.get(
            route('academic.class-sections'),
            value
                ? { class_id: value, academic_session_id: filterSessionId || undefined }
                : (filterSessionId ? { academic_session_id: filterSessionId } : {}),
            { preserveState: true }
        );
    };

    return (
        <AuthenticatedLayout>
            <Head title="Class Sections" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Academic Session', href: route('admin.academic-session') },
                            { label: 'Class Sections' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChalkboard} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Sections</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage class-section combinations</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.academic-session')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <div className="flex flex-wrap items-end gap-4 justify-end">
                            <div className="min-w-[160px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                                <SearchableSelect
                                    options={filterSessionOptions}
                                    value={filterSessionId || ''}
                                    onChange={(id) => applySessionFilter(id)}
                                    placeholder="Search session..."
                                    inputClassName="min-w-[160px] w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                />
                            </div>
                            <div className="min-w-[160px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                <SearchableSelect
                                    options={filterClassOptions}
                                    value={filterClassId || ''}
                                    onChange={(id) => applyClassFilter(id)}
                                    placeholder="Search class..."
                                    inputClassName="min-w-[160px] w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Class Sections</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Total: {classSections.length} class section{classSections.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openAdd}
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {classSections.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                                No class sections found. Click &quot;Add New Class Section&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        classSections.map((cs) => (
                                            <tr key={cs.id}>
                                                <td className="px-6 py-4">{cs.academic_session?.name ?? '—'}</td>
                                                <td className="px-6 py-4 font-medium text-gray-900">{cs.class?.name ?? '—'}</td>
                                                <td className="px-6 py-4">{cs.section?.name ?? '—'}</td>
                                                <td className="px-6 py-4">{cs.capacity ?? '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${cs.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {cs.is_active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => openEdit(cs)} className="text-amber-500 hover:text-amber-600 mr-3">
                                                        <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(cs)} className="text-red-500 hover:text-red-600">
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
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md overflow-visible shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editing ? 'Edit Class Section' : 'Add Class Section'}</h2>
                                    <button type="button" onClick={closeModal} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Session</label>
                                            <SearchableSelect
                                                options={sessionOptions}
                                                value={data.academic_session_id}
                                                onChange={(id) => setData('academic_session_id', id)}
                                                placeholder="Search session..."
                                                inputClassName={selectInputClass(!!errors.academic_session_id)}
                                                emptyText={sessions.length === 0 ? 'No sessions — add one in Sessions' : 'No session found'}
                                            />
                                            {errors.academic_session_id && (
                                                <p className="text-red-500 text-sm mt-1">{errors.academic_session_id}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                                            <SearchableSelect
                                                options={classOptions}
                                                value={data.class_id}
                                                onChange={(id) => setData('class_id', id)}
                                                placeholder="Search class..."
                                                inputClassName={selectInputClass(!!errors.class_id)}
                                                emptyText={classes.length === 0 ? 'No classes found' : 'No class found'}
                                            />
                                            {errors.class_id && (
                                                <p className="text-red-500 text-sm mt-1">{errors.class_id}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Section (optional)</label>
                                            <SearchableSelect
                                                options={sectionOptions}
                                                value={data.section_id ?? ''}
                                                onChange={(id) => setData('section_id', id || '')}
                                                placeholder="Search section..."
                                                inputClassName={selectInputClass(false)}
                                                emptyText="No section found"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                                value={data.capacity}
                                                onChange={(e) => setData('capacity', e.target.value)}
                                            />
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
                                        <button
                                            type="button"
                                            onClick={closeModal}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.academic_session_id || !data.class_id}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
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
