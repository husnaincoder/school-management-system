import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentDashboard({ student, currentAcademicSession, profilePending, userName, attendanceStats, marks, feeStats }) {
    const { auth } = usePage().props;
    const displayName = student?.user?.name ?? userName ?? auth?.user?.name ?? 'Student';

    if (profilePending) {
        return (
            <AuthenticatedLayout>
           
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <h1 className="text-2xl font-semibold mb-6">Welcome, {displayName}</h1>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
                            <p className="font-medium">Your student profile is not set up yet.</p>
                            <p className="mt-2 text-sm">Please contact the school admin to link your account with a student record. Once that is done, you will see your dashboard here.</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
             <Head title="Students" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Welcome, {displayName}</h1>
                    
                    {/* Student Info - backend sends relation keys as snake_case (class_section_group, class_section) */}
                    {(() => {
                        const en = student?.enrollment;
                        const group = en?.class_section_group ?? en?.classSectionGroup;
                        const cs = group?.class_section ?? group?.classSection;
                        const className = cs?.class?.name ?? '—';
                        const sectionName = cs?.section?.name ?? '—';
                        const sessionName = currentAcademicSession?.name ?? cs?.academic_session?.name ?? cs?.academicSession?.name ?? '—';
                        return (
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                                    <div>
                                        <div className="text-gray-500 text-sm">Academic Session</div>
                                        <div className="font-semibold">{sessionName}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-sm">Class</div>
                                        <div className="font-semibold">{className}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-sm">Section</div>
                                        <div className="font-semibold">{sectionName}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-sm">Roll Number</div>
                                        <div className="font-semibold">{en?.roll_number ?? '—'}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-sm">Admission Date</div>
                                        <div className="font-semibold">{formatDate(en?.admission_date)}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Subjects & Teachers */}
                    {((student?.enrollment?.classSectionGroup ?? student?.enrollment?.class_section_group)?.classSectionGroupSubjects ?? (student?.enrollment?.classSectionGroup ?? student?.enrollment?.class_section_group)?.class_section_group_subjects)?.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Subjects & Teachers</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead>
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Teacher</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {(student.enrollment.classSectionGroup?.classSectionGroupSubjects ?? student.enrollment.classSectionGroup?.class_section_group_subjects ?? student.enrollment.class_section_group?.classSectionGroupSubjects ?? student.enrollment.class_section_group?.class_section_group_subjects ?? []).map((csgs) => (
                                            <tr key={csgs.id}>
                                                <td className="px-4 py-2 text-sm text-gray-900">{csgs.subject?.name ?? '—'}</td>
                                                <td className="px-4 py-2 text-sm text-gray-900">{csgs.teacher?.user?.name ?? '—'}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{csgs.teacher?.designation ?? '—'}</td>
                                                <td className="px-4 py-2 text-sm text-gray-500">{csgs.teacher?.department ?? '—'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Class Incharge */}
                    {((student?.enrollment?.classSectionGroup ?? student?.enrollment?.class_section_group)?.classIncharges ?? (student?.enrollment?.classSectionGroup ?? student?.enrollment?.class_section_group)?.class_incharges)?.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Class Incharge</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {((student.enrollment.classSectionGroup ?? student.enrollment.class_section_group)?.classIncharges ?? (student.enrollment.classSectionGroup ?? student.enrollment.class_section_group)?.class_incharges ?? [])
                                    .filter((ci) => ci.is_active)
                                    .map((ci) => (
                                        <div key={ci.id} className="border border-gray-200 rounded-lg p-4">
                                            <div className="font-medium text-gray-900">{ci.teacher?.user?.name ?? '—'}</div>
                                            <div className="text-sm text-gray-500">{ci.teacher?.designation ?? '—'}</div>
                                            <div className="text-sm text-gray-500">{ci.teacher?.department ?? '—'}</div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-green-500">
                            <div className="text-gray-500 text-sm">Attendance</div>
                            <div className="text-2xl font-bold">{attendanceStats?.percentage}%</div>
                            <div className="text-sm text-gray-500">Present: {attendanceStats?.present} | Absent: {attendanceStats?.absent} | Late: {attendanceStats?.late ?? 0} | Leave: {attendanceStats?.leave ?? 0}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-blue-500">
                            <div className="text-gray-500 text-sm">Total Fee</div>
                            <div className="text-2xl font-bold">${feeStats?.totalFee}</div>
                            <div className="text-sm text-gray-500">Paid: ${feeStats?.totalPaid}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-yellow-500">
                            <div className="text-gray-500 text-sm">Pending Fee</div>
                            <div className="text-2xl font-bold text-yellow-600">${feeStats?.pending}</div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Link href={route('student.attendance')} className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            View Attendance
                        </Link>
                        <Link href={route('student.marks')} className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            View Marks
                        </Link>
                        <Link href={route('student.fees')} className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            View Fees
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
