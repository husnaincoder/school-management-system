import React, { useMemo, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';

const emptyForm = { academic_session_id: '', class_section_id: '', teacher_id: '', subject_id: '' };

const selectClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

export default function TeacherClassSubjectsIndex({
    assignments = [],
    sessions = [],
    classSections = [],
    teachers = [],
    subjects = [],
    filterSessionId = '',
    filterClassSectionId = '',
}) {
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const label = (cs) => {
        if (!cs) return '—';
        const c = cs.class?.name ?? '';
        const s = cs.section?.name ?? '';
        return s ? `${c} - ${s}` : c;
    };

    const sessionOptions = useMemo(
        () => sessions.map((s) => ({ value: String(s.id), label: s.name, searchText: s.name })),
        [sessions]
    );
    const classSectionOptions = useMemo(
        () => classSections.map((cs) => {
            const text = label(cs);
            return { value: String(cs.id), label: text, searchText: text };
        }),
        [classSections]
    );
    const teacherOptions = useMemo(
        () => teachers.map((t) => ({ value: String(t.id), label: t.name, searchText: t.name })),
        [teachers]
    );
    const subjectOptions = useMemo(
        () => subjects.map((s) => ({ value: String(s.id), label: s.name, searchText: s.name })),
        [subjects]
    );

    const filterSessionOptions = useMemo(
        () => [{ value: '', label: 'All sessions' }, ...sessionOptions],
        [sessionOptions]
    );
    const filterClassSectionOptions = useMemo(
        () => [{ value: '', label: 'All class-sections' }, ...classSectionOptions],
        [classSectionOptions]
    );

    const applySessionFilter = (value) => {
        router.get(
            route('academic.teacher-class-subjects'),
            value
                ? { academic_session_id: value, class_section_id: filterClassSectionId || undefined }
                : (filterClassSectionId ? { class_section_id: filterClassSectionId } : {}),
            { preserveState: true }
        );
    };

    const applyClassSectionFilter = (value) => {
        router.get(
            route('academic.teacher-class-subjects'),
            value
                ? { class_section_id: value, academic_session_id: filterSessionId || undefined }
                : (filterSessionId ? { academic_session_id: filterSessionId } : {}),
            { preserveState: true }
        );
    };

    const openAdd = () => {
        setEditing(null);
        setData(emptyForm);
        setShowModal(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setData({
            academic_session_id: row.academic_session_id ?? '',
            class_section_id: row.class_section_id ?? '',
            teacher_id: row.teacher_id ?? '',
            subject_id: row.subject_id ?? '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editing) {
            put(route('academic.teacher-class-subjects.update', editing.id), {
                onSuccess: () => {
                    setShowModal(false);
                    setEditing(null);
                    reset();
                },
            });
        } else {
            post(route('academic.teacher-class-subjects.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (row) => {
        if (!window.confirm('Remove this assignment?')) return;
        router.delete(route('academic.teacher-class-subjects.destroy', row.id));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Teacher Class Subjects" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
                        <h1 className="text-2xl font-semibold">Teacher–Class–Subject</h1>
                        <div className="flex items-end gap-2 flex-wrap">
                            <div className="min-w-[160px]">
                                <SearchableSelect
                                    options={filterSessionOptions}
                                    value={filterSessionId || ''}
                                    onChange={applySessionFilter}
                                    placeholder="Search session..."
                                    inputClassName={selectClass}
                                />
                            </div>
                            <div className="min-w-[180px]">
                                <SearchableSelect
                                    options={filterClassSectionOptions}
                                    value={filterClassSectionId || ''}
                                    onChange={applyClassSectionFilter}
                                    placeholder="Search class-section..."
                                    inputClassName={selectClass}
                                />
                            </div>
                            <button
                                type="button"
                                onClick={openAdd}
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                            >
                                Assign Teacher–Subject
                            </button>
                        </div>
                    </div>
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Section</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {assignments.map((a) => (
                                    <tr key={a.id}>
                                        <td className="px-6 py-4">{a.academic_session?.name ?? '—'}</td>
                                        <td className="px-6 py-4">{label(a.class_section)}</td>
                                        <td className="px-6 py-4">{a.teacher?.name ?? '—'}</td>
                                        <td className="px-6 py-4">{a.subject?.name ?? '—'}</td>
                                        <td className="px-6 py-4">
                                            <button type="button" onClick={() => openEdit(a)} className="text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                                            <button type="button" onClick={() => handleDelete(a)} className="text-red-500 hover:text-red-700">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editing ? 'Edit Assignment' : 'Assign Teacher–Subject'}</h2>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditing(null);
                                            reset();
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
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
                                                inputClassName={selectClass}
                                            />
                                            {errors.academic_session_id && <p className="text-red-500 text-sm mt-1">{errors.academic_session_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Section</label>
                                            <SearchableSelect
                                                options={classSectionOptions}
                                                value={data.class_section_id}
                                                onChange={(id) => setData('class_section_id', id)}
                                                placeholder="Search class-section..."
                                                inputClassName={selectClass}
                                            />
                                            {errors.class_section_id && <p className="text-red-500 text-sm mt-1">{errors.class_section_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                                            <SearchableSelect
                                                options={teacherOptions}
                                                value={data.teacher_id}
                                                onChange={(id) => setData('teacher_id', id)}
                                                placeholder="Search teacher..."
                                                inputClassName={selectClass}
                                            />
                                            {errors.teacher_id && <p className="text-red-500 text-sm mt-1">{errors.teacher_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                            <SearchableSelect
                                                options={subjectOptions}
                                                value={data.subject_id}
                                                onChange={(id) => setData('subject_id', id)}
                                                placeholder="Search subject..."
                                                inputClassName={selectClass}
                                            />
                                            {errors.subject_id && <p className="text-red-500 text-sm mt-1">{errors.subject_id}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                setEditing(null);
                                                reset();
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={processing} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
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
