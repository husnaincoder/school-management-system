import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarXmark, faFilter } from '@fortawesome/free-solid-svg-icons';

export default function LeaveApplicationsIndex({ applications, classSectionGroups = [], filters = {} }) {
    const [filterState, setFilterState] = useState({
        status: filters.status ?? '',
        class_section_group_id: filters.class_section_group_id ?? '',
    });
    const { flash } = usePage().props;

    const applyFilters = (e) => {
        e?.preventDefault();
        router.get(route('teacher.leave-applications.index'), filterState, { preserveState: true });
    };

    const handleApprove = (app) => {
        if (confirm('Approve this leave application?')) {
            router.post(route('teacher.leave-applications.approve', app.id));
        }
    };

    const handleReject = (app) => {
        const remarks = prompt('Rejection reason (optional):');
        if (remarks !== null) {
            router.post(route('teacher.leave-applications.reject', app.id), { remarks });
        }
    };

    const studentName = (app) => {
        const en = app.student_enrollment;
        const st = en?.student;
        return st?.full_name ?? st?.user?.name ?? '—';
    };

    const groupLabel = (app) => {
        const g = app.student_enrollment?.class_section_group;
        if (!g) return '—';
        const cs = g.class_section;
        return [cs?.class?.name, cs?.section?.name, g.subject_group?.name].filter(Boolean).join(' · ') || '—';
    };

    const firstApproval = (app) => app.leave_approvals?.[0];

    const formatDate = (value) => {
        if (!value) return '—';
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    return (
        <AuthenticatedLayout>
            <div className="py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Page header - same style as SessionShow / RemarksCreate */}
                    <div className="mb-6">
                        <Link href={route('dashboard.teacher')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Back to Dashboard</Link>
                        <div className="flex items-center gap-3 mt-2">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarXmark} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Leave Applications</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Approve or reject leave for your incharge class students.</p>
                            </div>
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
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500" /> Filters
                        </h2>
                        <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                            <div className="min-w-[160px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
                                <select
                                    value={filterState.status}
                                    onChange={(e) => setFilterState((s) => ({ ...s, status: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">All status</option>
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                </select>
                            </div>
                            <div className="min-w-[200px]">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Class</label>
                                <select
                                    value={filterState.class_section_group_id}
                                    onChange={(e) => setFilterState((s) => ({ ...s, class_section_group_id: e.target.value }))}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">All classes</option>
                                    {classSectionGroups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.label}</option>
                                    ))}
                                </select>
                            </div>
                            <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors">Apply</button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50/80">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">From – To</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Reason</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {applications.data?.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No leave applications found.</td>
                                        </tr>
                                    ) : (
                                        applications.data?.map((app) => (
                                            <tr key={app.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{studentName(app)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{groupLabel(app)}</td>
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
                                                    {app.status === 'pending' && (
                                                        <span className="flex flex-wrap gap-2">
                                                            <button type="button" onClick={() => handleApprove(app)} className="text-emerald-600 hover:text-emerald-800 font-medium text-sm">Approve</button>
                                                            <button type="button" onClick={() => handleReject(app)} className="text-red-600 hover:text-red-800 font-medium text-sm">Reject</button>
                                                        </span>
                                                    )}
                                                    {app.status !== 'pending' && firstApproval(app) && (
                                                        <span className="text-gray-400 text-xs">By {firstApproval(app).approver?.name ?? '—'}</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {applications.links?.length > 1 && (
                            <div className="px-6 py-4 border-t border-gray-100 flex flex-wrap items-center justify-end gap-1">
                                {applications.links.map((link, i) => (
                                    link.url ? (
                                        <Link key={i} href={link.url} className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg text-sm font-medium text-center transition-colors ${link.active ? 'bg-amber-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
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
