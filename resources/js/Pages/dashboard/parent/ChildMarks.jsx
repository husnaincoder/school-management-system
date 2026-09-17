import React from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHashtag, faArrowLeft, faClipboardList, faTrophy, faFileCsv, faFilePdf } from '@fortawesome/free-solid-svg-icons';

function examLabel(exam) {
    if (!exam) return '—';
    const type = exam.exam_type?.name ?? exam.examType?.name ?? '';
    const session = exam.academic_session?.name ?? exam.academicSession?.name ?? '';
    const csg = exam.class_section_group ?? exam.classSectionGroup;
    const cls = csg?.class_section?.class?.name ?? csg?.classSection?.class?.name ?? '';
    const sec = csg?.class_section?.section?.name ?? csg?.classSection?.section?.name ?? '';
    return [exam.name, type, session, cls, sec].filter(Boolean).join(' · ') || '—';
}

export default function ChildMarks({ student, examResults = [], subjectRecordsByExam = {} }) {
    const results = Array.isArray(examResults) ? examResults : [];
    const byExam = typeof subjectRecordsByExam === 'object' ? subjectRecordsByExam : {};
    const childName = student?.user?.name ?? [student?.first_name, student?.last_name].filter(Boolean).join(' ') ?? 'Child';

    return (
        <AuthenticatedLayout>
             <Head title="Results & Marks - {childName}" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-4">
                        <Link href={route('dashboard.parent')} className="text-gray-500 hover:text-gray-700">
                            <FontAwesomeIcon icon={faArrowLeft} />
                        </Link>
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faHashtag} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Results & Marks — {childName}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Exam results and subject-wise marks</p>
                            </div>
                        </div>
                    </div>

                    {results.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
                            <FontAwesomeIcon icon={faClipboardList} className="text-4xl text-gray-300 mb-3" />
                            <p>No exam results yet for this student. Results will appear here once published.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {results.map((r) => {
                                const exam = r.exam || {};
                                const subjectRecords = byExam[exam.id] || [];
                                return (
                                    <div key={r.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faTrophy} className="text-amber-500" />
                                            <h2 className="font-semibold text-gray-800">{exam.name ?? 'Exam'}</h2>
                                            <span className="text-sm text-gray-500">— {examLabel(exam)}</span>
                                        </div>
                                        <div className="p-6">
                                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Total / Obtained</p>
                                                    <p className="font-medium text-gray-900">{r.total_marks} / {r.obtained_marks}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Percentage</p>
                                                    <p className="font-medium text-gray-900">{r.percentage}%</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Grade</p>
                                                    <p className="font-medium text-gray-900">{r.grade ?? '—'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500 uppercase">Status</p>
                                                    <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${r.is_passed ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                                                        {r.is_passed ? 'Pass' : 'Fail'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                <a href={route('parent.child.exam-result-sheet', { student: student.id, exam: exam.id })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200" download>
                                                    <FontAwesomeIcon icon={faFileCsv} /> Result Sheet (CSV)
                                                </a>
                                                <a href={route('parent.child.exam-merit-list', { student: student.id, exam: exam.id })} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200" download>
                                                    <FontAwesomeIcon icon={faFilePdf} /> Merit List (PDF)
                                                </a>
                                            </div>
                                            {subjectRecords.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-gray-600 mb-2">Subject-wise</p>
                                                    <table className="min-w-full divide-y divide-gray-200">
                                                        <thead className="bg-gray-50/80">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Subject</th>
                                                                <th className="px-4 py-2 text-right text-xs font-semibold text-gray-600">Marks</th>
                                                                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Attendance</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {subjectRecords.map((sr, idx) => (
                                                                <tr key={idx}>
                                                                    <td className="px-4 py-2 text-sm text-gray-900">{sr.subject_name}</td>
                                                                    <td className="px-4 py-2 text-sm text-right text-gray-700">{sr.obtained_marks ?? '—'}</td>
                                                                    <td className="px-4 py-2 text-sm capitalize text-gray-600">{sr.attendance_status ?? '—'}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
