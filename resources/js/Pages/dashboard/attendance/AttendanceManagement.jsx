import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faClipboardCheck,
    faGear,
    faChartLine,
    faLock,
    faPenToSquare,
    faClipboardList,
} from '@fortawesome/free-solid-svg-icons';

const MODULES = [
    {
        title: 'Sessions',
        description: 'Create and manage attendance sessions',
        routeName: 'attendance.sessions.index',
        icon: faClipboardCheck,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Settings',
        description: 'Configure attendance rules per session',
        routeName: 'attendance.settings.index',
        icon: faGear,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Reports',
        description: 'View and export attendance reports',
        routeName: 'attendance.reports.index',
        icon: faChartLine,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Monthly Freeze',
        description: 'Lock attendance records by month',
        routeName: 'attendance.freeze.index',
        icon: faLock,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
    {
        title: 'Correction Requests',
        description: 'Review and approve attendance corrections',
        routeName: 'attendance.correction-requests.index',
        icon: faPenToSquare,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Audit Logs',
        description: 'Track attendance changes and who made them',
        routeName: 'attendance.audit-logs.index',
        icon: faClipboardList,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
];

export default function AttendanceManagement() {
    return (
        <AuthenticatedLayout>
            <Head title="Attendance Management" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <p className="text-sm text-gray-500 mb-1">Dashboard / Attendance Management</p>
                        <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Quick access to all attendance modules.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {MODULES.map((mod) => (
                            <Link
                                key={mod.routeName}
                                href={route(mod.routeName)}
                                className={`group flex items-center gap-4 rounded-xl border border-gray-200 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-all hover:shadow-md hover:border-amber-300 ${mod.cardBg}`}
                            >
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-white ${mod.iconBg}`}>
                                    <FontAwesomeIcon icon={mod.icon} className="text-lg" />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <h2 className="text-base font-semibold text-gray-900">{mod.title}</h2>
                                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{mod.description}</p>
                                </div>
                                <span className="shrink-0 text-sm font-medium text-amber-600 group-hover:text-amber-700">
                                    Open →
                                </span>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
