import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faCalendarDays,
    faCalendarXmark,
    faClipboardList,
    faTags,
} from '@fortawesome/free-solid-svg-icons';

const MODULES = [
    {
        title: 'Leave Applications',
        description: 'Review and approve staff leave requests',
        routeName: 'leaves.index',
        icon: faCalendarDays,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Student Leave Applications',
        description: 'Manage student leave requests',
        routeName: 'admin.student-leave-applications.index',
        icon: faCalendarXmark,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Leave Balances',
        description: 'Track leave balances per employee',
        routeName: 'leave-balances.index',
        icon: faClipboardList,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Leave Types',
        description: 'Configure leave types and policies',
        routeName: 'leave-types.index',
        icon: faTags,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
];

export default function LeaveManagement() {
    return (
        <AuthenticatedLayout>
            <Head title="Leave Management" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Leave Management' },
                        ]}
                    />

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Quick access to all leave modules.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
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
