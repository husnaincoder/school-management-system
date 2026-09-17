import React from 'react';
import {Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons';

function studentName(student) {
    if (!student) return '—';
    const name = [student.first_name, student.last_name].filter(Boolean).join(' ');
    return name || student.user?.name || student.user?.email || '—';
}

function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section;
    const session = cs?.academic_session?.name ?? '';
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? '';
    return [session, cls, sec, grp].filter(Boolean).join(' · ') || csg.id;
}

export default function EnrollmentShow({ enrollment }) {
    const student = enrollment?.student;
    const group = enrollment?.class_section_group;
    const parent = student?.parent;

    return (
        <AuthenticatedLayout>
            <Head title="Enrollment Details" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold text-gray-900">Enrollment Detail</h1>
                        <Link
                            href={route('academic.enrollments')}
                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Enrollment</h2>
                            <p className="text-gray-500 mt-1">{studentName(student)} · {groupLabel(group)}</p>
                        </div>

                        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="md:col-span-1">
                                <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Student</h3>
                                <div className="flex items-start gap-4 mb-4">
                                    {student?.profile_photo ? (
                                        <img src={`/storage/${student.profile_photo}`} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-gray-200 shrink-0" />
                                    ) : (
                                        <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-500 shrink-0">
                                            {studentName(student).charAt(0) || '?'}
                                        </div>
                                    )}
                                    <dl className="space-y-2 text-sm flex-1 min-w-0">
                                        <div>
                                            <dt className="text-xs text-gray-500">Name</dt>
                                            <dd className="font-medium text-gray-900">{studentName(student)}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">Admission number</dt>
                                            <dd className="text-gray-900">{student?.admission_number ?? '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">Email</dt>
                                            <dd className="text-gray-900">{student?.user?.email ?? '—'}</dd>
                                        </div>
                                        <div>
                                            <dt className="text-xs text-gray-500">Phone</dt>
                                            <dd className="text-gray-900">{student?.user?.phone ?? '—'}</dd>
                                        </div>
                                    </dl>
                                </div>
                                <dl className="space-y-2 text-sm border-t border-gray-100 pt-4">
                                    {student?.id && (
                                        <div className="pt-2">
                                            <Link href={route('academic.students.show', student.id)} className="text-blue-500 hover:text-blue-700 text-sm">
                                                View full student profile →
                                            </Link>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div className="md:col-span-1 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6">
                                <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Parent / Guardian</h3>
                                <dl className="space-y-2 text-sm">
                                    <div>
                                        <dt className="text-xs text-gray-500">Name</dt>
                                        <dd className="font-medium text-gray-900">
                                            {parent?.user?.name ?? '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Relation with student</dt>
                                        <dd className="text-gray-900">{parent?.relation_with_student ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Parent CNIC</dt>
                                        <dd className="text-gray-900">
                                            {parent
                                                ? (parent.relation_with_student === 'Father'
                                                    ? (parent.father_cnic ?? '—')
                                                    : parent.relation_with_student === 'Mother'
                                                        ? (parent.spouse_cnic ?? '—')
                                                        : (parent.father_cnic || parent.spouse_cnic || '—'))
                                                : '—'}
                                        </dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Spouse name</dt>
                                        <dd className="text-gray-900">{parent?.spouse_name ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Spouse CNIC</dt>
                                        <dd className="text-gray-900">{parent?.spouse_cnic ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Email</dt>
                                        <dd className="text-gray-900">{parent?.user?.email ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Phone</dt>
                                        <dd className="text-gray-900">{parent?.user?.phone ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Address</dt>
                                        <dd className="text-gray-900">
                                            {[parent?.address, parent?.city, parent?.state, parent?.postal_code, parent?.country]
                                                .filter(Boolean)
                                                .join(', ') || '—'}
                                        </dd>
                                    </div>
                                    {parent?.id && (
                                        <div className="pt-2">
                                            <Link href={route('admin.parents.show', parent.id)} className="text-blue-500 hover:text-blue-700 text-sm">
                                                View full parent profile →
                                            </Link>
                                        </div>
                                    )}
                                </dl>
                            </div>

                            <div className="md:col-span-1 md:border-l border-gray-100 md:pl-6">
                                <h3 className="text-sm font-medium text-gray-500 uppercase mb-3">Enrollment details</h3>
                                <dl className="space-y-2">
                                    <div>
                                        <dt className="text-xs text-gray-500">Class · Section · Group</dt>
                                        <dd className="font-medium">{groupLabel(group)}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Roll number</dt>
                                        <dd>{enrollment?.roll_number ?? '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Admission date</dt>
                                        <dd>{enrollment?.admission_date ? enrollment.admission_date.split('T')[0] : '—'}</dd>
                                    </div>
                                    <div>
                                        <dt className="text-xs text-gray-500">Status</dt>
                                        <dd>
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                enrollment?.status === 'active' ? 'bg-green-100 text-green-800' :
                                                enrollment?.status === 'promoted' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {enrollment?.status ?? '—'}
                                            </span>
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
