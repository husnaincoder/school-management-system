import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardList,
    faPlus,
    faPen,
    faTrashCan,
    faBook,
    faArrowLeft,
    faPenToSquare,
    faTrophy,
    faCalendarDays,
    faRotate,
    faFilePdf,
} from '@fortawesome/free-solid-svg-icons';

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function csgLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

const emptyAddForm = { subject_id: '', total_marks: '100', passing_marks: '33' };
const emptyEditForm = { total_marks: '', passing_marks: '' };
const emptyDateForm = {
    exam_date: '',
    start_time: '',
    end_time: '',
    room: '',
    invigilator_teacher_id: '',
};

export default function ExamShow({ exam, subjects = [], dateSheetRows = [], invigilators = [] }) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingEs, setEditingEs] = useState(null);
    const [dateSheetTarget, setDateSheetTarget] = useState(null);
    const { data: addData, setData: setAddData, post, processing: addProcessing, errors: addErrors, reset: resetAdd } = useForm(emptyAddForm);
    const { data: editData, setData: setEditData, put, processing: editProcessing, errors: editErrors, reset: resetEdit } = useForm(emptyEditForm);
    const {
        data: dateData,
        setData: setDateData,
        put: putDate,
        processing: dateProcessing,
        errors: dateErrors,
        reset: resetDate,
    } = useForm(emptyDateForm);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const examSubjects = exam?.exam_subjects ?? exam?.examSubjects ?? [];
    const rows = Array.isArray(dateSheetRows) && dateSheetRows.length > 0
        ? dateSheetRows
        : examSubjects.map((es) => ({
            id: es.id,
            subject_name: es.subject?.name ?? '—',
            total_marks: es.total_marks,
            passing_marks: es.passing_marks,
            exam_date: es.exam_date,
            start_time: es.start_time,
            end_time: es.end_time,
            room: es.room,
            invigilator_teacher_id: es.invigilator_teacher_id,
            invigilator_name: es.invigilator?.user?.name,
            subject_teacher_name: null,
        }));

    const openAddModal = () => {
        setAddData(emptyAddForm);
        resetAdd();
        setShowAddModal(true);
    };

    const openEditModal = (es) => {
        setEditingEs(es);
        setEditData({ total_marks: String(es.total_marks ?? ''), passing_marks: String(es.passing_marks ?? '') });
        resetEdit();
    };

    const openDateSheetModal = (row) => {
        setDateSheetTarget(row);
        setDateData({
            exam_date: row.exam_date || '',
            start_time: row.start_time ? String(row.start_time).slice(0, 5) : '',
            end_time: row.end_time ? String(row.end_time).slice(0, 5) : '',
            room: row.room || '',
            invigilator_teacher_id: row.invigilator_teacher_id ? String(row.invigilator_teacher_id) : '',
        });
        resetDate();
    };

    const handleAddSubmit = (e) => {
        e.preventDefault();
        post(route('academic.exam-subjects.store', exam.id), {
            onSuccess: () => { setShowAddModal(false); resetAdd(); },
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editingEs) return;
        put(route('academic.exam-subjects.update', editingEs.id), {
            onSuccess: () => { setEditingEs(null); resetEdit(); },
        });
    };

    const handleDateSheetSubmit = (e) => {
        e.preventDefault();
        if (!dateSheetTarget) return;
        putDate(route('academic.exam-subjects.date-sheet', dateSheetTarget.id), {
            onSuccess: () => { setDateSheetTarget(null); resetDate(); },
        });
    };

    const handleDelete = (es) => {
        if (!window.confirm(`Remove "${es.subject?.name ?? es.subject_name ?? 'this subject'}" from this exam?`)) return;
        router.delete(route('academic.exam-subjects.destroy', es.id), { preserveScroll: true });
    };

    const syncSubjects = () => {
        router.post(route('academic.exam-subjects.sync', exam.id), {}, { preserveScroll: true });
    };

    const alreadyAddedIds = examSubjects.map((es) => String(es.subject_id ?? es.subject?.id ?? '')).filter(Boolean);
    const availableSubjects = subjects.filter((s) => !alreadyAddedIds.includes(String(s.id)));

    const subjectOptions = useMemo(
        () =>
            availableSubjects.map((s) => ({
                value: String(s.id),
                label: s.name,
                searchText: s.name,
                selectedLabel: s.name,
            })),
        [availableSubjects]
    );

    const invigilatorOptions = useMemo(
        () => [
            { value: '', label: 'No invigilator', searchText: 'none', selectedLabel: 'No invigilator' },
            ...invigilators.map((t) => ({
                value: String(t.id),
                label: t.name,
                searchText: t.name,
                selectedLabel: t.name,
            })),
        ],
        [invigilators]
    );

    return (
        <AuthenticatedLayout>
            <Head title="Exam Details" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${banner.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                            <Link href={route('academic.exams')} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium mb-2">
                                <FontAwesomeIcon icon={faArrowLeft} /> Back to Exams
                            </Link>
                            <div className="flex items-center gap-3 mt-2">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                    <FontAwesomeIcon icon={faClipboardList} className="text-amber-500 text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{exam?.name ?? 'Exam'}</h1>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {exam?.exam_type?.name ?? '—'} · {exam?.academic_session?.name ?? '—'} · {formatDate(exam?.start_date)} – {formatDate(exam?.end_date)}
                                        {exam?.class_section_group || exam?.classSectionGroup ? ` · ${csgLabel(exam.class_section_group || exam.classSectionGroup)}` : ''}
                                    </p>
                                    <span className={`inline-flex mt-2 px-2.5 py-1 rounded-md text-xs font-semibold border ${exam?.is_published ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                        {exam?.is_published ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <a
                                href={route('academic.exams.date-sheet', exam.id)}
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg"
                            >
                                <FontAwesomeIcon icon={faFilePdf} /> Date Sheet PDF
                            </a>
                            <Link
                                href={route('academic.exam-results.index', exam.id)}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg"
                            >
                                <FontAwesomeIcon icon={faTrophy} /> Results
                            </Link>
                            <Link
                                href={route('academic.exams.marks-entry', exam.id)}
                                className="inline-flex items-center gap-2 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg"
                            >
                                <FontAwesomeIcon icon={faPenToSquare} /> Enter Marks
                            </Link>
                        </div>
                    </div>

                    {/* Exam Subjects */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                    <FontAwesomeIcon icon={faBook} className="text-amber-500" /> Exam Subjects
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Subjects auto-load from Class Section Group Subjects. Default marks 100 / 33 — edit if needed.
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={syncSubjects}
                                    className="inline-flex items-center gap-2 border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-sm font-medium py-2 px-4 rounded-lg"
                                >
                                    <FontAwesomeIcon icon={faRotate} /> Load from Class
                                </button>
                                <button
                                    type="button"
                                    onClick={openAddModal}
                                    disabled={availableSubjects.length === 0}
                                    className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg"
                                >
                                    <FontAwesomeIcon icon={faPlus} /> Add Extra
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Subject</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Subject Teacher</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Passing</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                                No subjects yet. Assign subjects to this class group, then click &quot;Load from Class&quot;.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr key={`sub-${row.id}`} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-900">{row.subject_name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{row.subject_teacher_name || '—'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{row.total_marks}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{row.passing_marks}</td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => openEditModal(row)} className="text-amber-600 hover:text-amber-800 font-medium text-sm mr-3">
                                                        <FontAwesomeIcon icon={faPen} className="mr-1" /> Marks
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(row)} className="text-red-600 hover:text-red-800 font-medium text-sm">
                                                        <FontAwesomeIcon icon={faTrashCan} className="mr-1" /> Remove
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Date Sheet */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden mb-6">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-amber-50/80 to-white flex items-center justify-between flex-wrap gap-2">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                    <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500" /> Date Sheet
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Set exam date, time, room and <span className="font-semibold text-gray-700">Invigilator</span>.
                                    Subject Teacher (from class assignment) stays separate — e.g. Physics teacher Mr. Ahmed, invigilator Mr. Bilal.
                                </p>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Time</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Room</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Subject Teacher</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Invigilator</th>
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {rows.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                                Load subjects first, then schedule the date sheet.
                                            </td>
                                        </tr>
                                    ) : (
                                        rows.map((row) => (
                                            <tr key={`ds-${row.id}`} className="hover:bg-amber-50/40 transition-colors">
                                                <td className="px-4 py-3.5 text-sm text-gray-700">{row.exam_date ? formatDate(row.exam_date) : '—'}</td>
                                                <td className="px-4 py-3.5 text-sm font-semibold text-gray-900">{row.subject_name}</td>
                                                <td className="px-4 py-3.5 text-sm text-gray-600">
                                                    {row.start_time || row.end_time
                                                        ? `${row.start_time || '—'} – ${row.end_time || '—'}`
                                                        : '—'}
                                                </td>
                                                <td className="px-4 py-3.5 text-sm text-gray-600">{row.room || '—'}</td>
                                                <td className="px-4 py-3.5 text-sm text-slate-600">
                                                    <span className="inline-flex rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                                                        {row.subject_teacher_name || 'Not assigned'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-sm text-emerald-800">
                                                    <span className="inline-flex rounded-md bg-emerald-50 border border-emerald-100 px-2 py-0.5 text-xs font-medium">
                                                        {row.invigilator_name || 'Not set'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openDateSheetModal(row)}
                                                        className="text-amber-600 hover:text-amber-800 font-medium text-sm"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} className="mr-1" /> Schedule
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Add Subject Modal */}
                    {showAddModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
                            <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-xl overflow-visible">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Add Extra Subject</h2>
                                    <button type="button" onClick={() => { setShowAddModal(false); resetAdd(); }} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
                                </div>
                                <form onSubmit={handleAddSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                                        <SearchableSelect
                                            options={subjectOptions}
                                            value={addData.subject_id}
                                            onChange={(v) => setAddData('subject_id', v)}
                                            placeholder="Search and select subject..."
                                            inputClassName="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                        {addErrors.subject_id && <p className="text-red-500 text-xs mt-1">{addErrors.subject_id}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Total marks</label>
                                            <input type="number" min="1" value={addData.total_marks} onChange={(e) => setAddData('total_marks', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 100" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Passing marks</label>
                                            <input type="number" min="0" value={addData.passing_marks} onChange={(e) => setAddData('passing_marks', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. 33" />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={() => { setShowAddModal(false); resetAdd(); }} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
                                        <button type="submit" disabled={addProcessing} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium disabled:opacity-50">Add</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Edit marks modal */}
                    {editingEs && (
                        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
                            <div className="bg-white rounded-xl p-6 w-full max-w-md border border-gray-200 shadow-xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">Edit Marks — {editingEs.subject?.name || editingEs.subject_name}</h2>
                                    <button type="button" onClick={() => { setEditingEs(null); resetEdit(); }} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
                                </div>
                                <form onSubmit={handleEditSubmit} className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Total marks</label>
                                            <input type="number" min="1" value={editData.total_marks} onChange={(e) => setEditData('total_marks', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                            {editErrors.total_marks && <p className="text-red-500 text-xs mt-1">{editErrors.total_marks}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Passing marks</label>
                                            <input type="number" min="0" value={editData.passing_marks} onChange={(e) => setEditData('passing_marks', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                            {editErrors.passing_marks && <p className="text-red-500 text-xs mt-1">{editErrors.passing_marks}</p>}
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={() => { setEditingEs(null); resetEdit(); }} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
                                        <button type="submit" disabled={editProcessing} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium disabled:opacity-50">Save</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Date sheet schedule modal */}
                    {dateSheetTarget && (
                        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-20 overflow-y-auto">
                            <div className="bg-white rounded-xl p-6 w-full max-w-lg border border-gray-200 shadow-xl overflow-visible">
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">Schedule — {dateSheetTarget.subject_name}</h2>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Subject teacher: <strong>{dateSheetTarget.subject_teacher_name || 'Not assigned'}</strong> (from class) · Invigilator is separate
                                        </p>
                                    </div>
                                    <button type="button" onClick={() => { setDateSheetTarget(null); resetDate(); }} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
                                </div>
                                <form onSubmit={handleDateSheetSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Exam date</label>
                                        <input type="date" value={dateData.exam_date} onChange={(e) => setDateData('exam_date', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                        {dateErrors.exam_date && <p className="text-red-500 text-xs mt-1">{dateErrors.exam_date}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Start time</label>
                                            <input type="time" value={dateData.start_time} onChange={(e) => setDateData('start_time', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">End time</label>
                                            <input type="time" value={dateData.end_time} onChange={(e) => setDateData('end_time', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                                            {dateErrors.end_time && <p className="text-red-500 text-xs mt-1">{dateErrors.end_time}</p>}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Room / Hall</label>
                                        <input type="text" value={dateData.room} onChange={(e) => setDateData('room', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Hall A" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date Sheet Invigilator</label>
                                        <SearchableSelect
                                            options={invigilatorOptions}
                                            value={dateData.invigilator_teacher_id}
                                            onChange={(v) => setDateData('invigilator_teacher_id', v)}
                                            placeholder="Select invigilator..."
                                            inputClassName="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                        />
                                        <p className="text-[11px] text-gray-400 mt-1">Different from subject teacher — who supervises the exam hall.</p>
                                        {dateErrors.invigilator_teacher_id && <p className="text-red-500 text-xs mt-1">{dateErrors.invigilator_teacher_id}</p>}
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={() => { setDateSheetTarget(null); resetDate(); }} className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-600">Cancel</button>
                                        <button type="submit" disabled={dateProcessing} className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium disabled:opacity-50">Save Schedule</button>
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
