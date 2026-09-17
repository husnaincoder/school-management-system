import React, { useState, useEffect } from 'react';
import {Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faArrowLeft, faCheck, faTimes, faPen, faTrashCan } from '@fortawesome/free-solid-svg-icons';

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
    return (student.full_name ?? [student.first_name, student.last_name].filter(Boolean).join(' ').trim()) || '—';
}

function classSectionDisplay(enrollment) {
    const csg = enrollment?.class_section_group ?? enrollment?.classSectionGroup;
    const cs = csg?.class_section ?? csg?.classSection;
    if (!cs) return '';
    const cls = cs.class?.name ?? '';
    const sec = cs.section?.name ?? '';
    return [cls, sec].filter(Boolean).join(' - ') || '';
}

function applicantName(leave) {
    const enrollment = leave?.student_enrollment ?? leave?.studentEnrollment;
    if (enrollment?.student) {
        return studentName(enrollment.student);
    }
    if (leave?.teacher?.user) return leave.teacher.user.name;
    if (leave?.employee?.user) return leave.employee.user.name;
    return '—';
}

function applicantType(leave) {
    if (leave?.student_enrollment_id) return 'Student';
    if (leave?.teacher_id) return 'Teacher';
    if (leave?.employee_id) return 'Employee';
    return '—';
}

function formatDate(dateStr) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function LeaveShow(props) {
    const page = usePage();
    const leave = props.leave ?? page.props.leave;
    const teachers = props.teachers ?? page.props.teachers ?? [];
    const { flash } = page.props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [note, setNote] = useState('');
    const [substituteTeacherId, setSubstituteTeacherId] = useState('');

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const handleApprove = () => {
        const payload = { note };
        if (leave.teacher_id && substituteTeacherId) {
            payload.substitute_teacher_id = substituteTeacherId;
        }
        router.post(route('leaves.approve', leave.id), payload, {
            onSuccess: () => {
                setShowApproveModal(false);
                setSubstituteTeacherId('');
            },
        });
    };

    const handleReject = () => {
        router.post(route('leaves.reject', leave.id), {
            note: note,
            onSuccess: () => setShowRejectModal(false),
        });
    };

    const handleDelete = () => {
        if (!window.confirm('Are you sure you want to delete this leave application?')) return;
        router.delete(route('leaves.destroy', leave.id), {
            onSuccess: () => router.get(route('leaves.index')),
        });
    };

    if (!leave) {
        return (
            <AuthenticatedLayout>
                <div className="py-8 max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <p className="text-gray-600">Leave not found.</p>
                    <Link href={route('leaves.index')} className="text-amber-600 hover:underline mt-2 inline-block">Back to list</Link>
                </div>
            </AuthenticatedLayout>
        );
    }

    const enrollment = leave.student_enrollment ?? leave.studentEnrollment;
    const classSectionLabel = enrollment ? classSectionDisplay(enrollment) : '';
    const canEdit = leave.status === 'pending';
    const canApprove = leave.status === 'pending';

    return (
        <AuthenticatedLayout>
            <Head title="Leave Application Details" />
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
                            { label: 'Leave Applications', href: route('leaves.index') },
                            { label: 'Leave Details' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Leave Application Details</h1>
                                <p className="text-sm text-gray-500 mt-0.5">View and manage leave request.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('leaves.index')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            {canEdit && (
                                <>
                                    <Link
                                        href={route('leaves.edit', leave.id)}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
                                    >
                                        <FontAwesomeIcon icon={faPen} className="text-sm" /> Edit
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={handleDelete}
                                        className="inline-flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                    >
                                        <FontAwesomeIcon icon={faTrashCan} className="text-sm" /> Delete
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 mb-6">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Application Information</h2>
                                <p className="text-sm text-gray-500 mt-0.5">ID: #{leave.id}</p>
                            </div>
                            <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusBadge(leave.status)}`}>
                                {(leave.status ?? '').charAt(0).toUpperCase() + (leave.status ?? '').slice(1)}
                            </span>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Applicant Name</label>
                                <p className="text-gray-900 font-medium">{applicantName(leave)}</p>
                                {classSectionLabel && (
                                    <p className="text-sm text-gray-500 mt-0.5">{classSectionLabel}</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Applicant Type</label>
                                <p className="text-gray-900">{applicantType(leave)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Leave Type</label>
                                <p className="text-gray-900">{leave.leave_type?.name ?? '—'}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Total Days</label>
                                <p className="text-gray-900">{leave.total_days} day(s)</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">Start Date</label>
                                <p className="text-gray-900">{formatDate(leave.start_date)}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-500 mb-1">End Date</label>
                                <p className="text-gray-900">{formatDate(leave.end_date)}</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-500 mb-1">Reason</label>
                                <p className="text-gray-900">{leave.reason || 'No reason provided'}</p>
                            </div>
                        </div>

                        {leave.leave_type?.is_paid !== undefined && (
                            <div className="mt-6 pt-6 border-t border-gray-200">
                                <span className={`px-2 py-1 text-xs rounded ${leave.leave_type.is_paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                    {leave.leave_type.is_paid ? 'Paid Leave' : 'Unpaid Leave'}
                                </span>
                            </div>
                        )}
                    </div>

                    {leave.leave_days && leave.leave_days.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Leave Dates</h2>
                            <div className="flex flex-wrap gap-2">
                                {leave.leave_days.map((day) => (
                                    <div
                                        key={day.id}
                                        className={`px-3 py-2 rounded-lg text-sm ${day.is_half_day ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-700'}`}
                                    >
                                        {day.leave_date}
                                        {day.is_half_day && <span className="ml-1">(Half Day)</span>}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {leave.leave_approvals && leave.leave_approvals.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Approval History</h2>
                            <div className="space-y-4">
                                {leave.leave_approvals.map((approval) => (
                                    <div key={approval.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${approval.status === 'approved' ? 'bg-green-100' : 'bg-red-100'}`}>
                                            <FontAwesomeIcon 
                                                icon={approval.status === 'approved' ? faCheck : faTimes} 
                                                className={`text-sm ${approval.status === 'approved' ? 'text-green-600' : 'text-red-600'}`} 
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium text-gray-900">{approval.approver?.name ?? 'Unknown'}</span>
                                                <span className={`px-2 py-0.5 text-xs rounded ${approval.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {((approval.status ?? '').charAt(0).toUpperCase() + (approval.status ?? '').slice(1)) || '—'}
                                                </span>
                                            </div>
                                            {approval.note && (
                                                <p className="text-sm text-gray-600 mt-1">{approval.note}</p>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {approval.approved_at ? new Date(approval.approved_at).toLocaleString() : '—'}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {canApprove && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
                            <div className="flex flex-wrap gap-3">
                                <button
                                    onClick={() => setShowApproveModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    <FontAwesomeIcon icon={faCheck} /> Approve
                                </button>
                                <button
                                    onClick={() => setShowRejectModal(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                >
                                    <FontAwesomeIcon icon={faTimes} /> Reject
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Approve Modal */}
            {showApproveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Approve Leave</h2>
                            <button onClick={() => setShowApproveModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Note (optional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                rows={3}
                                placeholder="Add a note for this approval..."
                            />
                        </div>
                        {leave.teacher_id && teachers.length > 0 && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Substitute teacher (optional)</label>
                                <select
                                    value={substituteTeacherId}
                                    onChange={(e) => setSubstituteTeacherId(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                >
                                    <option value="">— Auto-assign or cancel —</option>
                                    {teachers
                                        .filter((t) => t.id !== leave.teacher_id)
                                        .map((t) => (
                                            <option key={t.id} value={t.id}>
                                                {t.name}
                                            </option>
                                        ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">If left empty, system will try to find an available substitute or mark class cancelled.</p>
                            </div>
                        )}
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowApproveModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApprove}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                            >
                                Approve
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">Reject Leave</h2>
                            <button onClick={() => setShowRejectModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Reason (optional)</label>
                            <textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                rows={3}
                                placeholder="Add a reason for rejection..."
                            />
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowRejectModal(false)}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleReject}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

