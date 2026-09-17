import React from 'react';
import {Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function groupLabel(csg) {
    if (!csg) return '-';
    const cs = csg.class_section || csg.classSection;
    return [cs?.class?.name, cs?.section?.name, csg.subject_group?.name ?? csg.subjectGroup?.name].filter(Boolean).join(' ') || '-';
}

function formatDate(value) {
    if (!value) return '-';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentAttendance({ enrollment, dailyRecords, monthly, yearly, percentage, academicSessions = [], filters = {} }) {
    const applyFilters = (e) => {
        e?.preventDefault();
        const form = e.target;
        router.get(route('student.attendance'), {
            academic_session_id: form.academic_session_id?.value,
            date_from: form.date_from?.value,
            date_to: form.date_to?.value,
            year: form.year?.value,
            month: form.month?.value,
        }, { preserveState: true });
    };

    if (!enrollment) {
        return (
            <AuthenticatedLayout>
                <div className="py-8 max-w-4xl mx-auto px-4">
                    <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
                    <p className="text-gray-500 mt-2">No enrollment found.</p>
                    <Link href={route('dashboard.student')} className="text-sky-600 hover:text-sky-800 text-sm font-medium mt-4 inline-block">Back to Dashboard</Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    const items = dailyRecords?.data ?? dailyRecords ?? [];

    return (
        <AuthenticatedLayout>
            <Head title="My Attendance" />
            <div className="py-8 max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <Link href={route('dashboard.student')} className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-6 inline-block">Back to Dashboard</Link>
                <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
                <p className="text-sm text-gray-500 mt-0.5">{groupLabel(enrollment.class_section_group)} - Roll: {enrollment.roll_number}</p>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="text-gray-500 text-xs">Overall %</div>
                        <div className={`text-2xl font-bold ${percentage < 75 ? 'text-red-600' : 'text-sky-600'}`}>{percentage}%</div>
                    </div>
                    {yearly && (
                        <>
                            <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-gray-500 text-xs">Present</div><div className="text-xl font-bold text-green-600">{yearly.present}</div></div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-gray-500 text-xs">Absent</div><div className="text-xl font-bold text-red-600">{yearly.absent}</div></div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-gray-500 text-xs">Late</div><div className="text-xl font-bold text-amber-600">{yearly.late}</div></div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-gray-500 text-xs">Leave</div><div className="text-xl font-bold text-gray-600">{yearly.leave}</div></div>
                        </>
                    )}
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">Filters</h2>
                    <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                        <div className="min-w-[180px]">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Academic Session</label>
                            <select name="academic_session_id" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" defaultValue={filters.academic_session_id ?? ''}>
                                <option value="">All</option>
                                {academicSessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                            </select>
                        </div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">From</label><input type="date" name="date_from" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" defaultValue={filters.date_from} /></div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">To</label><input type="date" name="date_to" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" defaultValue={filters.date_to} /></div>
                        <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg">Apply</button>
                    </form>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Check In</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Check Out</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No records.</td></tr>
                            ) : items.map((att) => (
                                <tr key={att.id}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(att.attendance_session?.attendance_date)}</td>
                                    <td className="px-6 py-4"><span className="inline-flex px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100">{att.status}</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{att.check_in ?? '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{att.check_out ?? '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{att.remarks ?? '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {dailyRecords?.links && dailyRecords.links.length > 1 && (
                        <div className="px-6 py-4 border-t flex justify-end gap-1">
                            {dailyRecords.links.map((link, i) => (
                                <button key={i} type="button" onClick={() => link.url && router.get(link.url)} disabled={!link.url} className="min-w-[2.25rem] px-2 py-1.5 rounded text-sm font-medium bg-gray-200 hover:bg-gray-300 disabled:opacity-50" dangerouslySetInnerHTML={{ __html: link.label }} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
