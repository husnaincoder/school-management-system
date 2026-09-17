import React, { useState, useEffect } from 'react';
import { Head, Link, usePage, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const STATUS_LABELS = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CorrectionRequestsIndex({ requests, filterStatus = 'pending' }) {
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const data = requests?.data ?? requests ?? [];
    const pagination = requests?.links ? { ...requests, data: undefined } : null;

    return (
        <AuthenticatedLayout>
            <Head title="Attendance Correction Requests" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Attendance Management', href: route('admin.attendance-management') },
                            { label: 'Correction Requests' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faPenToSquare} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Attendance Correction Requests</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Review and approve or reject requests to change attendance records.</p>
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
                        <div className={`mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border ${banner.type === 'success' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            <span className="text-sm font-medium">{banner.message}</span>
                        </div>
                    )}

                    <div className="mb-4 flex flex-wrap gap-2">
                        {['pending', 'approved', 'rejected', ''].map((s) => (
                            <button
                                key={s || 'all'}
                                type="button"
                                onClick={() => router.get(route('attendance.correction-requests.index'), s !== '' ? { status: s } : {}, { preserveState: true })}
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    filterStatus === s
                                        ? 'bg-amber-500 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {s === '' ? 'All' : STATUS_LABELS[s]}
                            </button>
                        ))}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session / Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 bg-white">
                                {data.length === 0 ? (
                                    <tr><td colSpan={6} className="px-6 py-12 text-center text-gray-500">No correction requests.</td></tr>
                                ) : data.map((r) => (
                                    <tr key={r.id}>
                                        <td className="px-6 py-4 text-sm text-gray-600">{formatDate(r.created_at)}</td>
                                        <td className="px-6 py-4 text-sm text-gray-900">{r.requested_by_user?.name ?? '—'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600">Session # {r.attendance_session_id} · {r.attendance_type}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{r.reason}</td>
                                        <td className="px-6 py-4"><span className={`inline-flex px-2.5 py-0.5 rounded text-xs font-medium ${r.status === 'approved' ? 'bg-green-100 text-green-800' : r.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'}`}>{STATUS_LABELS[r.status]}</span></td>
                                        <td className="px-6 py-4">
                                            {r.status === 'pending' && (
                                                <ReviewButtons requestId={r.id} />
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {pagination?.links && pagination.links.length > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-1">
                                {pagination.links.map((link, i) => (
                                    <button key={i} type="button" onClick={() => link.url && router.get(link.url)} disabled={!link.url} className={`min-w-[2.25rem] px-2 py-1.5 rounded text-sm font-medium ${link.active ? 'bg-amber-500 text-white' : link.url ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

function ReviewButtons({ requestId }) {
    const [processing, setProcessing] = useState(false);

    const submit = (status) => {
        setProcessing(true);
        router.put(route('attendance.correction-requests.update', requestId), { status, review_remarks: '' }, { preserveScroll: true, onFinish: () => setProcessing(false) });
    };

    return (
        <div className="flex items-center gap-2">
            <button type="button" onClick={() => submit('approved')} disabled={processing} className="text-green-600 hover:text-green-800 text-sm font-medium">Approve</button>
            <button type="button" onClick={() => submit('rejected')} disabled={processing} className="text-red-600 hover:text-red-800 text-sm font-medium">Reject</button>
        </div>
    );
}
