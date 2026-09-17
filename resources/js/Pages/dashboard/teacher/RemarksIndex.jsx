import React, { useState } from 'react';
import {Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare, faFilter } from '@fortawesome/free-solid-svg-icons';

export default function RemarksIndex({ remarks, classSectionGroups = [], remarkTypes = [], filters = {} }) {
    const [filterState, setFilterState] = useState({
        class_section_group_id: filters.class_section_group_id ?? '',
        type: filters.type ?? '',
    });
    const { flash } = usePage().props;

    const applyFilters = (e) => {
        e?.preventDefault();
        router.get(route('teacher.remarks.index'), filterState, { preserveState: true });
    };

    const deleteRemark = (r) => {
        if (confirm('Delete this remark?')) {
            router.delete(route('teacher.remarks.destroy', r.id));
        }
    };

    const studentName = (r) => {
        const en = r.student_enrollment;
        const st = en?.student;
        return st?.full_name ?? st?.user?.name ?? '—';
    };

    const classLabel = (r) => {
        const g = r.student_enrollment?.class_section_group;
        if (!g) return '—';
        const cs = g.class_section;
        return [cs?.class?.name, cs?.section?.name].filter(Boolean).join(' · ') || '—';
    };

    const typeLabel = (type) => remarkTypes.find((t) => t.value === type)?.label ?? type;

    const list = remarks?.data ?? [];
    const total = remarks?.total ?? list.length;

    return (
        <AuthenticatedLayout>
            <Head title="Student Remarks" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Page Title - same as Materials / RemarksCreate */}
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faPenToSquare} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <Link href={route('dashboard.teacher')} className="text-gray-500 hover:text-gray-700 text-sm font-medium">← Dashboard</Link>
                                <h1 className="text-2xl font-bold text-gray-900 mt-2">Student Remarks / Discipline</h1>
                                <p className="text-sm text-gray-500 mt-0.5">View and add behavior remarks, warnings, parent meeting notes.</p>
                            </div>
                        </div>
                        <Link
                            href={route('teacher.remarks.create')}
                            className="inline-flex items-center px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-sm"
                        >
                            Add Remark
                        </Link>
                    </div>

                    {flash?.success && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-green-50 text-green-800 border border-green-200">{flash.success}</div>
                    )}
                    {flash?.error && (
                        <div className="mb-4 px-4 py-3 rounded-lg bg-red-50 text-red-800 border border-red-200">{flash.error}</div>
                    )}

                    {/* Filters Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <form onSubmit={applyFilters} className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class</label>
                                    <select
                                        value={filterState.class_section_group_id}
                                        onChange={(e) => setFilterState((s) => ({ ...s, class_section_group_id: e.target.value }))}
                                        className="min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="">All classes</option>
                                        {classSectionGroups.map((g) => (
                                            <option key={g.id} value={g.id}>{g.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select
                                        value={filterState.type}
                                        onChange={(e) => setFilterState((s) => ({ ...s, type: e.target.value }))}
                                        className="min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="">All types</option>
                                        {remarkTypes.map((t) => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                Filter
                            </button>
                        </form>
                    </div>

                    {/* Table card */}
                    <div className="bg-white overflow-hidden rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)]">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Remarks</h2>
                            <p className="text-sm text-gray-500 mt-0.5">{total} remark{total !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Remark</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Recorded by</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No remarks found.</td>
                                        </tr>
                                    ) : (
                                        list.map((r) => (
                                            <tr key={r.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{studentName(r)}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{classLabel(r)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                                        r.type === 'warning' ? 'bg-amber-100 text-amber-800' :
                                                        r.type === 'behavior' ? 'bg-orange-100 text-orange-800' :
                                                        r.type === 'parent_meeting' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                        {typeLabel(r.type)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600 max-w-md">{r.body}</td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{r.remark_date ?? '—'}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{r.recorded_by_user?.name ?? '—'}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <button type="button" onClick={() => deleteRemark(r)} className="text-red-600 hover:text-red-800 font-medium">Delete</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {remarks?.links?.length > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex gap-2 flex-wrap justify-end">
                                {remarks.links.map((link, i) => (
                                    link.url ? (
                                        <Link key={i} href={link.url} preserveState className={`px-3 py-1.5 rounded-lg text-sm font-medium ${link.active ? 'bg-amber-500 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                    ) : (
                                        <span key={i} className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed" dangerouslySetInnerHTML={{ __html: link.label }} />
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