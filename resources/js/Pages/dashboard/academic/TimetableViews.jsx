import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faPrint } from '@fortawesome/free-solid-svg-icons';

export default function TimetableViews({
    view = 'class',
    title = null,
    grid = null,
    timeSlots = [],
    days = [],
    timetables = [],
    teachers = [],
    rooms = [],
    filters = {},
}) {
    const [localView, setLocalView] = useState(view);
    const [timetableId, setTimetableId] = useState(filters.timetable_id ? String(filters.timetable_id) : '');
    const [teacherId, setTeacherId] = useState(filters.teacher_id ? String(filters.teacher_id) : '');
    const [roomId, setRoomId] = useState(filters.room_id ? String(filters.room_id) : '');

    const apply = (next = {}) => {
        const v = next.view ?? localView;
        const params = { view: v };
        if (v === 'class' && (next.timetable_id ?? timetableId)) params.timetable_id = next.timetable_id ?? timetableId;
        if (v === 'teacher' && (next.teacher_id ?? teacherId)) params.teacher_id = next.teacher_id ?? teacherId;
        if (v === 'room' && (next.room_id ?? roomId)) params.room_id = next.room_id ?? roomId;
        router.get(route('academic.timetable-views'), params, { preserveState: true });
    };

    const cells = grid?.cells || {};

    return (
        <AuthenticatedLayout>
            <Head title="Timetable Views" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Time Table Management', href: route('admin.timetable-management') },
                            { label: 'Views' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Timetable Views</h1>
                            <p className="text-sm text-gray-500">Class, teacher, and room weekly schedules</p>
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
                        <div className="flex rounded-lg border overflow-hidden">
                            {['class', 'teacher', 'room'].map((v) => (
                                <button
                                    key={v}
                                    type="button"
                                    onClick={() => { setLocalView(v); apply({ view: v }); }}
                                    className={`px-4 py-2 text-sm capitalize ${localView === v ? 'bg-amber-500 text-white' : 'bg-white text-gray-700'}`}
                                >
                                    {v}
                                </button>
                            ))}
                        </div>
                        {localView === 'class' && (
                            <select className="border rounded-lg px-3 py-2 text-sm min-w-[260px]" value={timetableId} onChange={(e) => { setTimetableId(e.target.value); apply({ view: 'class', timetable_id: e.target.value }); }}>
                                <option value="">Select timetable</option>
                                {timetables.map((t) => <option key={t.id} value={String(t.id)}>{t.label}</option>)}
                            </select>
                        )}
                        {localView === 'teacher' && (
                            <select className="border rounded-lg px-3 py-2 text-sm min-w-[220px]" value={teacherId} onChange={(e) => { setTeacherId(e.target.value); apply({ view: 'teacher', teacher_id: e.target.value }); }}>
                                <option value="">Select teacher</option>
                                {teachers.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                            </select>
                        )}
                        {localView === 'room' && (
                            <select className="border rounded-lg px-3 py-2 text-sm min-w-[220px]" value={roomId} onChange={(e) => { setRoomId(e.target.value); apply({ view: 'room', room_id: e.target.value }); }}>
                                <option value="">Select room</option>
                                {rooms.map((r) => <option key={r.id} value={String(r.id)}>{r.name}</option>)}
                            </select>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden print:border-0">
                        <div className="px-4 py-3 border-b">
                            <h2 className="font-semibold text-gray-900">{title || 'Select filters to view timetable'}</h2>
                        </div>
                        {!grid ? (
                            <div className="p-8 text-center text-gray-500">Choose a class, teacher, or room above.</div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left">Time</th>
                                            {days.map((d) => <th key={d} className="px-3 py-2 text-center capitalize">{d.slice(0, 3)}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {timeSlots.map((slot) => {
                                            const isBreak = slot.is_break || slot.slot_type === 'break' || slot.slot_type === 'lunch';
                                            return (
                                                <tr key={slot.id} className="border-t">
                                                    <td className={`px-3 py-2 whitespace-nowrap ${isBreak ? 'bg-amber-50' : ''}`}>
                                                        <div className="font-medium">{slot.name}</div>
                                                        <div className="text-xs text-gray-400">{slot.time_range_label}</div>
                                                    </td>
                                                    {days.map((day) => {
                                                        if (isBreak) {
                                                            return <td key={day} className="px-2 py-2 bg-amber-50 text-center text-xs italic text-amber-800">BREAK</td>;
                                                        }
                                                        const cell = cells[`${day}|${slot.id}`];
                                                        return (
                                                            <td key={day} className="px-2 py-2 border-l text-center align-top">
                                                                {cell ? (
                                                                    <div>
                                                                        <div className="font-semibold text-xs">{cell.subject || '—'}</div>
                                                                        {localView !== 'teacher' && <div className="text-[11px] text-gray-600">{cell.teacher}</div>}
                                                                        {localView !== 'class' && <div className="text-[11px] text-gray-600">{cell.class}</div>}
                                                                        {localView !== 'room' && <div className="text-[11px] text-gray-500">{cell.room}</div>}
                                                                    </div>
                                                                ) : <span className="text-gray-300">—</span>}
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
