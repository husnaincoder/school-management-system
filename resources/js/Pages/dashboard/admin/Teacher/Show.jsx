import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faArrowLeft, faPen, faTrashCan } from '@fortawesome/free-solid-svg-icons';

export default function TeacherShow({ teacher }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const user = teacher?.user ?? {};
    const qualifications = teacher?.qualifications ?? [];

    const handleDelete = () => {
        if (!teacher?.id) return;
        router.delete(route('admin.teachers.destroy', teacher.id), {
            preserveScroll: true,
            onSuccess: () => setShowDeleteConfirm(false),
        });
    };

    const formatDate = (value) => {
        if (!value) return '—';
        const d = new Date(value);
        if (Number.isNaN(d.getTime())) return value;
        return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
    };

    const storageUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        return `/storage/${String(path).replace(/^\/+/, '')}`;
    };

    const isImagePath = (path) => /\.(jpe?g|png|gif|webp)$/i.test(String(path));

    const documentPreview = (path, label) => {
        if (!path) return <span className="text-gray-400">—</span>;
        const url = storageUrl(path);
        const fileName = String(path).split('/').pop();

        return (
            <div className="space-y-2">
                {isImagePath(path) ? (
                    <a href={url} target="_blank" rel="noopener noreferrer">
                        <img
                            src={url}
                            alt={label}
                            className="max-h-44 w-auto rounded-lg border border-gray-200 object-contain bg-gray-50"
                        />
                    </a>
                ) : null}
                <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex text-amber-600 hover:text-amber-700 hover:underline font-medium text-sm"
                >
                    {isImagePath(path) ? 'Open full size' : fileName || 'View / Download'}
                </a>
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'User Management', href: route('admin.user-management') },
                            { label: 'Teachers', href: route('admin.teachers') },
                            { label: 'Teacher Details' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChalkboardTeacher} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Teacher Details</h1>
                                <p className="text-sm text-gray-500 mt-0.5">{user.name ?? '—'}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                        <Link href={route('admin.teachers')} className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            </Link>
                            <Link href={route('admin.teachers.edit', teacher.id)} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium">
                                <FontAwesomeIcon icon={faPen} className="text-sm" /> 
                            </Link>
                            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
                                <FontAwesomeIcon icon={faTrashCan} className="text-sm" /> 
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden divide-y divide-gray-200">
                        <section className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">User Account</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div><dt className="text-gray-500 font-medium">Name</dt><dd className="text-gray-900 mt-0.5">{user.name ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">ID Card Number</dt><dd className="text-gray-900 mt-0.5">{user.id_card_number ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Email</dt><dd className="text-gray-900 mt-0.5">{user.email ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Phone</dt><dd className="text-gray-900 mt-0.5">{user.phone ?? '—'}</dd></div>
                            </dl>
                        </section>

                        <section className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Basic Info</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div><dt className="text-gray-500 font-medium">Staff ID</dt><dd className="text-gray-900 mt-0.5">{teacher.staff_id ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Department</dt><dd className="text-gray-900 mt-0.5">{teacher.department ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Designation</dt><dd className="text-gray-900 mt-0.5">{teacher.designation ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Joining Date</dt><dd className="text-gray-900 mt-0.5">{formatDate(teacher.joining_date)}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Specialization</dt><dd className="text-gray-900 mt-0.5">{teacher.specialization ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Basic Salary</dt><dd className="text-gray-900 mt-0.5">{teacher.basic_salary ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Status</dt><dd className="text-gray-900 mt-0.5">{teacher.status ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Active</dt><dd className="text-gray-900 mt-0.5">
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${teacher.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {teacher.is_active ? 'Yes' : 'No'}
                                    </span>
                                </dd></div>
                            </dl>
                        </section>

                        <section className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Documents</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6 text-sm">
                                <div><dt className="text-gray-500 font-medium mb-2">CV</dt><dd>{documentPreview(teacher.cv, 'CV')}</dd></div>
                                <div><dt className="text-gray-500 font-medium mb-2">ID Card Front</dt><dd>{documentPreview(teacher.id_card_front, 'ID Card Front')}</dd></div>
                                <div><dt className="text-gray-500 font-medium mb-2">ID Card Back</dt><dd>{documentPreview(teacher.id_card_back, 'ID Card Back')}</dd></div>
                                <div><dt className="text-gray-500 font-medium mb-2">Photo</dt><dd>{documentPreview(teacher.photo, 'Photo')}</dd></div>
                            </dl>
                        </section>

                        <section className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Contact & Address</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div className="sm:col-span-2"><dt className="text-gray-500 font-medium">Address</dt><dd className="text-gray-900 mt-0.5">{teacher.address ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Emergency Contact</dt><dd className="text-gray-900 mt-0.5">{teacher.emergency_contact ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Emergency Phone</dt><dd className="text-gray-900 mt-0.5">{teacher.emergency_phone ?? '—'}</dd></div>
                            </dl>
                        </section>

                        <section className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Experience</h2>
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{teacher.experience ?? '—'}</p>
                        </section>

                        <section className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Qualifications</h2>
                            {qualifications.length === 0 ? (
                                <p className="text-sm text-gray-500">No qualifications added.</p>
                            ) : (
                                <div className="overflow-x-auto rounded-lg border border-gray-200">
                                    <table className="min-w-full text-sm divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Degree</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Field</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Board / University</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade / Division</th>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Certificate</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {qualifications.map((q, idx) => (
                                                <tr key={idx}>
                                                    <td className="px-4 py-3">{q.degree_name ?? '—'}</td>
                                                    <td className="px-4 py-3">{q.field_of_study ?? '—'}</td>
                                                    <td className="px-4 py-3">{q.board_university ?? '—'}</td>
                                                    <td className="px-4 py-3">{q.passing_year ?? '—'}</td>
                                                    <td className="px-4 py-3">{q.grade_division ?? '—'}</td>
                                                    <td className="px-4 py-3">{documentPreview(q.certificate_image, 'Certificate')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </div>

            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl p-6 max-w-sm w-full shadow-lg">
                        <p className="text-gray-700 mb-4">Are you sure you want to delete this teacher?</p>
                        <div className="flex justify-end gap-3">
                            <button type="button" onClick={() => setShowDeleteConfirm(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">Cancel</button>
                            <button type="button" onClick={handleDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
