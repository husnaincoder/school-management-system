import React, { useEffect, useState } from 'react';
import {Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardList, faArrowLeft, faSave, faUserGraduate } from '@fortawesome/free-solid-svg-icons';

function csgLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

function studentName(enrollment) {
    const s = enrollment.student;
    if (!s) return '—';
    const first = s.first_name ?? '';
    const last = s.last_name ?? '';
    const name = [first, last].filter(Boolean).join(' ').trim();
    return name || s.user?.name || '—';
}

const ATTENDANCE_OPTIONS = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'leave', label: 'Leave' },
];

export default function ExamMarksEntry({ exam, enrollments = [], recordsByKey = {} }) {
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [grid, setGrid] = useState({});
    const { flash } = usePage().props;
    const examSubjects = exam?.exam_subjects ?? exam?.examSubjects ?? [];

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        const initial = {};
        enrollments.forEach((en) => {
            examSubjects.forEach((es) => {
                const key = `${es.id}_${en.id}`;
                const existing = recordsByKey[key];
                initial[key] = {
                    obtained_marks: existing?.obtained_marks ?? '',
                    attendance_status: existing?.attendance_status ?? 'present',
                };
            });
        });
        setGrid(initial);
    }, [examSubjects, enrollments, recordsByKey]);

    const setCell = (examSubjectId, enrollmentId, field, value) => {
        const key = `${examSubjectId}_${enrollmentId}`;
        setGrid((prev) => ({
            ...prev,
            [key]: {
                ...(prev[key] || { obtained_marks: '', attendance_status: 'present' }),
                [field]: value,
            },
        }));
    };

    const getCell = (examSubjectId, enrollmentId) => {
        const key = `${examSubjectId}_${enrollmentId}`;
        return grid[key] || { obtained_marks: '', attendance_status: 'present' };
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const records = [];
        enrollments.forEach((en) => {
            examSubjects.forEach((es) => {
                const cell = getCell(es.id, en.id);
                records.push({
                    exam_subject_id: es.id,
                    student_enrollment_id: en.id,
                    obtained_marks: cell.obtained_marks === '' ? null : Number(cell.obtained_marks),
                    attendance_status: cell.attendance_status,
                });
            });
        });
        router.post(route('academic.exams.marks-entry.store', exam.id), { records }, { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Exam Marks Entry" />
            <div className="py-8">
                <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${banner.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    <div className="mb-6">
                        <Link href={route('academic.exams.show', exam.id)} className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium mb-2">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back to Exam
                        </Link>
                        <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                    <FontAwesomeIcon icon={faClipboardList} className="text-amber-500 text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Enter Marks</h1>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {exam?.name ?? 'Exam'} · {csgLabel(exam?.class_section_group || exam?.classSectionGroup)}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleSubmit}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg"
                            >
                                <FontAwesomeIcon icon={faSave} /> Save All
                            </button>
                        </div>
                    </div>

                    {examSubjects.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                            No subjects in this exam. Add subjects on the exam page first.
                        </div>
                    ) : enrollments.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                            No students enrolled in this class section group.
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50/80">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[60px]">#</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[160px]">Student</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide min-w-[90px]">Roll No</th>
                                            {examSubjects.map((es) => (
                                                <th key={es.id} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                                                    <div>{es.subject?.name ?? '—'}</div>
                                                    <div className="text-gray-500 font-normal normal-case">(Total: {es.total_marks}, Pass: {es.passing_marks})</div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {enrollments.map((en, idx) => (
                                            <tr key={en.id} className="hover:bg-gray-50/80">
                                                <td className="px-4 py-2 text-sm text-gray-600">{idx + 1}</td>
                                                <td className="px-4 py-2 text-sm font-medium text-gray-900">{studentName(en)}</td>
                                                <td className="px-4 py-2 text-sm text-gray-600">{en.roll_number ?? '—'}</td>
                                                {examSubjects.map((es) => {
                                                    const cell = getCell(es.id, en.id);
                                                    return (
                                                        <td key={es.id} className="px-2 py-1 align-top">
                                                            <div className="flex flex-col gap-1">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    step="0.01"
                                                                    placeholder="Marks"
                                                                    className="w-20 border border-gray-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                                    value={cell.obtained_marks}
                                                                    onChange={(e) => setCell(es.id, en.id, 'obtained_marks', e.target.value === '' ? '' : e.target.value)}
                                                                />
                                                                <select
                                                                    className="w-full border border-gray-300 rounded px-2 py-1 text-xs focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                                                    value={cell.attendance_status}
                                                                    onChange={(e) => setCell(es.id, en.id, 'attendance_status', e.target.value)}
                                                                >
                                                                    {ATTENDANCE_OPTIONS.map((opt) => (
                                                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                                    ))}
                                                                </select>
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
