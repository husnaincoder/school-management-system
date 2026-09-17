import React, { useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate, faArrowLeft, faPen, faTrashCan, faClipboardList } from '@fortawesome/free-solid-svg-icons';

function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section ?? csg.classSection;
    const session = cs?.academic_session?.name ?? cs?.academicSession?.name ?? '';
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [session, cls, sec, grp].filter(Boolean).join(' · ') || csg.id;
}

function statusBadge(status) {
    const styles = {
        active: 'bg-green-50 text-green-800 border-green-200',
        promoted: 'bg-blue-50 text-blue-800 border-blue-200',
        left: 'bg-gray-100 text-gray-700 border-gray-200',
    };
    return (
        <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-semibold border capitalize ${styles[status] ?? 'bg-amber-50 text-amber-800 border-amber-200'}`}>
            {status ?? '—'}
        </span>
    );
}

export default function StudentShow({ student }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const user = student?.user ?? {};
    const parent = student?.parent;
    const enrollment = student?.enrollment;
    const group = enrollment?.class_section_group ?? enrollment?.classSectionGroup;
    const fullName = [student?.first_name, student?.last_name].filter(Boolean).join(' ') || user.name || '—';
    const rollNumber = enrollment?.roll_number ?? student?.admission_number ?? '—';

    const handleDelete = () => {
        if (!student?.id) return;
        router.delete(route('academic.students.destroy', student.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteConfirm(false);
                router.visit(route('academic.students'));
            },
        });
    };

    const formatDate = (value) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const Field = ({ label, value, className = '' }) => (
        <div className={className}>
            <dt className="text-gray-500 font-medium text-sm">{label}</dt>
            <dd className="text-gray-900 mt-0.5 text-sm">{value ?? '—'}</dd>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Student Details" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGraduate} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Details</h1>
                                <p className="text-sm text-gray-500 mt-0.5">{fullName}{rollNumber !== '—' ? ` · ${rollNumber}` : ''}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link
                                href={route('academic.students')}
                                className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                            </Link>
                            <Link
                                href={route('academic.students.edit', student.id)}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
                            >
                                <FontAwesomeIcon icon={faPen} className="text-xs" />
                                
                            </Link>
                            <button
                                type="button"
                                onClick={() => setShowDeleteConfirm(true)}
                                className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm"
                            >
                                <FontAwesomeIcon icon={faTrashCan} className="text-xs" />
                                
                            </button>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 h-full">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">User Account</h2>
                                <p className="text-sm text-gray-500 mb-4">Role: <span className="font-medium text-amber-600">Student</span></p>
                                <dl className="grid grid-cols-1 gap-4">
                                    <Field label="Name" value={user.name} />
                                    <Field label="ID Card Number" value={user.id_card_number} />
                                    <Field label="Email" value={user.email || '—'} />
                                    <Field label="Phone" value={user.phone} />
                                </dl>
                            </div>

                            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 h-full">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Student Profile</h2>
                                <div className="flex flex-wrap gap-6 items-start mb-4">
                                    {student?.profile_photo ? (
                                        <img
                                            src={`/storage/${student.profile_photo}`}
                                            alt={fullName}
                                            className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shrink-0"
                                        />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-xl font-semibold text-gray-500 shrink-0">
                                            {fullName.charAt(0) || '?'}
                                        </div>
                                    )}
                                </div>
                                <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Field label="First Name" value={student?.first_name} />
                                    <Field label="Last Name" value={student?.last_name} />
                                    <Field label="CNIC / B-Form" value={student?.cnic} />
                                    <Field label="Date of Birth" value={formatDate(student?.date_of_birth)} />
                                    <Field label="Gender" value={student?.gender} />
                                    <Field label="Parent" value={
                                        parent?.user?.name
                                            ? `${parent.user.name}${parent.user.id_card_number ? ` · ${parent.user.id_card_number}` : ''}`
                                            : '—'
                                    } />
                                    {parent?.user?.phone && (
                                        <Field label="Parent Phone" value={parent.user.phone} />
                                    )}
                                    <Field label="Address" value={student?.address} className="md:col-span-2" />
                                </dl>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                    <FontAwesomeIcon icon={faClipboardList} className="text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Enrollment</h2>
                                    <p className="text-sm text-gray-500">Class section group and roll details.</p>
                                </div>
                            </div>
                            {enrollment ? (
                                <dl className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Field label="Class Section Group" value={groupLabel(group)} className="md:col-span-2" />
                                    <Field label="Admission / Roll Number" value={rollNumber} />
                                    <Field label="Admission Date" value={formatDate(enrollment.admission_date)} />
                                    <div>
                                        <dt className="text-gray-500 font-medium text-sm">Status</dt>
                                        <dd className="mt-1">{statusBadge(enrollment.status)}</dd>
                                    </div>
                                </dl>
                            ) : (
                                <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                                    This student is not enrolled in any class section group yet.
                                </p>
                            )}
                        </div>
                    </div>

                    {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Student</h2>
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to remove <strong>{fullName}</strong>? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setShowDeleteConfirm(false)} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">Cancel</button>
                                    <button type="button" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg">Delete</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
