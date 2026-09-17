import React from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarXmark, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LeaveApplicationShow({ application }) {
    const { flash } = usePage().props;
    const en = application?.student_enrollment;
    const student = en?.student;
    const studentName = student?.user?.name ?? ([student?.first_name, student?.last_name].filter(Boolean).join(' ') || '—');
    const csg = en?.class_section_group;
    const cs = csg?.class_section;
    const classLabel = [cs?.class?.name, cs?.section?.name].filter(Boolean).join(' · ') || '—';

    return (
        <AuthenticatedLayout>
            <Head title="Leave Application" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('parent.leave-applications.index')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to list</Link>
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                    <FontAwesomeIcon icon={faCalendarXmark} className="text-amber-500 text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Leave Application</h1>
                                    <p className="text-sm text-gray-500 mt-0.5">Application details</p>
                                </div>
                            </div>
                            {application?.status === 'pending' && (
                                <Link
                                    href={route('parent.leave-applications.edit', application.id)}
                                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-[#FFA500] focus:ring-offset-2"
                                >
                                    <FontAwesomeIcon icon={faPenToSquare} /> Edit
                                </Link>
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
                                <dt className="text-sm font-medium text-gray-500">Child</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{studentName}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">Class</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{classLabel}</dd>
                            </div>
                            {application?.leave_type && (
                                <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                    <dt className="text-sm font-medium text-gray-500">Leave type</dt>
                                    <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application.leave_type.name}</dd>
                                </div>
                            )}
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">From date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{formatDate(application?.start_date)}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">To date</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{formatDate(application?.end_date)}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">Total days</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application?.total_days ?? '—'}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">Reason</dt>
                                <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 whitespace-pre-wrap">{application?.reason ?? '—'}</dd>
                            </div>
                            <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                <dt className="text-sm font-medium text-gray-500">Status</dt>
                                <dd className="mt-1 sm:col-span-2 sm:mt-0">
                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                        application?.status === 'approved' ? 'bg-green-50 text-green-800 border-green-200' :
                                        application?.status === 'rejected' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                                    }`}>
                                        {application?.status ?? '—'}
                                    </span>
                                </dd>
                            </div>
                            {application?.status !== 'pending' && application?.approved_at && (
                                <>
                                    <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Processed on</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{formatDate(application.approved_at)}</dd>
                                    </div>
                                    <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                        <dt className="text-sm font-medium text-gray-500">Processed by</dt>
                                        <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">{application.approved_by_user?.name ?? '—'}</dd>
                                    </div>
                                    {application?.remarks && (
                                        <div className="px-6 py-4 sm:grid sm:grid-cols-3 sm:gap-4">
                                            <dt className="text-sm font-medium text-gray-500">Remarks</dt>
                                            <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0 whitespace-pre-wrap">{application.remarks}</dd>
                                        </div>
                                    )}
                                </>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
