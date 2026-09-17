import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPrint } from '@fortawesome/free-solid-svg-icons';

export default function TimetableDaily({
    date,
    day,
    rows = [],
    timetables = [],
    filterTimetableId = '',
}) {
    const [localDate, setLocalDate] = useState(date);
    const [timetableId, setTimetableId] = useState(filterTimetableId ? String(filterTimetableId) : '');

    const apply = () => {
        const params = { date: localDate };
        if (timetableId) params.timetable_id = timetableId;
        router.get(route('academic.timetable-daily'), params, { preserveState: true });
    };

    const statusClass = {
        scheduled: 'bg-green-100 text-green-800',
        substituted: 'bg-amber-100 text-amber-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    return (
        <AuthenticatedLayout>
            <Head title="Daily Timetable" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Time Table Management', href: route('admin.timetable-management') },
                            { label: 'Daily Timetable' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Daily Timetable</h1>
                            <p className="text-sm text-gray-500 capitalize">{day} · {date} (includes substitutions)</p>
                        </div>
                        <div className="flex gap-2">
                            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 border px-3 py-2 rounded-lg text-sm">
                                <FontAwesomeIcon icon={faPrint} /> Print
                            </button>
                            <Link href={route('admin.timetable-management')} className="inline-flex items-center gap-2 bg-gray-500 text-white px-3 py-2 rounded-lg text-sm">
                                <FontAwesomeIcon icon={faArrowLeft} /> Back
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="block text-sm font-medium mb-1">Date</label>
                            <input type="date" className="border rounded-lg px-3 py-2 text-sm" value={localDate} onChange={(e) => setLocalDate(e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Class timetable (optional)</label>
                            <select className="border rounded-lg px-3 py-2 text-sm min-w-[220px]" value={timetableId} onChange={(e) => setTimetableId(e.target.value)}>
                                <option value="">All classes</option>
                                {timetables.map((t) => <option key={t.id} value={String(t.id)}>{t.label}</option>)}
                            </select>
                        </div>
                        <button type="button" onClick={apply} className="bg-amber-500 text-white px-4 py-2 rounded-lg text-sm">Apply</button>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="min-w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-3 text-left">Time</th>
                                    <th className="px-4 py-3 text-left">Class</th>
                                    <th className="px-4 py-3 text-left">Subject</th>
                                    <th className="px-4 py-3 text-left">Teacher</th>
                                    <th className="px-4 py-3 text-left">Room</th>
                                    <th className="px-4 py-3 text-left">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {rows.length === 0 ? (
                                    <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No classes scheduled for this day.</td></tr>
                                ) : rows.map((r, i) => (
                                    <tr key={i}>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="font-medium">{r.time_slot}</div>
                                            <div className="text-xs text-gray-400">{r.time_range}</div>
                                        </td>
                                        <td className="px-4 py-3">{r.class}</td>
                                        <td className="px-4 py-3">{r.subject}</td>
                                        <td className="px-4 py-3">{r.teacher || '—'}</td>
                                        <td className="px-4 py-3">{r.room || '—'}</td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-0.5 text-xs rounded capitalize ${statusClass[r.status] || 'bg-gray-100'}`}>{r.status}</span>
                                            {r.note && <div className="text-xs text-gray-400 mt-1">{r.note}</div>}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
