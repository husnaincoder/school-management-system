import React, { useState, useEffect } from 'react';
import {Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClipboardCheck } from '@fortawesome/free-solid-svg-icons';

const STATUS_OPTIONS = [
    { value: 'present', label: 'Present' },
    { value: 'absent', label: 'Absent' },
    { value: 'late', label: 'Late' },
    { value: 'leave', label: 'Leave' },
];

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function groupLabel(session) {
    const csg = session.class_section_group || session.classSectionGroup;
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

const DEFAULT_ROUTES = {
    index: 'attendance.sessions.index',
    markStore: 'attendance.sessions.mark.store',
    bulkMarkPresent: 'attendance.sessions.bulk-mark-present',
};

export default function MarkAttendance({ session, list = [], records = {}, routes: routesProp }) {
    const routes = { ...DEFAULT_ROUTES, ...routesProp };
    const isLocked = session?.is_locked === true;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { flash } = usePage().props;

    const initialAttendances = {};
    list.forEach((item) => {
        const key = item.id;
        const numKey = item.enrollment_id ?? item.teacher_id ?? item.employee_id;
        const rec = numKey != null ? records[numKey] : null;
        const raw = rec && typeof rec === 'object' ? rec : {};
        initialAttendances[key] = {
            status: raw.status ?? 'present',
            check_in: raw.check_in ?? '',
            check_out: raw.check_out ?? '',
            remarks: raw.remarks ?? '',
        };
    });

    const { data, setData, post, processing, errors } = useForm({
        attendances: initialAttendances,
    });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const updateAttendance = (key, field, value) => {
        setData('attendances', {
            ...data.attendances,
            [key]: {
                ...(data.attendances[key] || { status: 'present', check_in: '', check_out: '', remarks: '' }),
                [field]: value,
            },
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route(routes.markStore, session.id), { preserveScroll: true });
    };

    const typeLabel = session.type === 'student' ? 'Student' : session.type === 'teacher' ? 'Teacher' : 'Employee';

    return (
        <AuthenticatedLayout>
            <Head title="Mark Attendance" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Page Title - same as Materials / Remarks */}
                    <div className="mb-6">
                        <Link href={route(routes.index)} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to Sessions</Link>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClipboardCheck} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {typeLabel} · {session.academic_session?.name} · {formatDate(session.attendance_date)}
                                    {session.type === 'student' && ` · ${groupLabel(session)}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg border ${banner.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    {isLocked && (
                        <div className="mb-4 px-4 py-3 rounded-lg border bg-amber-50 text-amber-800 border-amber-200">
                            <span className="text-sm font-medium">This session is locked. You cannot edit attendance.</span>
                        </div>
                    )}

                    {list.length === 0 ? (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-8 text-center text-gray-500">
                            No {session.type}s to mark for this session.
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <h2 className="text-lg font-semibold text-gray-900">Attendance</h2>
                                <p className="text-sm text-gray-500 mt-0.5">{list.length} {session.type}{list.length !== 1 ? 's' : ''}</p>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                                {session.type === 'student' && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>}
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check In</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Check Out</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remarks</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {list.map((item, idx) => {
                                                const key = item.id;
                                                const att = data.attendances[key] || { status: 'present', check_in: '', check_out: '', remarks: '' };
                                                const inputClass = isLocked ? 'bg-gray-100 border-gray-200 cursor-not-allowed' : 'border-gray-300 focus:ring-2 focus:ring-amber-500 focus:border-amber-500';
                                                return (
                                                    <tr key={key} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 text-sm text-gray-600">{idx + 1}</td>
                                                        <td className="px-6 py-4 font-medium text-gray-900">{item.label}</td>
                                                        {session.type === 'student' && <td className="px-6 py-4 text-sm text-gray-600">{item.roll_number ?? '—'}</td>}
                                                        <td className="px-6 py-4">
                                                            <select
                                                                className={`border rounded-lg px-2 py-1.5 text-sm w-full max-w-[120px] ${inputClass}`}
                                                                value={att.status}
                                                                onChange={(e) => !isLocked && updateAttendance(key, 'status', e.target.value)}
                                                                disabled={isLocked}
                                                            >
                                                                {STATUS_OPTIONS.map((o) => (
                                                                    <option key={o.value} value={o.value}>{o.label}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input type="time" className={`border rounded-lg px-2 py-1.5 text-sm w-28 ${inputClass}`} value={att.check_in} onChange={(e) => !isLocked && updateAttendance(key, 'check_in', e.target.value)} disabled={isLocked} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input type="time" className={`border rounded-lg px-2 py-1.5 text-sm w-28 ${inputClass}`} value={att.check_out} onChange={(e) => !isLocked && updateAttendance(key, 'check_out', e.target.value)} disabled={isLocked} />
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <input type="text" className={`border rounded-lg px-2 py-1.5 text-sm w-full max-w-[180px] ${inputClass}`} placeholder="Remarks" value={att.remarks} onChange={(e) => !isLocked && updateAttendance(key, 'remarks', e.target.value)} disabled={isLocked} />
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                                    <div>
                                        {session.type === 'student' && !isLocked && (
                                            <button
                                                type="button"
                                                onClick={() => { if (window.confirm('Mark all students as Present?')) router.post(route(routes.bulkMarkPresent, session.id), {}, { preserveScroll: true }); }}
                                                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-medium"
                                            >
                                                Mark All Present
                                            </button>
                                        )}
                                    </div>
                                    <button type="submit" disabled={processing || isLocked} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">
                                        {processing ? 'Saving...' : 'Save Attendance'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
