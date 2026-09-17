import React, { useState, useEffect } from 'react';
import {Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faFilter, faCog, faChartLine, faSnowflake, faPenToSquare, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

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

const DEFAULT_INDEX_ROUTE = 'attendance.sessions.index';

export default function AttendanceSessionsIndex({ sessions, academicSessions = [], classSectionGroups = [], filters = {}, forTeacher = false, routes: routesProp }) {
    const indexRoute = routesProp?.index ?? DEFAULT_INDEX_ROUTE;
    const markRoute = routesProp?.mark ?? 'attendance.sessions.mark';
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [filterState, setFilterState] = useState({
        type: filters.type ?? '',
        academic_session_id: filters.academic_session_id ?? '',
        class_section_group_id: filters.class_section_group_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
    });
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const applyFilters = (e) => {
        e?.preventDefault();
        const params = {};
        if (filterState.type) params.type = filterState.type;
        if (filterState.academic_session_id) params.academic_session_id = filterState.academic_session_id;
        if (filterState.class_section_group_id) params.class_section_group_id = filterState.class_section_group_id;
        if (filterState.date_from) params.date_from = filterState.date_from;
        if (filterState.date_to) params.date_to = filterState.date_to;
        router.get(route(indexRoute), params, { preserveState: true });
    };

    const data = sessions?.data ?? sessions ?? [];
    const pagination = sessions?.links ? { ...sessions, data: undefined } : null;

    return (
        <AuthenticatedLayout>
            <Head title="Attendance Sessions" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={forTeacher ? [
                            { label: 'Dashboard', href: route('dashboard.teacher') },
                            { label: 'Attendance Sessions' },
                        ] : [
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Attendance Management', href: route('admin.attendance-management') },
                            { label: 'Sessions' },
                        ]}
                    />

                    <div className="mb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                    <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500 text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Attendance Sessions</h1>
                                    <p className="text-sm text-gray-500 mt-0.5">Student, Teacher & Employee attendance by session</p>
                                </div>
                            </div>
                            {!forTeacher && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link
                                        href={route('admin.attendance-management')}
                                        className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                        Back
                                    </Link>
                                    <Link href={route('attendance.settings.index')} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                        <FontAwesomeIcon icon={faCog} className="text-gray-500" /> Settings
                                    </Link>
                                    <Link href={route('attendance.reports.index')} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                        <FontAwesomeIcon icon={faChartLine} /> Reports
                                    </Link>
                                    <Link href={route('attendance.freeze.index')} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                        <FontAwesomeIcon icon={faSnowflake} /> Freeze
                                    </Link>
                                    <Link href={route('attendance.correction-requests.index')} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                        <FontAwesomeIcon icon={faPenToSquare} /> Corrections
                                    </Link>
                                    <Link href={route('attendance.sessions.create')} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold py-2.5 px-4 rounded-lg shadow-sm transition-colors">
                                        <FontAwesomeIcon icon={faCalendarDays} /> New Session
                                    </Link>
                                </div>
                            )}
                            {forTeacher && (
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Link
                                        href={route('dashboard.teacher')}
                                        className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                                    >
                                        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                        Back
                                    </Link>
                                    <Link href={route('attendance.reports.index')} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                                        <FontAwesomeIcon icon={faChartLine} /> Reports
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>

                    {banner.message && (
                        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${banner.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500" /> Filters
                        </h2>
                        <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                            <div className="min-w-[140px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Type</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterState.type}
                                    onChange={(e) => setFilterState((p) => ({ ...p, type: e.target.value }))}
                                >
                                    <option value="">All</option>
                                    <option value="student">Student</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="employee">Employee</option>
                                </select>
                            </div>
                            <div className="min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Academic Session</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterState.academic_session_id}
                                    onChange={(e) => setFilterState((p) => ({ ...p, academic_session_id: e.target.value }))}
                                >
                                    <option value="">All</option>
                                    {academicSessions.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="min-w-[200px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Class Section Group</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterState.class_section_group_id}
                                    onChange={(e) => setFilterState((p) => ({ ...p, class_section_group_id: e.target.value }))}
                                >
                                    <option value="">All</option>
                                    {classSectionGroups.map((csg) => (
                                        <option key={csg.id} value={csg.id}>{groupLabel(csg)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Date from</label>
                                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500" value={filterState.date_from} onChange={(e) => setFilterState((p) => ({ ...p, date_from: e.target.value }))} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Date to</label>
                                <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500" value={filterState.date_to} onChange={(e) => setFilterState((p) => ({ ...p, date_to: e.target.value }))} />
                            </div>
                            <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">Apply</button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Academic Session</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Group</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Locked</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No attendance sessions. Create one to start marking.</td>
                                        </tr>
                                    ) : data.map((s) => (
                                        <tr key={s.id} className="hover:bg-gray-50/80 transition-colors">
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">{formatDate(s.attendance_date)}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{s.academic_session?.name ?? '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">{TYPE_LABELS[s.type] ?? s.type}</span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{s.type === 'student' ? groupLabel(s.class_section_group) : '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-0.5 rounded-md text-xs font-medium ${s.is_locked ? 'bg-gray-100 text-gray-700' : 'bg-green-50 text-green-700'}`}>{s.is_locked ? 'Yes' : 'No'}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    {!forTeacher && (
                                                        <>
                                                            <Link href={route('attendance.sessions.show', s.id)} className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-sm">View</Link>
                                                            <Link href={route('attendance.sessions.edit', s.id)} className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 font-medium text-sm">Edit</Link>
                                                            {s.is_locked ? (
                                                                <button type="button" onClick={() => { if (window.confirm('Unlock this session?')) router.post(route('attendance.sessions.unlock', s.id)); }} className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 font-medium text-sm">Unlock</button>
                                                            ) : (
                                                                <button type="button" onClick={() => { if (window.confirm('Lock this session? No further edits will be allowed.')) router.post(route('attendance.sessions.lock', s.id)); }} className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-800 font-medium text-sm">Lock</button>
                                                            )}
                                                            <button type="button" onClick={() => { if (window.confirm('Delete this session?')) router.delete(route('attendance.sessions.destroy', s.id)); }} className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 font-medium text-sm">Delete</button>
                                                        </>
                                                    )}
                                                    <Link href={route(markRoute, s.id)} className="inline-flex items-center gap-1 text-amber-600 hover:text-amber-800 font-medium text-sm">Mark</Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.links && pagination.links.length > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-1">
                                {pagination.links.map((link, i) => (
                                    <button key={i} type="button" onClick={() => link.url && router.get(link.url)} disabled={!link.url} className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg text-sm font-medium transition-colors ${link.active ? 'bg-amber-500 text-white' : link.url ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
