import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardCheck,
    faChartLine,
    faPenToSquare,
    faBookOpen,
    faTableCells,
    faUsers,
} from '@fortawesome/free-solid-svg-icons';

export default function ClassInchargeDashboard({ classes = [], message = null }) {
    return (
        <AuthenticatedLayout>
            <Head title="Class Incharge Dashboard" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <h1 className="text-2xl font-bold text-gray-900">Class Incharge Dashboard</h1>
                        <p className="text-sm text-gray-500 mt-1">Only your actively assigned class section(s).</p>
                    </div>

                    {message && (
                        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">{message}</div>
                    )}

                    <div className="space-y-6">
                        {classes.map((cls) => (
                            <div key={cls.id} className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                                <div className="px-6 py-4 border-b bg-gray-50/80 flex flex-wrap justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-semibold text-gray-900">{cls.label}</h2>
                                        <p className="text-sm text-gray-500">{cls.session}</p>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Link href={route('teacher.students')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 text-white text-sm">
                                            <FontAwesomeIcon icon={faUsers} /> Students
                                        </Link>
                                        <Link href={route('teacher.attendance.sessions')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            <FontAwesomeIcon icon={faClipboardCheck} /> Attendance
                                        </Link>
                                        <Link href={route('attendance.reports.index')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            <FontAwesomeIcon icon={faChartLine} /> Reports
                                        </Link>
                                        <Link href={route('teacher.remarks.index')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            <FontAwesomeIcon icon={faPenToSquare} /> Remarks
                                        </Link>
                                        <Link href={route('class-incharge.notices.index')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            Announcements
                                        </Link>
                                        <Link href={route('class-incharge.activities.index')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            Activities
                                        </Link>
                                        <Link href={route('class-incharge.promotion-recommendations.index')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            Promotion
                                        </Link>
                                        <Link href={route('class-incharge.parents.index')} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            Parents
                                        </Link>
                                        <Link href={route('class-incharge.subjects', cls.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            <FontAwesomeIcon icon={faBookOpen} /> Subjects
                                        </Link>
                                        <Link href={route('class-incharge.timetable', cls.id)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm">
                                            <FontAwesomeIcon icon={faTableCells} /> Timetable
                                        </Link>
                                    </div>
                                </div>
                                <div className="p-6 grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                    <Stat label="Students" value={cls.total_students} />
                                    <Stat label="Present" value={cls.today_attendance?.present ?? 0} />
                                    <Stat label="Absent" value={cls.today_attendance?.absent ?? 0} />
                                    <Stat label="Late" value={cls.today_attendance?.late ?? 0} />
                                    <Stat label="Leave" value={cls.today_attendance?.leave ?? 0} />
                                </div>
                                <div className="px-6 pb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                                            <FontAwesomeIcon icon={faBookOpen} className="text-amber-500" /> Subjects & Teachers
                                        </h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50"><tr>
                                                    <th className="px-3 py-2 text-left">Subject</th>
                                                    <th className="px-3 py-2 text-left">Teacher</th>
                                                    <th className="px-3 py-2 text-left">Group</th>
                                                </tr></thead>
                                                <tbody>
                                                    {(cls.subjects || []).length === 0 ? (
                                                        <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400">No subjects linked.</td></tr>
                                                    ) : cls.subjects.map((s, i) => (
                                                        <tr key={i} className="border-t">
                                                            <td className="px-3 py-2">{s.subject}</td>
                                                            <td className="px-3 py-2">{s.teacher || '—'}</td>
                                                            <td className="px-3 py-2 text-gray-500">{s.group || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800 mb-2">Today&apos;s Timetable</h3>
                                        <div className="border rounded-lg overflow-hidden">
                                            <table className="min-w-full text-sm">
                                                <thead className="bg-gray-50"><tr>
                                                    <th className="px-3 py-2 text-left">Slot</th>
                                                    <th className="px-3 py-2 text-left">Subject</th>
                                                    <th className="px-3 py-2 text-left">Teacher</th>
                                                </tr></thead>
                                                <tbody>
                                                    {(cls.today_timetable || []).length === 0 ? (
                                                        <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400">No periods today / no published timetable.</td></tr>
                                                    ) : cls.today_timetable.map((p, i) => (
                                                        <tr key={i} className="border-t">
                                                            <td className="px-3 py-2">{p.slot}</td>
                                                            <td className="px-3 py-2">{p.subject}</td>
                                                            <td className="px-3 py-2">{p.teacher || '—'}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function Stat({ label, value }) {
    return (
        <div className="rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
            <p className="text-xs text-gray-500">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
        </div>
    );
}
