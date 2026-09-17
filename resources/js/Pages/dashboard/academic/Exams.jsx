import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faClipboardList, faCalendarDays, faPen, faTrashCan, faBook, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const selectInputClass = (err = false) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;

const emptyForm = {
    academic_session_id: '',
    exam_type_id: '',
    class_section_group_id: '',
    name: '',
    start_date: '',
    end_date: '',
    is_published: false,
};

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime())
        ? value
        : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function csgLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

export default function ExamsIndex({
    exams = [],
    sessions = [],
    examTypes = [],
    classSectionGroups = [],
    filterAcademicSessionId = '',
    filterExamTypeId = '',
    filterClassSectionGroupId = '',
}) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [editingExam, setEditingExam] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [filters, setFilters] = useState({
        academic_session_id: filterAcademicSessionId || '',
        exam_type_id: filterExamTypeId || '',
        class_section_group_id: filterClassSectionGroupId || '',
    });
    const { data, setData, post, put, processing, errors, reset } = useForm({
        ...emptyForm,
        academic_session_id: filterAcademicSessionId || '',
    });

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
        setEditingExam(null);
        setData({
            ...emptyForm,
            academic_session_id: filters.academic_session_id || '',
        });
        reset();
        setShowModal(true);
    };

    const openEditModal = (exam) => {
        setEditingExam(exam);
        const start = exam.start_date ? (typeof exam.start_date === 'string' ? exam.start_date.slice(0, 10) : exam.start_date) : '';
        const end = exam.end_date ? (typeof exam.end_date === 'string' ? exam.end_date.slice(0, 10) : exam.end_date) : '';
        setData({
            academic_session_id: String(exam.academic_session_id ?? ''),
            exam_type_id: String(exam.exam_type_id ?? ''),
            class_section_group_id: String(exam.class_section_group_id ?? ''),
            name: exam.name ?? '',
            start_date: start,
            end_date: end,
            is_published: exam.is_published ?? false,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingExam) {
            put(route('academic.exams.update', editingExam.id), {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingExam(null);
                    reset();
                },
            });
        } else {
            post(route('academic.exams.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (exam) => {
        if (!window.confirm(`Delete exam "${exam.name}"? This cannot be undone.`)) return;
        router.delete(route('academic.exams.destroy', exam.id), { preserveScroll: true });
    };

    const applyFilters = (e) => {
        e?.preventDefault();
        const params = {};
        if (filters.academic_session_id) params.academic_session_id = filters.academic_session_id;
        if (filters.exam_type_id) params.exam_type_id = filters.exam_type_id;
        if (filters.class_section_group_id) params.class_section_group_id = filters.class_section_group_id;
        router.get(route('academic.exams'), params, { preserveState: true });
    };

    const sessionOptions = useMemo(
        () => sessions.map((s) => ({ value: String(s.id), label: s.name, searchText: s.name })),
        [sessions]
    );
    const examTypeOptions = useMemo(
        () => examTypes.map((t) => ({ value: String(t.id), label: t.name, searchText: t.name })),
        [examTypes]
    );
    const csgOptions = useMemo(
        () => classSectionGroups.map((csg) => {
            const label = csgLabel(csg);
            return { value: String(csg.id), label, searchText: label };
        }),
        [classSectionGroups]
    );
    const filterSessionOptions = useMemo(
        () => [{ value: '', label: 'All sessions' }, ...sessionOptions],
        [sessionOptions]
    );
    const filterExamTypeOptions = useMemo(
        () => [{ value: '', label: 'All types' }, ...examTypeOptions],
        [examTypeOptions]
    );
    const filterCsgOptions = useMemo(
        () => [{ value: '', label: 'All groups' }, ...csgOptions],
        [csgOptions]
    );

    return (
        <AuthenticatedLayout>
            <Head title="Exams" />
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
                            { label: 'Exams' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClipboardList} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Exams</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage exams by session, type and class section group.</p>
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

                    {/* Filters */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500" /> Filters
                        </h2>
                        <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                            <div className="min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Academic Session</label>
                                <SearchableSelect
                                    options={filterSessionOptions}
                                    value={filters.academic_session_id}
                                    onChange={(id) => setFilters((p) => ({ ...p, academic_session_id: id }))}
                                    placeholder="Search session..."
                                    inputClassName={selectInputClass()}
                                />
                            </div>
                            <div className="min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Exam Type</label>
                                <SearchableSelect
                                    options={filterExamTypeOptions}
                                    value={filters.exam_type_id}
                                    onChange={(id) => setFilters((p) => ({ ...p, exam_type_id: id }))}
                                    placeholder="Search type..."
                                    inputClassName={selectInputClass()}
                                />
                            </div>
                            <div className="min-w-[220px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Class Section Group</label>
                                <SearchableSelect
                                    options={filterCsgOptions}
                                    value={filters.class_section_group_id}
                                    onChange={(id) => setFilters((p) => ({ ...p, class_section_group_id: id }))}
                                    placeholder="Search class / group..."
                                    inputClassName={selectInputClass()}
                                />
                            </div>
                            <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">
                                Apply
                            </button>
                        </form>
                    </div>

                    {/* Exams table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Scheduled Exams</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {exams.length} exam{exams.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Exam
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Exam</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Session</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Class / Group</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Start</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">End</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Published</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {exams.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                                No exams scheduled yet. Click &quot;Add Exam&quot; to schedule one.
                                            </td>
                                        </tr>
                                    ) : (
                                        exams.map((exam) => (
                                            <tr key={exam.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{exam.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{exam.academic_session?.name ?? '—'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{exam.exam_type?.name ?? '—'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{csgLabel(exam.class_section_group || exam.classSectionGroup)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(exam.start_date)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(exam.end_date)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${exam.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                                        {exam.is_published ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <Link href={route('academic.exams.show', exam.id)} className="text-sky-600 hover:text-sky-800 font-medium text-sm mr-3">
                                                        <FontAwesomeIcon icon={faBook} className="mr-1" /> Subjects
                                                    </Link>
                                                    <button type="button" onClick={() => openEditModal(exam)} className="text-amber-600 hover:text-amber-800 font-medium text-sm mr-3">
                                                        <FontAwesomeIcon icon={faPen} className="mr-1" /> Edit
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(exam)} className="text-red-600 hover:text-red-800 font-medium text-sm">
                                                        <FontAwesomeIcon icon={faTrashCan} className="mr-1" /> Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add Exam Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-gray-200 shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">{editingExam ? 'Edit Exam' : 'Create Exam'}</h2>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); setEditingExam(null); reset(); }}
                                        className="text-gray-500 hover:text-gray-700 text-xl leading-none"
                                    >
                                        ×
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session</label>
                                        <SearchableSelect
                                            options={sessionOptions}
                                            value={data.academic_session_id}
                                            onChange={(id) => setData('academic_session_id', id)}
                                            placeholder="Search session..."
                                            inputClassName={selectInputClass(!!errors.academic_session_id)}
                                        />
                                        {errors.academic_session_id && <p className="text-red-600 text-sm mt-1">{errors.academic_session_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Type</label>
                                        <SearchableSelect
                                            options={examTypeOptions}
                                            value={data.exam_type_id}
                                            onChange={(id) => setData('exam_type_id', id)}
                                            placeholder="Search type..."
                                            inputClassName={selectInputClass(!!errors.exam_type_id)}
                                        />
                                        {errors.exam_type_id && <p className="text-red-600 text-sm mt-1">{errors.exam_type_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Class Section Group</label>
                                        <SearchableSelect
                                            options={csgOptions}
                                            value={data.class_section_group_id}
                                            onChange={(id) => setData('class_section_group_id', id)}
                                            placeholder="Search class / group..."
                                            inputClassName={selectInputClass(!!errors.class_section_group_id)}
                                        />
                                        {errors.class_section_group_id && <p className="text-red-600 text-sm mt-1">{errors.class_section_group_id}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam Name</label>
                                        <input
                                            type="text"
                                            className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                            placeholder="e.g. Mid Term Exam"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                        />
                                        {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                            <input
                                                type="date"
                                                className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.start_date ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                            />
                                            {errors.start_date && <p className="text-red-600 text-sm mt-1">{errors.start_date}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                                            <input
                                                type="date"
                                                className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.end_date ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.end_date}
                                                onChange={(e) => setData('end_date', e.target.value)}
                                            />
                                            {errors.end_date && <p className="text-red-600 text-sm mt-1">{errors.end_date}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_published"
                                            checked={data.is_published}
                                            onChange={(e) => setData('is_published', e.target.checked)}
                                            className="rounded border-gray-300"
                                        />
                                        <label htmlFor="is_published" className="text-sm font-medium text-gray-700">Published</label>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingExam(null); reset(); }}
                                            className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                                        >
                                            {editingExam ? 'Update' : 'Save'}
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
