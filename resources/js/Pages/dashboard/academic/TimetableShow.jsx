import React from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faArrowLeft, faPen } from '@fortawesome/free-solid-svg-icons';

function entryKey(day, timeSlotId) {
    return `${day}-${timeSlotId}`;
}

export default function TimetableShow({ timetable, timeSlots = [], days = [] }) {
    const entriesByKey = {};
    (timetable.timetable_enters ?? timetable.timetableEnters ?? []).forEach((e) => {
        entriesByKey[entryKey(e.day, e.time_slot_id)] = e;
    });

    const csg = timetable.class_section_group ?? timetable.classSectionGroup;
    const cs = csg?.class_section ?? csg?.classSection;
    const label = [cs?.class?.name, cs?.section?.name].filter(Boolean).join(' - ') + (csg?.subject_group?.name ? ` (${csg.subject_group.name})` : '');

    return (
        <AuthenticatedLayout>
            <Head title="Time Table Details" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Link href={route('academic.timetables.index')} className="text-gray-500 hover:text-gray-700">
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </Link>
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarCheck} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">{timetable.name || label}</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Timetable view</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <a href={route('academic.timetables.pdf', timetable.id)} className="px-4 py-2 border rounded-lg text-sm">PDF</a>
                            <button type="button" onClick={() => window.print()} className="px-4 py-2 border rounded-lg text-sm">Print</button>
                            <Link href={route('academic.timetables.edit', timetable.id)} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center gap-2">
                                <FontAwesomeIcon icon={faPen} className="text-sm" /> Builder
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-24">Time</th>
                                        {days.map((d) => (
                                            <th key={d} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase capitalize">{d}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {timeSlots.map((slot) => {
                                        const isBreak = slot.is_break || slot.slot_type === 'break' || slot.slot_type === 'lunch';
                                        return (
                                        <tr key={slot.id} className={isBreak ? 'bg-amber-50' : ''}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-700 whitespace-nowrap">
                                                <div>{slot.name}</div>
                                                <div className="text-xs text-gray-400">{slot.time_range_label || `${(slot.start_time || '').toString().slice(0, 5)} - ${(slot.end_time || '').toString().slice(0, 5)}`}</div>
                                            </td>
                                            {days.map((day) => {
                                                if (isBreak) {
                                                    return <td key={day} className="px-4 py-3 text-center text-xs italic text-amber-800 border-l border-amber-100">{(slot.slot_type || 'break').toUpperCase()}</td>;
                                                }
                                                const e = entriesByKey[entryKey(day, slot.id)];
                                                const sub = e?.class_section_group_subject ?? e?.classSectionGroupSubject;
                                                const subjectName = sub?.subject?.name ?? '—';
                                                const teacherName = e?.teacher?.user?.name ?? '—';
                                                const roomName = e?.class_room?.name ?? e?.classRoom?.name ?? '';
                                                return (
                                                    <td key={day} className="px-4 py-3 text-sm text-gray-900 border-l border-gray-100">
                                                        {e ? (
                                                            <div>
                                                                <div className="font-medium">{subjectName}</div>
                                                                <div className="text-gray-500">{teacherName}</div>
                                                                {roomName && <div className="text-gray-400 text-xs">{roomName}</div>}
                                                            </div>
                                                        ) : (
                                                            '—'
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
