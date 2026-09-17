import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMoneyBillWave,
    faDollarSign,
    faLayerGroup,
    faClipboardList,
    faClock,
    faFileInvoiceDollar,
    faChartBar,
} from '@fortawesome/free-solid-svg-icons';

const MODULES = [
    {
        title: 'Payroll',
        description: 'Generate and manage monthly payroll',
        routeName: 'payroll.index',
        icon: faClipboardList,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
    {
        title: 'Salary Structures',
        description: 'Define employee salary structures',
        routeName: 'payroll.salary-structures.index',
        icon: faLayerGroup,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Allowances',
        description: 'Manage salary allowances and benefits',
        routeName: 'payroll.allowances.index',
        icon: faMoneyBillWave,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Deductions',
        description: 'Configure payroll deductions',
        routeName: 'payroll.deductions.index',
        icon: faDollarSign,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Salary Advances',
        description: 'Approve and track salary advances',
        routeName: 'payroll.advances.index',
        icon: faMoneyBillWave,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Overtime',
        description: 'Manage overtime payments',
        routeName: 'payroll.overtime.index',
        icon: faClock,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Salary Slips',
        description: 'View and download salary slips',
        routeName: 'payroll.slips.index',
        icon: faFileInvoiceDollar,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Payroll Reports',
        description: 'Monthly payroll summaries and totals',
        routeName: 'payroll.reports.index',
        icon: faChartBar,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
];

export default function PayrollManagement() {
    return (
        <AuthenticatedLayout>
            <Head title="Payroll Management" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Payroll Management' },
                        ]}
                    />

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Payroll Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Quick access to all payroll modules.</p>
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
