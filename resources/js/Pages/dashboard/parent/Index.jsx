import React from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ParentDashboard({ parent, children }) {
    return (
        <AuthenticatedLayout>
            <Head title="Parent Dashboard" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Welcome, {parent?.user?.name}</h1>

                    {/* My Children */}
                    <div className="space-y-8">
                        {children.map((child) => {
                            const en = child.enrollment;
                            const group = en?.class_section_group ?? en?.classSectionGroup;
                            const cs = group?.class_section ?? group?.classSection;
                            const className = cs?.class?.name ?? '—';
                            const sectionName = cs?.section?.name ?? '—';
                            const sessionName = cs?.academic_session?.name ?? cs?.academicSession?.name ?? '—';
                            const subjects = group?.class_section_group_subjects ?? group?.classSectionGroupSubjects ?? [];
                            const incharges = (group?.class_incharges ?? group?.classIncharges ?? []).filter((ci) => ci.is_active);

                            return (
                                <div key={child.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                    <div className="p-6 border-b border-gray-200">
                                        <div className="flex flex-wrap items-center justify-between gap-4">
                                            <div>
                                                <h2 className="text-lg font-semibold text-gray-900">{child.user?.name}</h2>
                                                <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
                                                    <span>Session: {sessionName}</span>
                                                    <span>Class: {className}</span>
                                                    <span>Section: {sectionName}</span>
                                                    <span>Roll: {en?.roll_number ?? '—'}</span>
                                                    <span>Admission: {formatDate(en?.admission_date)}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                <Link href={route('parent.child.attendance', child.id)} className="text-blue-600 hover:text-blue-800 font-medium text-sm">Attendance</Link>
                                                <Link href={route('parent.child.marks', child.id)} className="text-green-600 hover:text-green-800 font-medium text-sm">Marks</Link>
                                                <Link href={route('parent.child.fees', child.id)} className="text-purple-600 hover:text-purple-800 font-medium text-sm">Fees</Link>
                                                <Link href={route('parent.leave-applications.index')} className="text-amber-600 hover:text-amber-800 font-medium text-sm">Leave</Link>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Class Incharge */}
                                    {incharges.length > 0 && (
                                        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                                            <h3 className="text-sm font-medium text-gray-700 mb-2">Class Incharge</h3>
                                            <div className="flex flex-wrap gap-4">
                                                {incharges.map((ci) => (
                                                    <div key={ci.id} className="text-sm">
                                                        <span className="font-medium text-gray-900">{ci.teacher?.user?.name ?? '—'}</span>
                                                        <span className="text-gray-500"> · {ci.teacher?.designation ?? '—'}</span>
                                                        <span className="text-gray-500"> · {ci.teacher?.department ?? '—'}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Subjects & Teachers */}
                                    {subjects.length > 0 && (
                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200">
                                                <thead>
                                                    <tr className="bg-gray-50">
                                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                                                        <th className="px-6 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200">
                                                    {subjects.map((row) => (
                                                        <tr key={row.id}>
                                                            <td className="px-6 py-2 text-sm text-gray-900">{row.subject?.name ?? '—'}</td>
                                                            <td className="px-6 py-2 text-sm text-gray-900">{row.teacher?.user?.name ?? '—'}</td>
                                                            <td className="px-6 py-2 text-sm text-gray-500">{row.teacher?.designation ?? '—'}</td>
                                                            <td className="px-6 py-2 text-sm text-gray-500">{row.teacher?.department ?? '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
