import React from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faBell, faEye, faHeart, faComment, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function NoticeAnalytics({ totalNotices = 0, totalReads = 0, mostLiked = [], mostCommented = [] }) {
    return (
        <AuthenticatedLayout>
            <Head title="Notice Analytics" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Notice Management', href: route('admin.notice-management') },
                            { label: 'Notice Analytics' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChartLine} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Notice Analytics</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Totals and most engaged notices.</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.notice-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faBell} className="text-amber-500 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Notices</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalNotices}</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-amber-50 flex items-center justify-center">
                                    <FontAwesomeIcon icon={faEye} className="text-amber-600 text-xl" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Total Reads</p>
                                    <p className="text-2xl font-bold text-gray-900">{totalReads}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                                <FontAwesomeIcon icon={faHeart} className="text-amber-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Most Liked Notices</h2>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {(mostLiked || []).length === 0 ? (
                                    <li className="px-6 py-8 text-center text-gray-500">No data yet.</li>
                                ) : (
                                    (mostLiked || []).map((n) => (
                                        <li key={n.id}>
                                            <Link href={route('notices.show', n.id)} className="block px-6 py-3 hover:bg-amber-50/50">
                                                <span className="font-medium text-gray-900">{n.title}</span>
                                                <span className="ml-2 text-sm text-amber-600">{n.likes_count} like(s)</span>
                                            </Link>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                                <FontAwesomeIcon icon={faComment} className="text-amber-600" />
                                <h2 className="text-lg font-semibold text-gray-900">Most Commented Notices</h2>
                            </div>
                            <ul className="divide-y divide-gray-200">
                                {(mostCommented || []).length === 0 ? (
                                    <li className="px-6 py-8 text-center text-gray-500">No data yet.</li>
                                ) : (
                                    (mostCommented || []).map((n) => (
                                        <li key={n.id}>
                                            <Link href={route('notices.show', n.id)} className="block px-6 py-3 hover:bg-amber-50/50">
                                                <span className="font-medium text-gray-900">{n.title}</span>
                                                <span className="ml-2 text-sm text-amber-600">{n.comments_count} comment(s)</span>
                                            </Link>
                                        </li>
                                    ))
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
