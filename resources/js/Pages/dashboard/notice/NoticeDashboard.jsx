import React from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBell, faThumbtack, faClock, faExclamationTriangle, faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const priorityClass = (p) => {
    const map = { low: 'bg-gray-100 text-gray-800', medium: 'bg-blue-100 text-blue-800', high: 'bg-amber-100 text-amber-800', urgent: 'bg-red-100 text-red-800' };
    return map[p] || 'bg-gray-100 text-gray-800';
};

export default function NoticeDashboard({ pinned = [], recent = [], urgent = [], unreadCount = 0 }) {
    const Card = ({ title, icon, items, emptyMsg }) => (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FontAwesomeIcon icon={icon} className="text-amber-500" /> {title}
            </h2>
            {items.length === 0 ? (
                <p className="text-gray-500 text-sm">{emptyMsg}</p>
            ) : (
                <ul className="space-y-3">
                    {items.map((n) => (
                        <li key={n.id}>
                            <Link href={route('notices.show', n.id)} className="block p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-amber-200 transition-colors">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {n.is_pinned && <FontAwesomeIcon icon={faThumbtack} className="text-amber-500 text-xs" />}
                                    <span className="font-medium text-gray-900">{n.title}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs ${priorityClass(n.priority)}`}>{n.priority}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{n.category?.name} · {new Date(n.created_at).toLocaleDateString()}</p>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Notice Dashboard" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Notice Management', href: route('admin.notice-management') },
                            { label: 'Notice Dashboard' },
                        ]}
                    />

                    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faBell} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notice Dashboard</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Pinned, recent and urgent notices.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <Link
                                href={route('admin.notice-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <Link href={route('notices.create')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">
                                <FontAwesomeIcon icon={faPlus} /> Add Notice
                            </Link>
                            <Link href={route('notices.index')} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 font-medium hover:bg-gray-200">
                                All Notices
                            </Link>
                            {unreadCount > 0 && (
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                                    {unreadCount} unread
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card title="Pinned" icon={faThumbtack} items={pinned} emptyMsg="No pinned notices." />
                        <Card title="Recent" icon={faClock} items={recent} emptyMsg="No recent notices." />
                        <Card title="Urgent" icon={faExclamationTriangle} items={urgent} emptyMsg="No urgent notices." />
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
