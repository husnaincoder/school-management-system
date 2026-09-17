import React, { useState } from 'react';
import { Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGroup, faArrowLeft, faTrashCan } from '@fortawesome/free-solid-svg-icons';

export default function ParentShow({ parent }) {
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const name = parent?.user?.name ?? '—';

    const handleDelete = () => {
        if (!parent?.id) return;
        router.delete(route('admin.parents.destroy', parent.id), {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteConfirm(false);
                router.visit(route('admin.parents'));
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Page Title + Actions */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGroup} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Parent Details</h1>
                                <p className="text-sm text-gray-500 mt-0.5">{name} {parent?.user?.email ? `· ${parent.user.email}` : ''}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Link href={route('admin.parents')} className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" /> 
                            </Link>
                            <button type="button" onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">
                                <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden divide-y divide-gray-200">
                        <section className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">User & Relation</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div><dt className="text-gray-500 font-medium">Name</dt><dd className="text-gray-900 mt-0.5">{parent?.user?.name ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Email</dt><dd className="text-gray-900 mt-0.5">{parent?.user?.email ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Phone</dt><dd className="text-gray-900 mt-0.5">{parent?.user?.phone ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Relation with student</dt><dd className="text-gray-900 mt-0.5">{parent?.relation_with_student ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Guardian name</dt><dd className="text-gray-900 mt-0.5">{parent?.spouse_name ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Father CNIC</dt><dd className="text-gray-900 mt-0.5">{parent?.father_cnic ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Guardian CNIC</dt><dd className="text-gray-900 mt-0.5">{parent?.spouse_cnic ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Occupation</dt><dd className="text-gray-900 mt-0.5">{parent?.occupation ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Monthly income</dt><dd className="text-gray-900 mt-0.5">{parent?.monthly_income != null ? Number(parent.monthly_income).toLocaleString() : '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Status</dt><dd className="text-gray-900 mt-0.5">
                                    <span className={`inline-block px-2 py-0.5 text-xs rounded ${parent?.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                        {parent?.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </dd></div>
                            </dl>
                        </section>

                        <section className="p-6">
                            <h2 className="text-base font-semibold text-gray-900 mb-4">Address</h2>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                                <div className="sm:col-span-2"><dt className="text-gray-500 font-medium">Address</dt><dd className="text-gray-900 mt-0.5 whitespace-pre-wrap">{parent?.address ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">City</dt><dd className="text-gray-900 mt-0.5">{parent?.city ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">State</dt><dd className="text-gray-900 mt-0.5">{parent?.state ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Postal code</dt><dd className="text-gray-900 mt-0.5">{parent?.postal_code ?? '—'}</dd></div>
                                <div><dt className="text-gray-500 font-medium">Country</dt><dd className="text-gray-900 mt-0.5">{parent?.country ?? '—'}</dd></div>
                            </dl>
                        </section>

                        {parent?.students?.length > 0 && (
                            <section className="p-6">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Linked Students</h2>
                                <ul className="space-y-2">
                                    {parent.students.map((stu) => (
                                        <li key={stu.id}>
                                            <Link href={route('academic.students.show', stu.id)} className="text-amber-600 hover:text-amber-700 hover:underline font-medium">
                                                {[stu.first_name, stu.last_name].filter(Boolean).join(' ') || stu.user?.name} {stu.user?.email && `(${stu.user.email})`}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>

                    {/* Delete confirmation modal */}
                    {showDeleteConfirm && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Parent</h2>
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to remove this parent record? The user account will remain. This action cannot be undone.
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
