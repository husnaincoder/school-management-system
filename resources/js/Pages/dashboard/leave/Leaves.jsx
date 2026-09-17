import React, { useState, useEffect } from 'react';
import {Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEye, faCalendarDays, faFilter, faPen, faTrashCan, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const statusBadge = (status) => {
    const map = {
        pending: 'bg-amber-100 text-amber-800',
        approved: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-600',
    };
    return map[status] || 'bg-gray-100 text-gray-600';
};

function studentName(student) {
    if (!student) return '—';
    const n = (student.full_name ?? [student.first_name, student.last_name].filter(Boolean).join(' ').trim()) || '—';
    return n;
}

function classSectionDisplay(enrollment) {
    const csg = enrollment?.class_section_group ?? enrollment?.classSectionGroup;
    const cs = csg?.class_section ?? csg?.classSection;
    if (!cs) return '';
    const cls = cs.class?.name ?? '';
    const sec = cs.section?.name ?? '';
    return [cls, sec].filter(Boolean).join(' - ') || '';
}

function applicantDisplay(leave) {
    const enrollment = leave.student_enrollment ?? leave.studentEnrollment;
    if (enrollment?.student) {
        const name = studentName(enrollment.student);
        const cs = classSectionDisplay(enrollment);
        return cs ? `${name} (${cs})` : name;
    }
    if (leave.teacher?.user) return leave.teacher.user.name;
    if (leave.employee?.user) return leave.employee.user.name;
    return '—';
}

function applicantType(leave) {
    if (leave.student_enrollment_id) return 'Student';
    if (leave.teacher_id) return 'Teacher';
    if (leave.employee_id) return 'Employee';
    return '—';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeavesIndex({ leaves, leaveTypes = [], filters = {} }) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [showFilters, setShowFilters] = useState(false);
    const [status, setStatus] = useState(filters.status ?? '');
    const [leaveTypeId, setLeaveTypeId] = useState(filters.leave_type_id ?? '');
    const [fromDate, setFromDate] = useState(filters.from_date ?? '');
    const [toDate, setToDate] = useState(filters.to_date ?? '');

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const applyFilters = () => {
        router.get(route('leaves.index'), {
            status: status || undefined,
            leave_type_id: leaveTypeId || undefined,
            from_date: fromDate || undefined,
            to_date: toDate || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setStatus('');
        setLeaveTypeId('');
        setFromDate('');
        setToDate('');
        router.get(route('leaves.index'));
    };

    const data = leaves?.data ?? [];
    const pagination = leaves?.links ?? [];

    return (
        <AuthenticatedLayout>
            <Head title="Leave Applications" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div
                            className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            role="alert"
                        >
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Leave Management', href: route('admin.leave-management') },
                            { label: 'Leave Applications' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Leave Applications</h1>
                                <p className="text-sm text-gray-500 mt-0.5">View and manage all leave requests.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.leave-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <Link
                                href={route('leaves.create')}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} /> Add Leave
                            </Link>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 mb-6">
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 text-gray-700 hover:text-amber-600 font-medium"
                        >
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" /> {showFilters ? 'Hide' : 'Show'} filters
                        </button>
                        {showFilters && (
                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="">All</option>
                                        <option value="pending">Pending</option>
                                        <option value="approved">Approved</option>
                                        <option value="rejected">Rejected</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Leave Type</label>
                                    <select
                                        value={leaveTypeId}
                                        onChange={(e) => setLeaveTypeId(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="">All</option>
                                        {(leaveTypes || []).map((lt) => (
                                            <option key={lt.id} value={lt.id}>{lt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">From date</label>
                                    <input
                                        type="date"
                                        value={fromDate}
                                        onChange={(e) => setFromDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To date</label>
                                    <input
                                        type="date"
                                        value={toDate}
                                        onChange={(e) => setToDate(e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    />
                                </div>
                                <div className="sm:col-span-2 flex gap-2">
                                    <button type="button" onClick={applyFilters} className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm transition-colors">
                                        Apply
                                    </button>
                                    <button type="button" onClick={clearFilters} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                        Clear
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applicant</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                                No leave applications found.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((leave) => (
                                            <tr key={leave.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{applicantDisplay(leave)}</td>
                                                <td className="px-6 py-4 text-gray-600">{applicantType(leave)}</td>
                                                <td className="px-6 py-4 text-gray-600">{leave.leave_type?.name ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600 text-sm">
                                                    {formatDate(leave.start_date)} to {formatDate(leave.end_date)}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{leave.total_days}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${statusBadge(leave.status)}`}>
                                                        {(leave.status ?? '').charAt(0).toUpperCase() + (leave.status ?? '').slice(1)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <Link
                                                            href={route('leaves.show', leave.id)}
                                                            className="text-amber-500 hover:text-amber-600"
                                                            title="View"
                                                        >
                                                            <FontAwesomeIcon icon={faEye} className="text-sm" />
                                                        </Link>
                                                        {leave.status === 'pending' && (
                                                            <>
                                                                <Link
                                                                    href={route('leaves.edit', leave.id)}
                                                                    className="text-amber-500 hover:text-amber-600"
                                                                    title="Edit"
                                                                >
                                                                    <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                                </Link>
                                                                <button
                                                                    onClick={() => {
                                                                        if (window.confirm('Are you sure you want to delete this leave application?')) {
                                                                            router.delete(route('leaves.destroy', leave.id), {
                                                                                onSuccess: () => router.get(route('leaves.index')),
                                                                            });
                                                                        }
                                                                    }}
                                                                    className="text-red-500 hover:text-red-600"
                                                                    title="Delete"
                                                                >
                                                                    <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination.length > 3 && (
                            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-2">
                                {pagination.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
