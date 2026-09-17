import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faMoneyBillWave,
    faClipboardList,
    faUserGraduate,
    faUsers,
    faClock,
    faCalendarCheck,
    faFileInvoice,
    faClockRotateLeft,
    faSquarePlus,
    faChartLine,
    faClipboardCheck,
} from '@fortawesome/free-solid-svg-icons';

const MODULES = [
    {
        title: 'Fee Types',
        description: 'Manage tuition, transport, and other fee types',
        routeName: 'fee-types.index',
        icon: faMoneyBillWave,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Class Fee Structure',
        description: 'Define fee structure per class',
        routeName: 'class-fee-structures.index',
        icon: faClipboardList,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Scholarships',
        description: 'Manage scholarship programs and discounts',
        routeName: 'scholarships.index',
        icon: faMoneyBillWave,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Student Scholarships',
        description: 'Assign scholarships to students',
        routeName: 'student-scholarships.index',
        icon: faUserGraduate,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
    {
        title: 'Sibling Discounts',
        description: 'Configure sibling discount rules',
        routeName: 'sibling-discounts.index',
        icon: faUsers,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Late Fine Rules',
        description: 'Set late payment fine policies',
        routeName: 'late-fine-rules.index',
        icon: faClock,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Installment Plans',
        description: 'Create fee installment plans',
        routeName: 'installment-plans.index',
        icon: faCalendarCheck,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Student Installments',
        description: 'Assign installment plans to students',
        routeName: 'student-installments.index',
        icon: faUserGraduate,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
    {
        title: 'Invoices',
        description: 'Generate and manage fee invoices',
        routeName: 'invoices.index',
        icon: faFileInvoice,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
    {
        title: 'Over Time Charges',
        description: 'Manage overtime fee charges',
        routeName: 'over-time-charges.index',
        icon: faClockRotateLeft,
        cardBg: 'bg-orange-50',
        iconBg: 'bg-amber-600',
    },
    {
        title: 'Student Optional Services',
        description: 'Optional services and add-on fees',
        routeName: 'student-optional-services.index',
        icon: faSquarePlus,
        cardBg: 'bg-yellow-50',
        iconBg: 'bg-amber-400',
    },
    {
        title: 'Fee Reports',
        description: 'View fee collection and outstanding reports',
        routeName: 'fee-reports.index',
        icon: faChartLine,
        cardBg: 'bg-[#e8eef7]',
        iconBg: 'bg-[#2E3D50]',
    },
    {
        title: 'Fee Payment Status',
        description: 'Paid / unpaid students by session, class & month',
        routeName: 'fee-payment-status.index',
        icon: faClipboardCheck,
        cardBg: 'bg-amber-50',
        iconBg: 'bg-amber-500',
    },
];

export default function AccountantManagement() {
    return (
        <AuthenticatedLayout>
            <Head title="Accountant Management" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management' },
                        ]}
                    />

                    <div className="mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">Accountant Management</h1>
                        <p className="text-sm text-gray-500 mt-1">Quick access to all fee and accounting modules.</p>
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
