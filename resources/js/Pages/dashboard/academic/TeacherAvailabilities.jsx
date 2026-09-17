import React, { useEffect, useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faArrowLeft, faSave } from '@fortawesome/free-solid-svg-icons';

/**
 * Weekly availability matrix. Missing cell = Available (default).
 * Click toggles Available ↔ Unavailable.
 */
export default function TeacherAvailabilitiesIndex(props) {
    const { props: pageProps, flash } = usePage();
    const teachers = props.teachers ?? pageProps.teachers ?? [];
    const timeSlots = props.timeSlots ?? pageProps.timeSlots ?? [];
    const days = props.days ?? pageProps.days ?? [];
    const filterTeacherId = props.filterTeacherId ?? pageProps.filterTeacherId ?? '';
    const serverMatrix = props.matrix ?? pageProps.matrix ?? {};

    const [teacherId, setTeacherId] = useState(filterTeacherId ? String(filterTeacherId) : (teachers[0] ? String(teachers[0].id) : ''));
    const [grid, setGrid] = useState({});
    const [processing, setProcessing] = useState(false);

    const teachingSlots = useMemo(
        () => timeSlots.filter((s) => !(s.is_break || s.slot_type === 'break' || s.slot_type === 'lunch')),
        [timeSlots]
    );

    useEffect(() => {
        const g = {};
        days.forEach((day) => {
            teachingSlots.forEach((slot) => {
                const raw = serverMatrix?.[day]?.[slot.id];
                // Default available when no row
                g[`${day}-${slot.id}`] = raw === undefined || raw === null ? true : !!raw;
            });
        });
        setGrid(g);
    }, [serverMatrix, days, teachingSlots, teacherId]);

    const loadTeacher = (id) => {
        setTeacherId(id);
        router.get(route('academic.teacher-availabilities.index'), { teacher_id: id || undefined }, { preserveState: true, replace: true });
    };

    const toggle = (day, slotId) => {
        const key = `${day}-${slotId}`;
        setGrid((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const markAll = (available) => {
        const g = {};
        days.forEach((day) => {
            teachingSlots.forEach((slot) => {
                g[`${day}-${slot.id}`] = available;
            });
        });
        setGrid(g);
    };

    const saveWeek = () => {
        if (!teacherId) return;
        const cells = [];
        days.forEach((day) => {
            teachingSlots.forEach((slot) => {
                cells.push({
                    day,
                    time_slot_id: slot.id,
                    is_available: !!grid[`${day}-${slot.id}`],
                });
            });
        });
        setProcessing(true);
        router.post(route('academic.teacher-availabilities.sync-week'), {
            teacher_id: Number(teacherId),
            cells,
        }, { onFinish: () => setProcessing(false) });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Teacher Availability" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Time Table Management', href: route('admin.timetable-management') },
                            { label: 'Teacher Availabilities' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChalkboardTeacher} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Teacher Availability</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Weekly grid used by the timetable builder (not for rooms)</p>
                            </div>
                        </div>
                        <Link href={route('admin.timetable-management')} className="inline-flex items-center gap-2 bg-gray-500 text-white px-4 py-2 rounded-lg text-sm">
                            <FontAwesomeIcon icon={faArrowLeft} /> Back
                        </Link>
                    </div>

                    {flash?.success && <div className="mb-4 rounded-lg bg-green-50 text-green-800 px-4 py-2 text-sm">{flash.success}</div>}

                    <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3 items-end">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                            <select className="min-w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm" value={teacherId} onChange={(e) => loadTeacher(e.target.value)}>
                                <option value="">Select teacher</option>
                                {teachers.map((t) => <option key={t.id} value={String(t.id)}>{t.name}</option>)}
                            </select>
                        </div>
                        <button type="button" onClick={() => markAll(true)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">All Available</button>
                        <button type="button" onClick={() => markAll(false)} className="px-3 py-2 text-sm rounded-lg border border-gray-300 hover:bg-gray-50">All Unavailable</button>
                        <button type="button" disabled={!teacherId || processing} onClick={saveWeek} className="inline-flex items-center gap-2 ml-auto bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">
                            <FontAwesomeIcon icon={faSave} /> Save Week
                        </button>
                    </div>

                    {!teacherId ? (
                        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">Select a teacher to configure weekly availability.</div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-4 py-3 border-b text-sm text-gray-500">
                                Click a cell to toggle. <span className="inline-block w-3 h-3 bg-green-200 rounded align-middle" /> Available · <span className="inline-block w-3 h-3 bg-red-200 rounded align-middle ml-2" /> Unavailable
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-3 py-2 text-left sticky left-0 bg-gray-50 z-10">Slot</th>
                                            {days.map((d) => (
                                                <th key={d} className="px-3 py-2 text-center capitalize min-w-[100px]">{d.slice(0, 3)}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {teachingSlots.map((slot) => (
                                            <tr key={slot.id} className="border-t">
                                                <td className="px-3 py-2 sticky left-0 bg-white z-10 whitespace-nowrap">
                                                    <div className="font-medium">{slot.name}</div>
                                                    <div className="text-xs text-gray-400">{slot.time_range_label || ''}</div>
                                                </td>
                                                {days.map((day) => {
                                                    const available = grid[`${day}-${slot.id}`] !== false;
                                                    return (
                                                        <td key={day} className="px-2 py-2 text-center">
                                                            <button
                                                                type="button"
                                                                onClick={() => toggle(day, slot.id)}
                                                                className={`w-full min-h-[40px] rounded-md text-xs font-medium transition ${available ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-red-100 text-red-800 hover:bg-red-200'}`}
                                                            >
                                                                {available ? 'Available' : 'Unavailable'}
                                                            </button>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                        {teachingSlots.length === 0 && (
                                            <tr><td colSpan={days.length + 1} className="px-4 py-8 text-center text-gray-500">Add teaching time slots first.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
