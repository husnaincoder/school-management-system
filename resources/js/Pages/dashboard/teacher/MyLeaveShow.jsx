import React from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faPenToSquare, faTrashCan } from '@fortawesome/free-solid-svg-icons';

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function MyLeaveShow({ leave }) {
    const { flash } = usePage().props;

    const handleDelete = () => {
        if (confirm('Delete this leave application? This cannot be undone.')) {
            router.delete(route('teacher.my-leaves.destroy', leave?.id), {
                onSuccess: () => router.get(route('teacher.my-leaves.index')),
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Leave Application" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('teacher.my-leaves.index')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to list</Link>
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                    <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500 text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Leave Application</h1>
                                    <p className="text-sm text-gray-500 mt-0.5">Application details</p>
                                </div>
                            </div>
                            {leave?.status === 'pending' && (
                                <span className="flex gap-2">
                                    <Link
                                        href={route('teacher.my-leaves.edit', leave.id)}
                                        className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-[#FFA500] focus:ring-offset-2"
                                    >
                                        <FontAwesomeIcon icon={faPenToSquare} /> Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                    >
                                        <FontAwesomeIcon icon={faTrashCan} /> Delete
                                    </button>
                                </span>
                            )}
                        </div>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200" role="alert">
                            <span className="text-sm font-medium">{flash.success}</span>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <dl className="divide-y divide-gray-200">
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">Leave Type</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{leave?.leave_type?.name ?? '—'}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">From date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{formatDate(leave?.start_date)}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">To date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{formatDate(leave?.end_date)}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">Total days</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{leave?.total_days ?? '—'}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">Reason</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 whitespace-pre-wrap">{leave?.reason ?? '—'}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 sm:col-span-2 sm:mt-0">
                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                        leave?.status === 'approved' ? 'bg-green-50 text-green-800 border-green-200' :
                                        leave?.status === 'rejected' ? 'bg-red-50 text-red-800 border-red-200' :
                                        leave?.status === 'cancelled' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                                    }`}>
                                        {leave?.status ?? '—'}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
