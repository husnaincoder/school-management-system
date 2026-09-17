import React, { useState, useEffect } from 'react';
import {Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSliders, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const USER_TYPE_LABELS = { student: 'Student', teacher: 'Teacher', employee: 'Employee' };

export default function SettingsIndex({ settings = [], academicSessions = [], filterAcademicSessionId = null }) {
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    return (
        <AuthenticatedLayout>
            <Head title="Attendance Settings" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Attendance Management', href: route('admin.attendance-management') },
                            { label: 'Settings' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faSliders} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Attendance Settings</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Configure late, half-day and weekend off rules used to auto-mark attendance.
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

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex gap-4 items-center justify-between">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-900">Session Settings</h2>
                                <p className="text-xs text-gray-500">View settings by academic session.</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Filter by session</span>
                                <select
                                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterAcademicSessionId ?? ''}
                                    onChange={(e) => {
                                        const v = e.target.value;
                                        window.location.href = route(
                                            'attendance.settings.index',
                                            v ? { academic_session_id: v } : {},
                                        );
                                    }}
                                >
                                    <option value="">All</option>
                                    {academicSessions.map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {s.name}
                                            {s.is_current ? ' (current)' : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Session
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        User Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Late After
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Half Day After
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Weekend Off
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {settings.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-8 text-center text-sm text-gray-500"
                                        >
                                            No settings found. Use the form below to add a new rule.
                                        </td>
                                    </tr>
                                ) : (
                                    settings.map((s) => (
                                        <tr key={s.id}>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {s.academic_session?.name ?? 'Default'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                    {USER_TYPE_LABELS[s.user_type] ?? s.user_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {s.late_after ?? '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {s.half_day_after ?? '—'}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {s.weekend_off ? 'Yes' : 'No'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Add / Update Setting</h2>
                        <p className="text-xs text-gray-500 mb-4">
                            Create or update attendance rules for a specific user type and session.
                        </p>
                        <SettingsForm academicSessions={academicSessions} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function SettingsForm({ academicSessions }) {
    const { data, setData, post, processing, errors } = useForm({
        academic_session_id: '',
        user_type: 'student',
        late_after: '',
        half_day_after: '',
        weekend_off: false,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('attendance.settings.store'), { preserveScroll: true });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session (optional)</label>
                    <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={data.academic_session_id}
                        onChange={(e) => setData('academic_session_id', e.target.value)}
                    >
                        <option value="">Default (all sessions)</option>
                        {academicSessions.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User Type *</label>
                    <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={data.user_type}
                        onChange={(e) => setData('user_type', e.target.value)}
                    >
                        <option value="student">Student</option>
                        <option value="teacher">Teacher</option>
                        <option value="employee">Employee</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Late After (HH:MM)</label>
                    <input
                        type="time"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={data.late_after}
                        onChange={(e) => setData('late_after', e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Half Day After (HH:MM)</label>
                    <input
                        type="time"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        value={data.half_day_after}
                        onChange={(e) => setData('half_day_after', e.target.value)}
                    />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    id="weekend_off"
                    checked={data.weekend_off}
                    onChange={(e) => setData('weekend_off', e.target.checked)}
                    className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="weekend_off" className="text-sm text-gray-700">Weekend off (skip weekend dates)</label>
            </div>
            <button
                type="submit"
                disabled={processing}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
            >
                Save Setting
            </button>
        </form>
    );
}
