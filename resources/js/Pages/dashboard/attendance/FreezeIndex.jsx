import React, { useState, useEffect } from 'react';
import {Head, Link, useForm, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSnowflake, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const TYPE_LABELS = { student: 'Student', teacher: 'Teacher', employee: 'Employee' };

export default function FreezeIndex({ freezes = [], academicSessions = [], filterAcademicSessionId = null }) {
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const unfreeze = (id) => {
        if (window.confirm('Unfreeze this month? Attendance for this month will be editable again.')) {
            router.delete(route('attendance.freeze.destroy', id));
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Monthly Attendance Freeze" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Attendance Management', href: route('admin.attendance-management') },
                            { label: 'Monthly Freeze' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faSnowflake} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Monthly Attendance Freeze</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Lock months to prevent further attendance changes; unfreeze when needed.
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
                            className={`mb-6 px-4 py-3 rounded-lg border text-sm font-medium ${
                                banner.type === 'success'
                                    ? 'bg-green-50 text-green-800 border-green-200'
                                    : 'bg-red-50 text-red-800 border-red-200'
                            }`}
                        >
                            <span>{banner.message}</span>
                        </div>
                    )}

                    <div className="mb-6">
                        <label className="block text-xs font-medium text-gray-500 mb-1">
                            Filter by academic session
                        </label>
                        <select
                            className="border border-gray-300 rounded-lg px-3 py-2 text-sm max-w-xs bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                            value={filterAcademicSessionId ?? ''}
                            onChange={(e) => {
                                const v = e.target.value;
                                window.location.href = route(
                                    'attendance.freeze.index',
                                    v ? { academic_session_id: v } : {},
                                );
                            }}
                        >
                            <option value="">All sessions</option>
                            {academicSessions.map((s) => (
                                <option key={s.id} value={s.id}>
                                    {s.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden mb-8">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-sm font-semibold text-gray-900">Frozen Months</h2>
                            <p className="text-xs text-gray-500">
                                View all months that are currently locked for attendance editing.
                            </p>
                        </div>
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Session
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Year / Month
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {freezes.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-8 text-center text-sm text-gray-500"
                                        >
                                            No freezes found.
                                        </td>
                                    </tr>
                                ) : (
                                    freezes.map((f) => (
                                        <tr key={f.id}>
                                            <td className="px-6 py-4 text-sm text-gray-900">
                                                {f.academic_session?.name ?? '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {f.year} / {String(f.month).padStart(2, '0')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex px-2.5 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100">
                                                    {TYPE_LABELS[f.type] ?? f.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {f.is_frozen && (
                                                    <button
                                                        type="button"
                                                        onClick={() => unfreeze(f.id)}
                                                        className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                                                    >
                                                        Unfreeze
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-2">Freeze a Month</h2>
                        <p className="text-xs text-gray-500 mb-4">
                            Select a session, month and user type to lock attendance for that period.
                        </p>
                        <FreezeForm academicSessions={academicSessions} />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function FreezeForm({ academicSessions }) {
    const current = new Date();
    const firstSession = academicSessions.find((s) => s.is_current) || academicSessions[0];
    const { data, setData, post, processing } = useForm({
        academic_session_id: firstSession?.id ?? '',
        year: current.getFullYear(),
        month: current.getMonth() + 1,
        type: 'student',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('attendance.freeze.store'), { preserveScroll: true });
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-wrap gap-4 items-end">
            <div className="min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session</label>
                <select
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={data.academic_session_id}
                    onChange={(e) => setData('academic_session_id', e.target.value)}
                    required
                >
                    {academicSessions.map((s) => (
                        <option key={s.id} value={s.id}>
                            {s.name}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                <input
                    type="number"
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-24 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={data.year}
                    onChange={(e) => setData('year', parseInt(e.target.value, 10))}
                    min="2020"
                    max="2100"
                    required
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={data.month}
                    onChange={(e) => setData('month', parseInt(e.target.value, 10))}
                >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((m) => (
                        <option key={m} value={m}>
                            {String(m).padStart(2, '0')}
                        </option>
                    ))}
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    value={data.type}
                    onChange={(e) => setData('type', e.target.value)}
                >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="employee">Employee</option>
                </select>
            </div>
            <button
                type="submit"
                disabled={processing}
                className="px-4 py-2.5 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg disabled:opacity-50 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-amber-500"
            >
                Freeze Month
            </button>
        </form>
    );
}
