import React, { useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarXmark, faFilter, faPlus, faEye, faPenToSquare } from '@fortawesome/free-solid-svg-icons';

function studentName(app) {
    const en = app.student_enrollment;
    const st = en?.student;
    return st?.user?.name ?? ([st?.first_name, st?.last_name].filter(Boolean).join(' ') || '—');
}

function classLabel(app) {
    const g = app.student_enrollment?.class_section_group;
    if (!g) return '—';
    const cs = g.class_section;
    return [cs?.class?.name, cs?.section?.name].filter(Boolean).join(' · ') || '—';
}

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function LeaveApplicationsIndex({ applications, filters = {} }) {
    const [filterStatus, setFilterStatus] = useState(filters.status ?? '');
    const { flash } = usePage().props;

    const applyFilters = (e) => {
        e?.preventDefault();
        router.get(route('parent.leave-applications.index'), { status: filterStatus }, { preserveState: true });
    };

    const data = applications?.data ?? applications ?? [];

    return (
        <AuthenticatedLayout>
            <Head title="Leave Applications" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-6">
                        <Link href={route('dashboard.parent')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to Dashboard</Link>
                        <div className="flex flex-wrap items-center justify-between gap-4 mt-2">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                    <FontAwesomeIcon icon={faCalendarXmark} className="text-amber-500 text-xl" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">Leave Applications</h1>
                                    <p className="text-sm text-gray-500 mt-0.5">View and manage leave applications for your children.</p>
                                </div>
                            </div>
                            <Link
                                href={route('parent.leave-applications.create')}
                                className="inline-flex items-center gap-2 rounded-lg bg-[#FFA500] px-4 py-2 text-sm font-medium text-white hover:bg-[#e59400] focus:ring-2 focus:ring-[#FFA500] focus:ring-offset-2"
                            >
                                <FontAwesomeIcon icon={faPlus} /> New application
                            </Link>
                        </div>
                    </div>

                    {flash?.success && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border bg-emerald-50 text-emerald-800 border-emerald-200" role="alert">
                            <span className="text-sm font-medium">{flash.success}</span>
                        </div>
                    )}
                    {flash?.error && (
                        <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-xl border bg-red-50 text-red-800 border-red-200" role="alert">
                            <span className="text-sm font-medium">{flash.error}</span>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500" /> Filter
                        </h2>
                        <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                            <div className="min-w-[160px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                <select
                                    value={filterStatus}
                                    onChange={(e) => setFilterStatus(e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-[#FFA500] focus:border-[#FFA500]"
                                >
                                    <option value="">All status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <button type="submit" className="rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 transition-colors">Apply</button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Child</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">From – To</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No leave applications yet.</td>
                                        </tr>
                                    ) : (
                                        data.map((app) => (
                                            <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{studentName(app)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{classLabel(app)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{formatDate(app.start_date)} – {formatDate(app.end_date)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{app.total_days}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{app.reason}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border ${
                                                        app.status === 'approved' ? 'bg-green-50 text-green-800 border-green-200' :
                                                        app.status === 'rejected' ? 'bg-red-50 text-red-800 border-red-200' : 'bg-amber-100 text-amber-800 border-amber-200'
                                                    }`}>
                                                        {app.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    <span className="flex flex-wrap gap-3">
                                                        <Link href={route('parent.leave-applications.show', app.id)} className="text-[#FFA500] hover:text-[#e59400] font-medium inline-flex items-center gap-1">
                                                            <FontAwesomeIcon icon={faEye} className="text-xs" /> View
                                                        </Link>
                                                        {app.status === 'pending' && (
                                                            <Link href={route('parent.leave-applications.edit', app.id)} className="text-gray-700 hover:text-gray-900 font-medium inline-flex items-center gap-1">
                                                                <FontAwesomeIcon icon={faPenToSquare} className="text-xs" /> Edit
                                                            </Link>
                                                        )}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {applications?.links?.length > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-1">
                                {applications.links.map((link, i) => (
                                    link.url ? (
                                        <Link key={i} href={link.url} className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg text-sm font-medium text-center transition-colors ${link.active ? 'bg-[#FFA500] text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ) : (
                                        <span key={i} className="min-w-[2.25rem] px-2 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed inline-block text-center" dangerouslySetInnerHTML={{ __html: link.label }} />
                                    )
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
