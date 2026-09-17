import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

function entryKey(day, slotId) {
    return `${day}-${slotId}`;
}

export default function ClassInchargeTimetable({ classSection, timetable, timeSlots = [], days = [] }) {
    const entries = timetable?.timetable_enters ?? timetable?.timetableEnters ?? [];
    const map = {};
    entries.forEach((e) => { map[entryKey(e.day, e.time_slot_id)] = e; });

    return (
        <AuthenticatedLayout>
            <Head title="Class Timetable" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center gap-3">
                        <Link href={route('class-incharge.dashboard')} className="text-gray-500"><FontAwesomeIcon icon={faArrowLeft} /></Link>
                        <div>
                            <h1 className="text-2xl font-bold">Timetable — {classSection?.label}</h1>
                            <p className="text-sm text-gray-500">{classSection?.session} · Visibility only</p>
                        </div>
                    </div>
                    {!timetable ? (
                        <div className="bg-white rounded-xl border p-8 text-center text-gray-500">No timetable found for this class.</div>
                    ) : (
                        <div className="bg-white rounded-xl border overflow-x-auto">
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
                                                    if (isBreak) return <td key={day} className="px-2 py-2 bg-amber-50 text-center text-xs italic text-amber-800">BREAK</td>;
                                                    const e = map[entryKey(day, slot.id)];
                                                    const sub = e?.class_section_group_subject ?? e?.classSectionGroupSubject;
                                                    return (
                                                        <td key={day} className="px-2 py-2 border-l text-center align-top">
                                                            {e ? (
                                                                <div>
                                                                    <div className="font-semibold text-xs">{sub?.subject?.name}</div>
                                                                    <div className="text-[11px] text-gray-600">{e.teacher?.user?.name}</div>
                                                                    <div className="text-[11px] text-gray-400">{e.class_room?.name || e.classRoom?.name}</div>
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
        </AuthenticatedLayout>
    );
}
