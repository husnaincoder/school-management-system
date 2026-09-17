import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faClipboardList, faPen, faTrashCan, faPlus, faTrophy, faPenToSquare, faFileExcel, faFilePdf, faIdCard } from '@fortawesome/free-solid-svg-icons';

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

function sid(value) {
    if (value === null || value === undefined || value === '') return '';
    return String(value);
}

function asArray(value) {
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') return Object.values(value);
    return [];
}

function studentName(enrollment) {
    if (enrollment?.student_name) return enrollment.student_name;
    const s = enrollment?.student;
    const u = s?.user;
    if (u?.name) return u.name;
    return [s?.first_name, s?.last_name].filter(Boolean).join(' ') || enrollment?.roll_number || '—';
}

function buildFilterTreeFromExam(exam) {
    if (!exam) return [];
    const sessionId = exam.academic_session_id ?? exam.academic_session?.id ?? exam.academicSession?.id;
    if (sessionId == null || sessionId === '') return [];

    const sessionName =
        exam.academic_session?.name
        ?? exam.academicSession?.name
        ?? `Session #${sessionId}`;

    const csg = exam.class_section_group || exam.classSectionGroup;
    const cs = csg?.class_section || csg?.classSection;
    const classId = cs?.class_id ?? cs?.class?.id ?? null;
    const className = cs?.class?.name ?? (classId != null ? `Class #${classId}` : null);
    const sectionId = cs?.section_id ?? cs?.section?.id ?? null;
    const sectionName = cs?.section?.name ?? (sectionId != null ? `Section #${sectionId}` : null);

    return [{
        id: sessionId,
        name: sessionName,
        classes: classId != null ? [{
            id: classId,
            name: className,
            sections: sectionId != null ? [{
                id: sectionId,
                name: sectionName,
            }] : [],
        }] : [],
    }];
}

function defaultsFromExam(exam) {
    if (!exam) return {};
    const csg = exam.class_section_group || exam.classSectionGroup;
    const cs = csg?.class_section || csg?.classSection;
    return {
        academic_session_id: exam.academic_session_id ?? exam.academic_session?.id ?? exam.academicSession?.id ?? cs?.academic_session_id ?? null,
        class_id: cs?.class_id ?? cs?.class?.id ?? null,
        section_id: cs?.section_id ?? cs?.section?.id ?? null,
        session_name: exam.academic_session?.name ?? exam.academicSession?.name ?? cs?.academic_session?.name ?? cs?.academicSession?.name ?? null,
        class_name: cs?.class?.name ?? null,
        section_name: cs?.section?.name ?? null,
    };
}

function buildFilterTreeFromEnrollments(enrollments) {
    const sessions = new Map();
    enrollments.forEach((en) => {
        const sessionId = en.academic_session_id;
        if (sessionId == null || sessionId === '') return;
        if (!sessions.has(sid(sessionId))) {
            sessions.set(sid(sessionId), {
                id: sessionId,
                name: en.session_name || `Session #${sessionId}`,
                classes: new Map(),
            });
        }
        const sessionNode = sessions.get(sid(sessionId));
        const classId = en.class_id;
        if (classId == null || classId === '') return;
        if (!sessionNode.classes.has(sid(classId))) {
            sessionNode.classes.set(sid(classId), {
                id: classId,
                name: en.class_name || `Class #${classId}`,
                sections: new Map(),
            });
        }
        const classNode = sessionNode.classes.get(sid(classId));
        const sectionId = en.section_id;
        if (sectionId == null || sectionId === '') return;
        if (!classNode.sections.has(sid(sectionId))) {
            classNode.sections.set(sid(sectionId), {
                id: sectionId,
                name: en.section_name || `Section #${sectionId}`,
            });
        }
    });

    return Array.from(sessions.values()).map((session) => ({
        id: session.id,
        name: session.name,
        classes: Array.from(session.classes.values()).map((cls) => ({
            id: cls.id,
            name: cls.name,
            sections: Array.from(cls.sections.values()),
        })),
    }));
}

const emptyForm = { student_enrollment_id: '', total_marks: '', obtained_marks: '', grade: '', position: '', is_passed: true };

const selectInputClass = (hasError) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`;

export default function ExamResults({
    exam,
    results = [],
    enrollments = [],
    existingEnrollmentIds = [],
    stats = {},
    filterTree = [],
    filterDefaults = {},
}) {
    const { flash } = usePage().props;
    const list = Array.isArray(results) ? results : [];
    const existingIds = asArray(existingEnrollmentIds).map(sid);
    const enrollmentList = asArray(enrollments);
    const resolvedDefaults = useMemo(() => {
        const fromProps = filterDefaults && typeof filterDefaults === 'object' ? filterDefaults : {};
        if (fromProps.academic_session_id || fromProps.class_id || fromProps.section_id) {
            return fromProps;
        }
        return defaultsFromExam(exam);
    }, [filterDefaults, exam]);

    const tree = useMemo(() => {
        const fromProps = asArray(filterTree);
        if (fromProps.length > 0) return fromProps;
        const fromExam = buildFilterTreeFromExam(exam);
        if (fromExam.length > 0) return fromExam;
        return buildFilterTreeFromEnrollments(enrollmentList);
    }, [filterTree, exam, enrollmentList]);

    const availableEnrollments = enrollmentList.filter((e) => !existingIds.includes(sid(e.id)));
    const s = stats || {};

    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [selectedEnrollmentIds, setSelectedEnrollmentIds] = useState([]);
    const [filterSessionId, setFilterSessionId] = useState('');
    const [filterClassId, setFilterClassId] = useState('');
    const [filterSectionId, setFilterSectionId] = useState('');
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const toggleSelectAll = () => {
        if (selectedEnrollmentIds.length === list.length) {
            setSelectedEnrollmentIds([]);
        } else {
            setSelectedEnrollmentIds(list.map((item) => (item.student_enrollment || item.studentEnrollment)?.id).filter(Boolean));
        }
    };
    const toggleSelectOne = (enrollmentId) => {
        setSelectedEnrollmentIds((prev) =>
            prev.includes(enrollmentId) ? prev.filter((id) => id !== enrollmentId) : [...prev, enrollmentId]
        );
    };
    const downloadSheetUrl = selectedEnrollmentIds.length > 0
        ? route('academic.exam-results.sheet', exam.id) + '?enrollment_ids=' + selectedEnrollmentIds.join(',')
        : route('academic.exam-results.sheet', exam.id);
    const downloadMeritListUrl = selectedEnrollmentIds.length > 0
        ? route('academic.exam-results.merit-list', exam.id) + '?enrollment_ids=' + selectedEnrollmentIds.join(',')
        : route('academic.exam-results.merit-list', exam.id);
    const downloadResultCardUrl = selectedEnrollmentIds.length > 0
        ? route('academic.exam-results.result-card', exam.id) + '?enrollment_ids=' + selectedEnrollmentIds.join(',')
        : route('academic.exam-results.result-card', exam.id);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const selectedSessionNode = useMemo(
        () => tree.find((row) => sid(row.id) === filterSessionId) || null,
        [tree, filterSessionId]
    );
    const availableClasses = useMemo(
        () => asArray(selectedSessionNode?.classes),
        [selectedSessionNode]
    );
    const selectedClassNode = useMemo(
        () => availableClasses.find((row) => sid(row.id) === filterClassId) || null,
        [availableClasses, filterClassId]
    );
    const availableSections = useMemo(
        () => asArray(selectedClassNode?.sections),
        [selectedClassNode]
    );

    const filteredAvailableEnrollments = useMemo(() => {
        return availableEnrollments.filter((en) => {
            const csg = en.class_section_group || en.classSectionGroup;
            const cs = csg?.class_section || csg?.classSection;
            const sessionId = en.academic_session_id ?? cs?.academic_session_id ?? null;
            const classId = en.class_id ?? cs?.class_id ?? cs?.class?.id ?? null;
            const sectionId = en.section_id ?? cs?.section_id ?? cs?.section?.id ?? null;

            // All enrollments are already scoped to this exam group.
            // If row has no filter metadata, keep it visible.
            if (sessionId == null && classId == null && sectionId == null) return true;

            if (filterSessionId && sessionId != null && sid(sessionId) !== filterSessionId) return false;
            if (filterClassId && classId != null && sid(classId) !== filterClassId) return false;
            if (filterSectionId && sectionId != null && sid(sectionId) !== filterSectionId) return false;
            return true;
        });
    }, [availableEnrollments, filterSessionId, filterClassId, filterSectionId]);

    useEffect(() => {
        if (!showModal || editingItem) return;
        if (filterClassId && !availableClasses.some((c) => sid(c.id) === filterClassId)) {
            setFilterClassId('');
            setFilterSectionId('');
            setData('student_enrollment_id', '');
        }
    }, [showModal, editingItem, availableClasses, filterClassId, setData]);

    useEffect(() => {
        if (!showModal || editingItem) return;
        if (filterSectionId && !availableSections.some((sec) => sid(sec.id) === filterSectionId)) {
            setFilterSectionId('');
            setData('student_enrollment_id', '');
        }
    }, [showModal, editingItem, availableSections, filterSectionId, setData]);

    useEffect(() => {
        if (!showModal || editingItem) return;
        if (!data.student_enrollment_id) return;
        const stillVisible = filteredAvailableEnrollments.some((en) => sid(en.id) === sid(data.student_enrollment_id));
        if (!stillVisible) setData('student_enrollment_id', '');
    }, [showModal, editingItem, filteredAvailableEnrollments, data.student_enrollment_id, setData]);

    const sessionOptions = useMemo(
        () => tree.map((row) => ({
            value: String(row.id),
            label: row.name || `Session #${row.id}`,
            searchText: row.name || '',
        })),
        [tree]
    );
    const classOptions = useMemo(
        () => availableClasses.map((row) => ({
            value: String(row.id),
            label: row.name || `Class #${row.id}`,
            searchText: row.name || '',
        })),
        [availableClasses]
    );
    const sectionOptions = useMemo(
        () => availableSections.map((row) => ({
            value: String(row.id),
            label: row.name || `Section #${row.id}`,
            searchText: row.name || '',
        })),
        [availableSections]
    );
    const studentOptions = useMemo(
        () => filteredAvailableEnrollments.map((en) => {
            const name = studentName(en);
            const roll = en.roll_number ?? '—';
            return {
                value: String(en.id),
                label: name,
                sublabel: `Roll: ${roll}`,
                searchText: `${name} ${roll}`,
            };
        }),
        [filteredAvailableEnrollments]
    );

    const openAddModal = () => {
        setEditingItem(null);
        setFilterSessionId(sid(resolvedDefaults?.academic_session_id));
        setFilterClassId(sid(resolvedDefaults?.class_id));
        setFilterSectionId(sid(resolvedDefaults?.section_id));
        reset();
        setData({ ...emptyForm, student_enrollment_id: '' });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        const en = item.student_enrollment || item.studentEnrollment;
        setFilterSessionId(sid(resolvedDefaults?.academic_session_id));
        setFilterClassId(sid(resolvedDefaults?.class_id));
        setFilterSectionId(sid(resolvedDefaults?.section_id));
        setData({
            student_enrollment_id: en?.id != null ? String(en.id) : '',
            total_marks: item.total_marks != null ? String(item.total_marks) : '',
            obtained_marks: item.obtained_marks != null ? String(item.obtained_marks) : '',
            grade: item.grade ?? '',
            position: item.position != null ? String(item.position) : '',
            is_passed: item.is_passed ?? true,
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        setFilterSessionId('');
        setFilterClassId('');
        setFilterSectionId('');
        reset();
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('academic.exam-results.update', editingItem.id), {
                onSuccess: () => { closeModal(); },
            });
        } else {
            post(route('academic.exam-results.store', exam.id), {
                onSuccess: () => { closeModal(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm('Delete this result?')) return;
        router.delete(route('academic.exam-results.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Exam Results" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${banner.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    <div className="mb-4">
                        <nav className="flex text-sm text-gray-500 mb-2">
                            <Link href={route('academic.exams')} className="hover:text-gray-700">Dashboard</Link>
                            <span className="mx-2">/</span>
                            <Link href={route('academic.exams')} className="hover:text-gray-700">Exams</Link>
                            <span className="mx-2">/</span>
                            <span className="text-gray-900 font-medium">Results & Statistics</span>
                        </nav>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{exam?.name ?? 'Exam'} - Results & Statistics</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {exam?.exam_type?.name ?? '—'} | {formatDate(exam?.start_date)} - {formatDate(exam?.end_date)}
                                </p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <Link
                                    href={route('academic.exams.marks-entry', exam.id)}
                                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg"
                                >
                                    <FontAwesomeIcon icon={faPenToSquare} /> Enter Marks
                                </Link>
                                {availableEnrollments.length > 0 && (
                                    <button
                                        type="button"
                                        onClick={openAddModal}
                                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg"
                                    >
                                        <FontAwesomeIcon icon={faPlus} /> Add Result
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Class</label>
                            <p className="text-gray-900 font-medium">{(exam?.class_section_group || exam?.classSectionGroup)?.class_section?.class?.name ?? (exam?.class_section_group || exam?.classSectionGroup)?.classSection?.class?.name ?? '—'}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Section</label>
                            <p className="text-gray-900 font-medium">{(exam?.class_section_group || exam?.classSectionGroup)?.class_section?.section?.name ?? (exam?.class_section_group || exam?.classSectionGroup)?.classSection?.section?.name ?? '—'}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">Total Students</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">{s.total_students ?? 0}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">Passed</p>
                            <p className="text-2xl font-bold text-emerald-600 mt-1">{s.passed_count ?? 0} ({s.passed_percent ?? 0}%)</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">Failed</p>
                            <p className="text-2xl font-bold text-red-600 mt-1">{s.failed_count ?? 0}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">Absent</p>
                            <p className="text-2xl font-bold text-gray-700 mt-1">{s.absent_count ?? 0}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">Highest Percentage</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">{s.highest_percentage != null ? s.highest_percentage + '%' : '—'}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">Average Percentage</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">{s.average_percentage != null ? s.average_percentage + '%' : '—'}</p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                            <p className="text-sm font-medium text-gray-500">Lowest Percentage</p>
                            <p className="text-xl font-bold text-gray-900 mt-1">{s.lowest_percentage != null ? s.lowest_percentage + '%' : '—'}</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Download Reports</h2>
                        <p className="text-sm text-gray-500 mb-3">
                            {selectedEnrollmentIds.length > 0
                                ? `${selectedEnrollmentIds.length} student(s) selected — download only selected.`
                                : 'Select students in the table below to download only those, or leave unselected to download all.'}
                        </p>
                        <div className="flex flex-wrap gap-3">
                            <a
                                href={downloadSheetUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2.5 px-4 rounded-lg"
                            >
                                <FontAwesomeIcon icon={faFileExcel} /> Result Sheet (Excel)
                            </a>
                            <a
                                href={downloadMeritListUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg"
                            >
                                <FontAwesomeIcon icon={faFilePdf} /> Merit List (PDF)
                            </a>
                            <a
                                href={downloadResultCardUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium py-2.5 px-4 rounded-lg"
                            >
                                <FontAwesomeIcon icon={faIdCard} /> Result Card (PDF)
                            </a>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                <FontAwesomeIcon icon={faClipboardList} className="text-amber-500" /> Results
                            </h2>
                            <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} result{list.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-4 py-3 text-left">
                                            {list.length > 0 && (
                                                <input
                                                    type="checkbox"
                                                    checked={selectedEnrollmentIds.length === list.length}
                                                    onChange={toggleSelectAll}
                                                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                    title="Select all"
                                                />
                                            )}
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">#</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Roll</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Total</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Obtained</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">%</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Grade</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Grade Point</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Position</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={12} className="px-6 py-12 text-center text-gray-500">
                                                No results yet. Add a result using &quot;Add Result&quot; or enter marks first from the exam page.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item, idx) => {
                                            const en = item.student_enrollment || item.studentEnrollment;
                                            const enId = en?.id;
                                            const isSelected = enId && selectedEnrollmentIds.includes(enId);
                                            return (
                                                <tr key={item.id} className={`hover:bg-gray-50/80 transition-colors ${isSelected ? 'bg-amber-50/50' : ''}`}>
                                                    <td className="px-4 py-4">
                                                        {enId && (
                                                            <input
                                                                type="checkbox"
                                                                checked={isSelected}
                                                                onChange={() => toggleSelectOne(enId)}
                                                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                            />
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{idx + 1}</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{studentName(en)}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{en?.roll_number ?? '—'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{item.total_marks}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{item.obtained_marks}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{item.percentage}%</td>
                                                    <td className="px-6 py-4 font-medium text-gray-900">{item.grade ?? '—'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{item.grade_point != null ? item.grade_point : '—'}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-600">{item.position ?? '—'}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${item.is_passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                            {item.is_passed ? 'Pass' : 'Fail'}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        {enId && (
                                                            <a
                                                                href={route('academic.exam-results.result-card', exam.id) + '?enrollment_ids=' + enId}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-amber-600 hover:text-amber-800 font-medium text-sm mr-3"
                                                                title="Print Result Card"
                                                            >
                                                                <FontAwesomeIcon icon={faIdCard} className="mr-1" /> Card
                                                            </a>
                                                        )}
                                                        <button type="button" onClick={() => openEditModal(item)} className="text-amber-600 hover:text-amber-800 font-medium text-sm mr-3">
                                                            <FontAwesomeIcon icon={faPen} className="mr-1" /> Edit
                                                        </button>
                                                        <button type="button" onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-800 font-medium text-sm">
                                                            <FontAwesomeIcon icon={faTrashCan} className="mr-1" /> Delete
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-5xl border border-gray-200 max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">{editingItem ? 'Edit Result' : 'Add Result'}</h2>
                                    <button type="button" onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-xl leading-none">×</button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {!editingItem && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Session</label>
                                                    <SearchableSelect
                                                        options={sessionOptions}
                                                        value={filterSessionId}
                                                        onChange={(value) => {
                                                            setFilterSessionId(value);
                                                            setFilterClassId('');
                                                            setFilterSectionId('');
                                                            setData('student_enrollment_id', '');
                                                        }}
                                                        placeholder="Search session..."
                                                        inputClassName={selectInputClass(false)}
                                                        emptyText="No sessions found"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                                    <SearchableSelect
                                                        options={classOptions}
                                                        value={filterClassId}
                                                        onChange={(value) => {
                                                            setFilterClassId(value);
                                                            setFilterSectionId('');
                                                            setData('student_enrollment_id', '');
                                                        }}
                                                        placeholder={filterSessionId ? 'Search class...' : 'Select session first'}
                                                        inputClassName={selectInputClass(false)}
                                                        emptyText={filterSessionId ? 'No classes found' : 'Select session first'}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                                                    <SearchableSelect
                                                        options={sectionOptions}
                                                        value={filterSectionId}
                                                        onChange={(value) => {
                                                            setFilterSectionId(value);
                                                            setData('student_enrollment_id', '');
                                                        }}
                                                        placeholder={filterClassId ? 'Search section...' : 'Select class first'}
                                                        inputClassName={selectInputClass(false)}
                                                        emptyText={filterClassId ? 'No sections found' : 'Select class first'}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                                                <SearchableSelect
                                                    options={studentOptions}
                                                    value={sid(data.student_enrollment_id)}
                                                    onChange={(value) => setData('student_enrollment_id', value)}
                                                    placeholder="Search student by name or roll..."
                                                    inputClassName={selectInputClass(!!errors.student_enrollment_id)}
                                                    emptyText={
                                                        !filterSessionId
                                                            ? 'Select session first'
                                                            : 'No students available for this filter'
                                                    }
                                                />
                                                {errors.student_enrollment_id && <p className="text-red-600 text-sm mt-1">{errors.student_enrollment_id}</p>}
                                            </div>
                                        </>
                                    )}
                                    {editingItem && (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
                                            Student: <span className="font-medium text-gray-900">{studentName(editingItem.student_enrollment || editingItem.studentEnrollment)}</span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Total Marks</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className={selectInputClass(!!errors.total_marks)}
                                                value={data.total_marks}
                                                onChange={(e) => setData('total_marks', e.target.value)}
                                            />
                                            {errors.total_marks && <p className="text-red-600 text-sm mt-1">{errors.total_marks}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Obtained Marks</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className={selectInputClass(!!errors.obtained_marks)}
                                                value={data.obtained_marks}
                                                onChange={(e) => setData('obtained_marks', e.target.value)}
                                            />
                                            {errors.obtained_marks && <p className="text-red-600 text-sm mt-1">{errors.obtained_marks}</p>}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade (optional)</label>
                                            <input
                                                type="text"
                                                className={selectInputClass(!!errors.grade)}
                                                placeholder="A+"
                                                value={data.grade}
                                                onChange={(e) => setData('grade', e.target.value)}
                                                maxLength={10}
                                            />
                                            {errors.grade && <p className="text-red-600 text-sm mt-1">{errors.grade}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Position (optional)</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className={selectInputClass(!!errors.position)}
                                                placeholder="1"
                                                value={data.position}
                                                onChange={(e) => setData('position', e.target.value)}
                                            />
                                            {errors.position && <p className="text-red-600 text-sm mt-1">{errors.position}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_passed"
                                            checked={data.is_passed}
                                            onChange={(e) => setData('is_passed', e.target.checked)}
                                            className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                        />
                                        <label htmlFor="is_passed" className="text-sm font-medium text-gray-700">Passed</label>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium">Cancel</button>
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
