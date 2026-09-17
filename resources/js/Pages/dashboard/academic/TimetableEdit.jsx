import React, { useMemo, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faArrowLeft, faPrint, faFilePdf } from '@fortawesome/free-solid-svg-icons';

function entryKey(day, timeSlotId) {
    return `${day}-${timeSlotId}`;
}

function subjectColor(name) {
    if (!name) return 'bg-gray-50';
    const colors = ['bg-sky-50', 'bg-violet-50', 'bg-emerald-50', 'bg-rose-50', 'bg-amber-50', 'bg-cyan-50'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
}

export default function TimetableEdit({
    timetable,
    timeSlots = [],
    days = [],
    classSectionGroupSubjects = [],
    teachers = [],
    classRooms = [],
    subjectProgress = [],
    teacherWorkload = [],
    unavailableCells = [],
    statuses = [],
}) {
    const { errors, flash } = usePage().props;
    const entries = timetable.timetable_enters ?? timetable.timetableEnters ?? [];
    const entriesByKey = useMemo(() => {
        const m = {};
        entries.forEach((e) => { m[entryKey(e.day, e.time_slot_id)] = e; });
        return m;
    }, [entries]);

    const unavailableSet = useMemo(() => {
        const s = new Set();
        (unavailableCells || []).forEach((c) => s.add(`${c.teacher_id}|${c.day}|${c.time_slot_id}`));
        return s;
    }, [unavailableCells]);

    const [grid, setGrid] = useState(() => {
        const g = {};
        days.forEach((day) => {
            timeSlots.forEach((slot) => {
                const k = entryKey(day, slot.id);
                const e = entriesByKey[k];
                g[k] = {
                    id: e?.id,
                    day,
                    time_slot_id: slot.id,
                    class_section_group_subject_id: e?.class_section_group_subject_id ?? e?.classSectionGroupSubject?.id ?? '',
                    teacher_id: e?.teacher_id ?? e?.teacher?.id ?? '',
                    class_room_id: e?.class_room_id ?? e?.classRoom?.id ?? '',
                };
            });
        });
        return g;
    });

    const [modal, setModal] = useState(null);
    const [status, setStatus] = useState(timetable.status || (timetable.is_active ? 'published' : 'draft'));
    const [processing, setProcessing] = useState(false);

    const csLabel = useMemo(() => {
        const cs = timetable.class_section_group?.class_section ?? timetable.classSectionGroup?.classSection;
        const cls = cs?.class?.name ?? '';
        const sec = cs?.section?.name ?? '';
        return timetable.name || `${cls}${sec ? ` - ${sec}` : ''}`;
    }, [timetable]);

    const openCell = (day, slot) => {
        if (slot.is_break || slot.slot_type === 'break' || slot.slot_type === 'lunch') return;
        const k = entryKey(day, slot.id);
        setModal({ key: k, day, slot, ...grid[k] });
    };

    const teachersForSubject = (subjectId) => {
        const csgs = classSectionGroupSubjects.find((s) => String(s.id) === String(subjectId));
        if (csgs?.teacher_id) {
            const preferred = teachers.filter((t) => String(t.id) === String(csgs.teacher_id));
            const rest = teachers.filter((t) => String(t.id) !== String(csgs.teacher_id));
            return [...preferred, ...rest];
        }
        return teachers;
    };

    const saveModal = () => {
        if (!modal) return;
        const subject = classSectionGroupSubjects.find((s) => String(s.id) === String(modal.class_section_group_subject_id));
        let teacherId = modal.teacher_id;
        if (subject?.teacher_id && !teacherId) teacherId = String(subject.teacher_id);
        setGrid((prev) => ({
            ...prev,
            [modal.key]: {
                ...prev[modal.key],
                class_section_group_subject_id: modal.class_section_group_subject_id || '',
                teacher_id: teacherId || '',
                class_room_id: modal.class_room_id || '',
            },
        }));
        setModal(null);
    };

    const clearModal = () => {
        if (!modal) return;
        setGrid((prev) => ({
            ...prev,
            [modal.key]: { ...prev[modal.key], class_section_group_subject_id: '', teacher_id: '', class_room_id: '' },
        }));
        setModal(null);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (status === 'published' && !window.confirm('This timetable will be published. Continue?')) return;
        const entriesPayload = Object.values(grid).map((row) => ({
            id: row.id || null,
            day: row.day,
            time_slot_id: row.time_slot_id,
            class_section_group_subject_id: row.class_section_group_subject_id || null,
            teacher_id: row.teacher_id || null,
            class_room_id: row.class_room_id || null,
        }));
        setProcessing(true);
        router.put(route('academic.timetables.update', timetable.id), {
            name: timetable.name ?? '',
            status,
            is_active: status === 'published',
            entries: entriesPayload,
        }, { onFinish: () => setProcessing(false) });
    };

    const entryErrors = Array.isArray(errors?.entries) ? errors.entries : (errors?.entries ? [errors.entries] : []);

    return (
        <AuthenticatedLayout>
            <Head title="Timetable Builder" />
            <div className="py-8">
                <div className="max-w-[1400px] mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <Link href={route('academic.timetables.show', timetable.id)} className="text-gray-500 hover:text-gray-700">
                                <FontAwesomeIcon icon={faArrowLeft} />
                            </Link>
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarCheck} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Timetable Builder</h1>
                                <p className="text-sm text-gray-500">{csLabel} · {timetable.academic_session?.name || timetable.academicSession?.name}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <a href={route('academic.timetables.pdf', timetable.id)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm">
                                <FontAwesomeIcon icon={faFilePdf} /> PDF
                            </a>
                            <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border text-sm">
                                <FontAwesomeIcon icon={faPrint} /> Print
                            </button>
                        </div>
                    </div>

                    {flash?.success && <div className="mb-4 rounded-lg bg-green-50 text-green-800 px-4 py-2 text-sm">{flash.success}</div>}
                    {entryErrors.length > 0 && (
                        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm space-y-1">
                            <p className="font-semibold">Could not save — resolve conflicts:</p>
                            {entryErrors.map((err, i) => <p key={i}>• {err}</p>)}
                        </div>
                    )}

                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 mb-4">
                        <div className="xl:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <form onSubmit={handleSubmit}>
                                <div className="px-4 py-3 border-b flex flex-wrap items-center gap-3 justify-between">
                                    <p className="text-sm text-gray-500">Click a cell to assign subject, teacher, and room.</p>
                                    <div className="flex items-center gap-2">
                                        <label className="text-sm font-medium">Status</label>
                                        <select className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                                            {(statuses.length ? statuses : ['draft', 'published', 'archived']).map((s) => (
                                                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                                            ))}
                                        </select>
                                        <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm disabled:opacity-50">
                                            Save Timetable
                                        </button>
                                    </div>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-sm">
                                        <thead className="bg-gray-50 sticky top-0 z-10">
                                            <tr>
                                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50">Time</th>
                                                {days.map((d) => (
                                                    <th key={d} className="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase capitalize min-w-[140px]">{d.slice(0, 3)}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {timeSlots.map((slot) => {
                                                const isBreak = slot.is_break || slot.slot_type === 'break' || slot.slot_type === 'lunch';
                                                return (
                                                    <tr key={slot.id} className="border-t">
                                                        <td className={`px-3 py-2 sticky left-0 z-[5] whitespace-nowrap ${isBreak ? 'bg-amber-50' : 'bg-white'}`}>
                                                            <div className="font-semibold text-gray-800">{slot.name}</div>
                                                            <div className="text-xs text-gray-400">{slot.time_range_label || `${String(slot.start_time || '').slice(0, 5)}-${String(slot.end_time || '').slice(0, 5)}`}</div>
                                                        </td>
                                                        {days.map((day) => {
                                                            if (isBreak) {
                                                                return (
                                                                    <td key={day} className="px-2 py-2 bg-amber-50 text-center text-amber-800 text-xs italic border-l border-amber-100">
                                                                        {(slot.slot_type || 'break').toUpperCase()}
                                                                    </td>
                                                                );
                                                            }
                                                            const k = entryKey(day, slot.id);
                                                            const row = grid[k] || {};
                                                            const sub = classSectionGroupSubjects.find((s) => String(s.id) === String(row.class_section_group_subject_id));
                                                            const subName = sub?.subject?.name;
                                                            const teacher = teachers.find((t) => String(t.id) === String(row.teacher_id));
                                                            const room = classRooms.find((r) => String(r.id) === String(row.class_room_id));
                                                            const unavail = row.teacher_id && unavailableSet.has(`${row.teacher_id}|${day}|${slot.id}`);
                                                            return (
                                                                <td key={day} className="px-1.5 py-1.5 border-l border-gray-100 align-top">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => openCell(day, slot)}
                                                                        className={`w-full min-h-[72px] rounded-lg border text-left p-2 transition hover:border-amber-400 ${subName ? subjectColor(subName) : 'bg-white border-dashed border-gray-200'} ${unavail ? 'ring-2 ring-red-300' : ''}`}
                                                                    >
                                                                        {subName ? (
                                                                            <>
                                                                                <div className="font-semibold text-gray-900 text-xs leading-tight">{subName}</div>
                                                                                <div className="text-[11px] text-gray-600 mt-0.5">{teacher?.name || 'No teacher'}</div>
                                                                                <div className="text-[11px] text-gray-500">{room?.name || 'No room'}</div>
                                                                            </>
                                                                        ) : (
                                                                            <span className="text-xs text-gray-400">+ Assign</span>
                                                                        )}
                                                                    </button>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </form>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Subject periods</h3>
                                <div className="space-y-3">
                                    {(subjectProgress || []).length === 0 && <p className="text-sm text-gray-500">No subjects linked to this class group.</p>}
                                    {(subjectProgress || []).map((p) => {
                                        const pct = p.required > 0 ? Math.min(100, Math.round((p.assigned / p.required) * 100)) : 100;
                                        return (
                                            <div key={p.id}>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>{p.subject}</span>
                                                    <span className={p.complete ? 'text-green-600' : 'text-amber-600'}>{p.assigned}/{p.required || '—'}</span>
                                                </div>
                                                <div className="h-2 rounded bg-gray-100 overflow-hidden">
                                                    <div className={`h-full ${p.complete ? 'bg-green-500' : 'bg-amber-400'}`} style={{ width: `${pct}%` }} />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Teacher workload</h3>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {(teacherWorkload || []).length === 0 && <p className="text-sm text-gray-500">No teachers assigned yet.</p>}
                                    {(teacherWorkload || []).map((t) => (
                                        <div key={t.teacher_id} className="text-sm flex justify-between border-b border-gray-50 pb-1">
                                            <span className="truncate pr-2">{t.name}</span>
                                            <span className="font-medium">{t.total}/wk</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {modal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
                        <h2 className="text-lg font-semibold mb-1">Assign Period</h2>
                        <p className="text-sm text-gray-500 mb-4 capitalize">{modal.day} · {modal.slot?.name} · {modal.slot?.time_range_label}</p>
                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium mb-1">Subject</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={modal.class_section_group_subject_id || ''}
                                    onChange={(e) => {
                                        const sid = e.target.value;
                                        const csgs = classSectionGroupSubjects.find((s) => String(s.id) === String(sid));
                                        setModal((m) => ({
                                            ...m,
                                            class_section_group_subject_id: sid,
                                            teacher_id: csgs?.teacher_id ? String(csgs.teacher_id) : m.teacher_id,
                                        }));
                                    }}
                                >
                                    <option value="">— Clear —</option>
                                    {classSectionGroupSubjects.map((s) => (
                                        <option key={s.id} value={String(s.id)}>{s.subject?.name ?? s.id}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Teacher</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={modal.teacher_id || ''}
                                    onChange={(e) => setModal((m) => ({ ...m, teacher_id: e.target.value }))}
                                >
                                    <option value="">— Select —</option>
                                    {teachersForSubject(modal.class_section_group_subject_id).map((t) => {
                                        const bad = unavailableSet.has(`${t.id}|${modal.day}|${modal.slot.id}`);
                                        return <option key={t.id} value={String(t.id)}>{t.name}{bad ? ' (unavailable)' : ''}</option>;
                                    })}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Room</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    value={modal.class_room_id || ''}
                                    onChange={(e) => setModal((m) => ({ ...m, class_room_id: e.target.value }))}
                                >
                                    <option value="">— Select —</option>
                                    {classRooms.map((r) => (
                                        <option key={r.id} value={String(r.id)}>{r.name}{r.room_type ? ` (${r.room_type})` : ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="mt-5 flex justify-between gap-2">
                            <button type="button" onClick={clearModal} className="text-red-600 text-sm px-3 py-2">Clear cell</button>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setModal(null)} className="px-4 py-2 bg-gray-200 rounded-lg text-sm">Cancel</button>
                                <button type="button" onClick={saveModal} className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm">Save Assignment</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
