import React, { useState } from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate } from '@fortawesome/free-solid-svg-icons';

export default function MyStudents({ assignedClasses = [], academicSession }) {
    const [expandedClassId, setExpandedClassId] = useState(assignedClasses[0]?.id ?? null);

    return (
        <AuthenticatedLayout>
            <Head title="My Students" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Page Title - same as Materials / Remarks */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGraduate} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">My Students (Class Incharge)</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {academicSession ? `Session: ${academicSession.name}` : 'No current academic session.'}
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('teacher.attendance')}
                            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm"
                        >
                            Take Attendance
                        </Link>
                    </div>

                    {assignedClasses.length === 0 ? (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center text-amber-800">
                            <p className="font-medium">No class assigned.</p>
                            <p className="text-sm mt-1">You are not set as class incharge for any class. Contact admin to get assigned.</p>
                        </div>
                    ) : (
                        <>
                            {/* Assigned Class Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
                                {assignedClasses.map((cls) => (
                                    <div
                                        key={cls.id}
                                        className={`bg-white rounded-xl border-2 overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.08)] cursor-pointer transition-colors ${expandedClassId === cls.id ? 'border-amber-500 ring-2 ring-amber-200' : 'border-gray-200 hover:border-amber-300'}`}
                                        onClick={() => setExpandedClassId(expandedClassId === cls.id ? null : cls.id)}
                                    >
                                        <div className="p-4">
                                            <div className="font-semibold text-gray-900">{cls.class_label}</div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Class: {cls.class_name} · Section: {cls.section_name}
                                            </div>
                                            <div className="mt-2 text-amber-600 font-medium">Total students: {cls.total_students}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Class details: Assigned subjects & Subject teachers (for selected class) */}
                            {expandedClassId && (() => {
                                const cls = assignedClasses.find((c) => c.id === expandedClassId);
                                if (!cls) return null;
                                const hasSubjects = (cls.assigned_subjects?.length ?? 0) > 0;
                                const hasTeachers = (cls.subject_teachers?.length ?? 0) > 0;
                                if (!hasSubjects && !hasTeachers) return null;
                                return (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                        {hasSubjects && (
                                            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
                                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Assigned subjects</h3>
                                                <ul className="space-y-1">
                                                    {cls.assigned_subjects.map((s) => (
                                                        <li key={s.subject_id} className="text-sm text-gray-600 flex justify-between">
                                                            <span>{s.name}</span>
                                                            {s.weekly_classes != null && <span className="text-gray-400">{s.weekly_classes} classes/wk</span>}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {hasTeachers && (
                                            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4">
                                                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">Subject teachers</h3>
                                                <ul className="space-y-1">
                                                    {cls.subject_teachers.map((t, i) => (
                                                        <li key={i} className="text-sm text-gray-600">
                                                            <span className="font-medium text-gray-700">{t.subject}</span>
                                                            <span className="mx-1">–</span>
                                                            <span>{t.teacher_name}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Student list for selected class */}
                            {expandedClassId && (
                                <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                        <h2 className="text-lg font-semibold text-gray-900">
                                            {assignedClasses.find((c) => c.id === expandedClassId)?.class_label} – Student List
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-0.5">
                                            {assignedClasses.find((c) => c.id === expandedClassId)?.students?.length ?? 0} student(s)
                                        </p>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission No</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father / Mother</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attendance</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {assignedClasses
                                                    .find((c) => c.id === expandedClassId)
                                                    ?.students?.map((stu, idx) => (
                                                        <tr key={stu.enrollment_id} className="hover:bg-gray-50">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{idx + 1}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stu.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{stu.roll_number}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{stu.admission_number}</td>
                                                            <td className="px-6 py-4 text-sm text-gray-600">{stu.father_mother_name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{stu.contact}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap">
                                                                {stu.attendance_percentage !== null ? (
                                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${stu.attendance_percentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                                                                        {stu.attendance_percentage}%
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 text-sm">—</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    )) ?? null}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
