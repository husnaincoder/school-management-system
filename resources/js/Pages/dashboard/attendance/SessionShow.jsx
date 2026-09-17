import React from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarCheck, faLock, faUnlock, faPen, faClipboardCheck } from '@fortawesome/free-solid-svg-icons';

const TYPE_LABELS = { student: 'Student', teacher: 'Teacher', employee: 'Employee' };

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

function DetailRow({ label, children, icon }) {
    return (
        <div className="flex gap-3 p-4 rounded-lg bg-gray-50/80 border border-gray-100">
            {icon && (
                <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-amber-500">
                    <FontAwesomeIcon icon={icon} className="text-sm" />
                </div>
            )}
            <div className="min-w-0 flex-1">
                <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</dt>
                <dd className="mt-1 text-sm font-medium text-gray-900">{children}</dd>
            </div>
        </div>
    );
}

export default function SessionShow({ session }) {
    return (
        <AuthenticatedLayout>
            <Head title="Attendance Session Details" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <Link href={route('attendance.sessions.index')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to Sessions</Link>
                            </div>
                            {!session.is_locked && (
                                <div className="flex gap-2">
                                    <Link
                                        href={route('attendance.sessions.edit', session.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faPen} className="text-amber-600" />
                                        Edit
                                    </Link>
                                    <Link
                                        href={route('attendance.sessions.mark', session.id)}
                                        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-amber-500 hover:bg-amber-600 rounded-lg shadow-sm transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faClipboardCheck} />
                                        Mark Attendance
                                    </Link>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-3 mt-4">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarCheck} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Attendance Session</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    {TYPE_LABELS[session.type]} · {session.academic_session?.name} · {formatDate(session.attendance_date)}
                                    {session.type === 'student' && ` · ${groupLabel(session.class_section_group)}`}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Session Details</h2>
                        </div>
                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <DetailRow label="Date" icon={faCalendarCheck}>{formatDate(session.attendance_date)}</DetailRow>
                            <DetailRow label="Type">
                                <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                    {TYPE_LABELS[session.type]}
                                </span>
                            </DetailRow>
                            <DetailRow label="Academic Session">{session.academic_session?.name ?? '—'}</DetailRow>
                            {session.type === 'student' && (
                                <DetailRow label="Class Section Group">{groupLabel(session.class_section_group)}</DetailRow>
                            )}
                            <DetailRow
                                label="Status"
                                icon={session.is_locked ? faLock : faUnlock}
                            >
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${session.is_locked ? 'bg-gray-100 text-gray-700 border border-gray-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
                                    <FontAwesomeIcon icon={session.is_locked ? faLock : faUnlock} className="text-[10px]" />
                                    {session.is_locked ? 'Locked' : 'Open'}
                                </span>
                            </DetailRow>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
