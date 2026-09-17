import React, { useState } from 'react';
import { Link, router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faChalkboardTeacher, faEye, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function TeacherIndex({ teachers, filters = {} }) {
    const [deleteTeacher, setDeleteTeacher] = useState(null);

    const teacherList = teachers?.data ?? teachers ?? [];
    const pagination = teachers?.links ? { ...teachers, data: undefined } : null;

    const filterForm = useForm({ search: filters.search ?? '' });
    const submitFilters = (e) => {
        e?.preventDefault();
        const params = {};
        if (filterForm.data.search) params.search = filterForm.data.search;
        router.get(route('admin.teachers'), params, { preserveState: true });
    };

    const confirmDelete = () => {
        if (!deleteTeacher) return;
        router.delete(route('admin.teachers.destroy', deleteTeacher.id), {
            preserveScroll: true,
            onSuccess: () => setDeleteTeacher(null),
        });
    };

    const total = teachers?.total ?? teacherList.length;

    return (
        <AuthenticatedLayout>
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'User Management', href: route('admin.user-management') },
                            { label: 'Teachers' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChalkboardTeacher} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Teacher Management</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage teachers and staff</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.user-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <Link
                                href={route('admin.teachers.create')}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                New
                            </Link>
                        </div>
                    </div>

                    {/* Filters Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <form onSubmit={submitFilters} className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <label htmlFor="teacher-search" className="text-sm font-medium text-gray-700 shrink-0">Search</label>
                                <input
                                    id="teacher-search"
                                    type="text"
                                    placeholder="Search by name, email, staff ID, department..."
                                    className="min-w-[240px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    value={filterForm.data.search}
                                    onChange={(e) => filterForm.setData('search', e.target.value)}
                                />
                            </div>
                            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                Filter
                            </button>
                        </form>
                    </div>

                    {/* Table card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Teachers</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Total: {total} teacher{total !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Staff ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {teacherList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No teachers found. Click &quot;Add Teacher&quot; to create one.</td>
                                    </tr>
                                ) : (
                                    teacherList.map((teacher) => (
                                        <tr key={teacher.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{teacher.user?.name}</div>
                                                <div className="text-sm text-gray-500">{teacher.user?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">{teacher.staff_id ?? '—'}</td>
                                            <td className="px-6 py-4">{teacher.department ?? '—'}</td>
                                            <td className="px-6 py-4">{teacher.designation ?? '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-xs rounded ${teacher.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {teacher.is_active ? (teacher.status || 'Active') : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={route('admin.teachers.show', teacher.id)} className="text-gray-500 hover:text-gray-700 mr-3" title="View"><FontAwesomeIcon icon={faEye} className="text-sm" /></Link>
                                                <Link href={route('admin.teachers.edit', teacher.id)} className="text-amber-500 hover:text-amber-600 mr-3" title="Edit"><FontAwesomeIcon icon={faPen} className="text-sm" /></Link>
                                                <button type="button" onClick={() => setDeleteTeacher(teacher)} className="text-red-500 hover:text-red-600" title="Delete"><FontAwesomeIcon icon={faTrashCan} className="text-sm" /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                        </div>
                    </div>

                    {pagination?.links && pagination.links.length > 0 && (
                        <div className="mt-4 flex justify-end gap-2 flex-wrap">
                            {pagination.links.map((link, i) => (
                                link.url ? (
                                    <Link key={i} href={link.url} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${link.active ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`} preserveState>
                                        {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                    </Link>
                                ) : (
                                    <span key={i} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed">
                                        {link.label.replace('&laquo;', '«').replace('&raquo;', '»')}
                                    </span>
                                )
                            ))}
                        </div>
                    )}

                    {deleteTeacher && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Teacher</h2>
                                <p className="text-gray-600 mb-4">Are you sure you want to delete <strong>{deleteTeacher.user?.name}</strong>? This action cannot be undone.</p>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setDeleteTeacher(null)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium">Cancel</button>
                                    <button type="button" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-medium">Delete</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
