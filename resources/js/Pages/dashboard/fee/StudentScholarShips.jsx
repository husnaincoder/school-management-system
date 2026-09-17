import React, { useState, useEffect } from 'react';
import {Head, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate, faTrashCan, faFilter, faPlus } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { student_enrollment_id: '', scholarship_id: '' };

export default function StudentScholarShips({
    assignments = {},
    scholarShips = [],
    enrollments = [],
    filterScholarshipId = '',
}) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, processing, errors, reset } = useForm(emptyForm);

    const list = assignments?.data ?? (Array.isArray(assignments) ? assignments : []);
    const pagination = assignments?.links ? { links: assignments.links } : null;

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const handleAssign = (e) => {
        e.preventDefault();
        post(route('student-scholarships.store'), {
            onSuccess: () => reset(),
        });
    };

    const handleRemove = (item) => {
        if (!window.confirm(`Remove scholarship "${item.scholarship?.name}" from this student?`)) return;
        router.delete(route('student-scholarships.destroy', item.id), { preserveScroll: true });
    };

    const applyFilter = (scholarshipId) => {
        const params = scholarshipId ? { scholarship_id: scholarshipId } : {};
        router.get(route('student-scholarships.index'), params, { preserveState: true });
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

                    <div className="mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGraduate} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Student Scholarships</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Assign scholarships to enrolled students. Each student can have multiple scholarships.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filter */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filter by scholarship
                        </h2>
                        <select
                            value={filterScholarshipId}
                            onChange={(e) => applyFilter(e.target.value)}
                            className="min-w-[220px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">All assignments</option>
                            {(scholarShips || []).map((s) => (
                                <option key={s.id} value={s.id}>
                                    {scholarshipLabel(s)}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Assign form */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faPlus} className="text-amber-500 w-4 h-4" />
                            Assign scholarship to student
                        </h2>
                        <form onSubmit={handleAssign} className="flex flex-wrap items-end gap-4">
                            <div className="min-w-[240px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student (enrollment)</label>
                                <select
                                    value={data.student_enrollment_id}
                                    onChange={(e) => setData('student_enrollment_id', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                        errors.student_enrollment_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select student</option>
                                    {(enrollments || []).map((e) => (
                                        <option key={e.id} value={e.id}>
                                            {e.student_name} · {e.class_display} (Roll: {e.roll_number ?? '—'})
                                        </option>
                                    ))}
                                </select>
                                {errors.student_enrollment_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.student_enrollment_id}</p>
                                )}
                            </div>
                            <div className="min-w-[200px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Scholarship</label>
                                <select
                                    value={data.scholarship_id}
                                    onChange={(e) => setData('scholarship_id', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm ${
                                        errors.scholarship_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Select scholarship</option>
                                    {(scholarShips || []).map((s) => (
                                        <option key={s.id} value={s.id}>
                                            {scholarshipLabel(s)}
                                        </option>
                                    ))}
                                </select>
                                {errors.scholarship_id && (
                                    <p className="text-red-500 text-sm mt-1">{errors.scholarship_id}</p>
                                )}
                            </div>
                            <button
                                type="submit"
                                disabled={processing || !data.student_enrollment_id || !data.scholarship_id}
                                className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                            >
                                Assign
                            </button>
                        </form>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Assignments</h2>
                            <p className="text-sm text-gray-500 mt-0.5">
                                {list.length} assignment{list.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Student
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Class
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Roll
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Scholarship
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No assignments yet. Use the form above to assign a scholarship to a student.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {item.student?.name ?? '—'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{item.class_display}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.roll_number ?? '—'}</td>
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
                                                        onClick={() => handleRemove(item)}
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
                        {pagination?.links && pagination.links.length > 3 && (
                            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-2 items-center">
                                {pagination.links.map((link, i) => (
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
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
