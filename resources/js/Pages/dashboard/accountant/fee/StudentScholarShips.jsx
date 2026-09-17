import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate, faTrashCan, faPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { student_enrollment_id: '', scholarship_id: '' };

export default function StudentScholarShips({ assignments = {}, enrollments = [], scholarships = [] }) {
    const { flash } = usePage().props;
    const [showModal, setShowModal] = useState(false);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, processing, errors, reset } = useForm(emptyForm);

    const list = assignments?.data ?? (Array.isArray(assignments) ? assignments : []);
    const links = assignments?.links ?? [];

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const openAssignModal = () => {
        reset();
        setShowModal(true);
    };

    const handleAssign = (e) => {
        e.preventDefault();
        post(route('student-scholarships.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Remove scholarship "${item.scholarship?.name}" from this enrollment?`)) return;
        router.delete(route('student-scholarships.destroy', item.id), { preserveScroll: true });
    };

    const scholarshipLabel = (s) => {
        if (!s) return '—';
        return s.type === 'percentage' ? `${s.name} (${s.value}%)` : `${s.name} (${s.value})`;
    };

    return (
        <AuthenticatedLayout>
            <Head title="Student Scholarships" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div
                            className={`mb-4 px-4 py-3 rounded-lg ${
                                banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}
                            role="alert"
                        >
                            {banner.message}
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Student Scholarships' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGraduate} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Scholarships</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Assign scholarships to enrolled students. Each enrollment can have multiple scholarships.
                                </p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.accountant-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Total: {list.length} assignment{list.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openAssignModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Assign Scholarship
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Enrollment</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Scholarship</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="px-6 py-8 text-center text-gray-500">
                                                No assignments found. Click &quot;Assign Scholarship&quot; to add one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.enrollment_label || '—'}</td>
                                                <td className="px-6 py-4">
                                                    {item.scholarship ? (
                                                        <span className="px-2 py-0.5 text-xs rounded bg-[#2E3D50] text-white">
                                                            {scholarshipLabel(item.scholarship)}
                                                        </span>
                                                    ) : (
                                                        '—'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(item)}
                                                        className="text-red-500 hover:text-red-600"
                                                    >
                                                        <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {links.length > 3 && (
                            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-2 items-center">
                                {links.map((link, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`px-3 py-1 rounded text-sm ${
                                            link.active
                                                ? 'bg-amber-500 text-white'
                                                : link.url
                                                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                  : 'bg-gray-50 text-gray-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {link.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Assign Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Assign Scholarship</h2>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); reset(); }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleAssign}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Enrollment</label>
                                            <select
                                                className={`w-full border rounded-md px-3 py-2 ${errors.student_enrollment_id ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.student_enrollment_id}
                                                onChange={(e) => setData('student_enrollment_id', e.target.value)}
                                            >
                                                <option value="">Select enrollment</option>
                                                {(enrollments || []).map((e) => (
                                                    <option key={e.id} value={e.id}>{e.name}</option>
                                                ))}
                                            </select>
                                            {errors.student_enrollment_id && (
                                                <p className="text-red-500 text-sm mt-1">{errors.student_enrollment_id}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Scholarship</label>
                                            <select
                                                className={`w-full border rounded-md px-3 py-2 ${errors.scholarship_id ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.scholarship_id}
                                                onChange={(e) => setData('scholarship_id', e.target.value)}
                                            >
                                                <option value="">Select scholarship</option>
                                                {(scholarships || []).map((s) => (
                                                    <option key={s.id} value={s.id}>{scholarshipLabel(s)}</option>
                                                ))}
                                            </select>
                                            {errors.scholarship_id && (
                                                <p className="text-red-500 text-sm mt-1">{errors.scholarship_id}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); reset(); }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
                                            Assign
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
