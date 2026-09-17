import React, { useState, useEffect } from 'react';
import {Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartPie, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

export default function ReportsIndex({ todaySummary, classWise = [], mostAbsent = [], academicSessions = [], classSectionGroups = [], filters = {} }) {
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [filterState, setFilterState] = useState({
        academic_session_id: filters.academic_session_id ?? '',
        date_from: filters.date_from ?? '',
        date_to: filters.date_to ?? '',
        class_section_group_id: filters.class_section_group_id ?? '',
    });
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const applyFilters = (e) => {
        e?.preventDefault();
        router.get(route('attendance.reports.index'), filterState, { preserveState: true });
    };

    const exportUrl = (format) => {
        const params = new URLSearchParams({
            academic_session_id: filterState.academic_session_id || (academicSessions[0]?.id ?? ''),
            date_from: filterState.date_from,
            date_to: filterState.date_to,
        });
        if (filterState.class_section_group_id) params.set('class_section_group_id', filterState.class_section_group_id);
        return route('attendance.reports.export.' + format) + '?' + params.toString();
    };

    return (
        <AuthenticatedLayout>
            <Head title="Attendance Reports" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Attendance Management', href: route('admin.attendance-management') },
                            { label: 'Reports' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChartPie} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Attendance Reports</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Daily summary, class-wise percentage and most absent students with export options.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.attendance-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    {banner.message && (
                        <div
                            className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-lg border text-sm font-medium ${
                                banner.type === 'success'
                                    ? 'bg-green-50 text-green-800 border-green-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                            role="alert"
                        >
                            <span>{banner.message}</span>
                        </div>
                    )}

                    {todaySummary && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] mb-6 border-l-4 border-amber-500">
                            <div className="p-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Student Attendance</h2>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                                    <div><div className="text-gray-500 text-xs">Total</div><div className="text-xl font-bold">{todaySummary.total}</div></div>
                                    <div><div className="text-gray-500 text-xs">Present</div><div className="text-xl font-bold text-green-600">{todaySummary.present}</div></div>
                                    <div><div className="text-gray-500 text-xs">Absent</div><div className="text-xl font-bold text-red-600">{todaySummary.absent}</div></div>
                                    <div><div className="text-gray-500 text-xs">Late</div><div className="text-xl font-bold text-amber-600">{todaySummary.late}</div></div>
                                    <div><div className="text-gray-500 text-xs">Leave</div><div className="text-xl font-bold text-gray-600">{todaySummary.leave}</div></div>
                                    <div>
                                        <div className="text-gray-500 text-xs">Overall %</div>
                                        <div className={`text-xl font-bold ${todaySummary.alert_below_75 ? 'text-red-600' : 'text-amber-600'}`}>
                                            {todaySummary.percentage}%
                                        </div>
                                        {todaySummary.alert_below_75 && <div className="text-xs text-red-600">Below 75%</div>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-base font-semibold text-gray-900">Filters & Export</h2>
                                <p className="text-xs text-gray-500">
                                    Choose session, date range and class group, then export detailed reports.
                                </p>
                            </div>
                        </div>
                        <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end mb-4">
                            <div className="min-w-[180px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Academic Session</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterState.academic_session_id}
                                    onChange={(e) =>
                                        setFilterState((p) => ({ ...p, academic_session_id: e.target.value }))
                                    }
                                >
                                    <option value="">Select</option>
                                    {academicSessions.map((s) => (<option key={s.id} value={s.id}>{s.name}</option>))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
                                <input
                                    type="date"
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterState.date_from}
                                    onChange={(e) =>
                                        setFilterState((p) => ({ ...p, date_from: e.target.value }))
                                    }
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
                                <input
                                    type="date"
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterState.date_to}
                                    onChange={(e) =>
                                        setFilterState((p) => ({ ...p, date_to: e.target.value }))
                                    }
                                />
                            </div>
                            <div className="min-w-[200px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Class Section Group</label>
                                <select
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterState.class_section_group_id}
                                    onChange={(e) =>
                                        setFilterState((p) => ({ ...p, class_section_group_id: e.target.value }))
                                    }
                                >
                                    <option value="">All</option>
                                    {classSectionGroups.map((csg) => (<option key={csg.id} value={csg.id}>{groupLabel(csg)}</option>))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                className="inline-flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium py-2 px-4 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
                            >
                                Apply
                            </button>
                        </form>
                        <div className="flex flex-wrap gap-2">
                            <a
                                href={exportUrl('csv')}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                            >
                                Export CSV
                            </a>
                            <a
                                href={exportUrl('excel')}
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                            >
                                Export Excel
                            </a>
                            <a
                                href={exportUrl('pdf')}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                            >
                                Export PDF
                            </a>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="font-semibold text-gray-900">Class-wise Attendance %</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Class / Group
                                            </th>
                                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                %
                                            </th>
                                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Present / Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {classWise.length === 0 ? <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-500">No data</td></tr> : classWise.map((row) => (
                                            <tr key={row.class_section_group_id}><td className="px-6 py-3 text-sm text-gray-900">{row.label}</td><td className="px-6 py-3 text-sm font-medium">{row.percentage}%</td><td className="px-6 py-3 text-sm text-gray-600">{row.present} / {row.total}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h2 className="font-semibold text-gray-900">Most Absent Students</h2>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Name
                                            </th>
                                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Roll No
                                            </th>
                                            <th className="px-6 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                Absent Count
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {mostAbsent.length === 0 ? <tr><td colSpan={3} className="px-6 py-6 text-center text-gray-500">No data</td></tr> : mostAbsent.map((row) => (
                                            <tr key={row.student_enrollment_id}><td className="px-6 py-3 text-sm text-gray-900">{row.student_name}</td><td className="px-6 py-3 text-sm text-gray-600">{row.roll_number}</td><td className="px-6 py-3 text-sm font-medium text-red-600">{row.absent_count}</td></tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    <div className="mt-6">
                        <Link
                            href={route('attendance.reports.student')}
                            className="text-amber-600 hover:text-amber-800 font-medium text-sm"
                        >
                            → Student-wise report
                        </Link>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
