import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { groupLabel } from '@/Components/Dashboard/ClassSectionGroupSelect';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGraduationCap, faPlus, faFilter, faTrashCan, faArrowLeft, faPen } from '@fortawesome/free-solid-svg-icons';

const filterSelectClass = 'min-w-[180px] w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

function studentName(student) {
    if (!student) return '—';
    const name = [student.first_name, student.last_name].filter(Boolean).join(' ');
    return name || student.user?.name || student.user?.email || '—';
}

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function PromotionsIndex({
    promotions = [],
    classSectionGroups = [],
    filterStudents = [],
    filters = {},
}) {
    const [deletePromotion, setDeletePromotion] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const list = promotions?.data ?? promotions ?? [];
    const pagination = promotions?.links ? { ...promotions, data: undefined } : null;
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const studentOptions = Array.isArray(filterStudents) ? filterStudents : [];
    const { flash } = usePage().props;

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const filterForm = useForm({
        student_id: filters.student_id ?? '',
        class_section_group_id: filters.class_section_group_id ?? '',
    });

    const studentFilterOptions = useMemo(
        () => [
            { value: '', label: 'All students' },
            ...studentOptions.map((s) => ({
                value: String(s.id),
                label: s.name,
                searchText: s.name,
            })),
        ],
        [studentOptions]
    );

    const groupFilterOptions = useMemo(
        () => [
            { value: '', label: 'All groups' },
            ...groups.map((g) => {
                const label = groupLabel(g);
                return { value: String(g.id), label, searchText: label };
            }),
        ],
        [groups]
    );

    const submitFilters = (e) => {
        e?.preventDefault();
        const params = {};
        if (filterForm.data.student_id) params.student_id = filterForm.data.student_id;
        if (filterForm.data.class_section_group_id) params.class_section_group_id = filterForm.data.class_section_group_id;
        router.get(route('academic.promotions'), params, { preserveState: true });
    };

    const confirmDelete = () => {
        if (!deletePromotion) return;
        router.delete(route('academic.promotions.destroy', deletePromotion.id), {
            preserveScroll: true,
            onSuccess: () => setDeletePromotion(null),
        });
    };

    const total = promotions?.total ?? list.length;

    return (
        <AuthenticatedLayout>
            <Head title="Promotions" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-xl ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="alert">
                            {banner.message}
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Students & Enrollments', href: route('admin.students-enrollments') },
                            { label: 'Promotions' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faGraduationCap} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Promotions</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Record and view student promotions</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.students-enrollments')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <form onSubmit={submitFilters} className="flex flex-wrap items-end gap-4 justify-end">
                            <div className="min-w-[180px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                                <SearchableSelect
                                    options={studentFilterOptions}
                                    value={filterForm.data.student_id}
                                    onChange={(id) => filterForm.setData('student_id', id)}
                                    placeholder="Search student..."
                                    inputClassName={filterSelectClass}
                                />
                            </div>
                            <div className="min-w-[220px]">
                                <label className="block text-sm font-medium text-gray-700 mb-1">To group</label>
                                <SearchableSelect
                                    options={groupFilterOptions}
                                    value={filterForm.data.class_section_group_id}
                                    onChange={(id) => filterForm.setData('class_section_group_id', id)}
                                    placeholder="Search group..."
                                    inputClassName={filterSelectClass}
                                />
                            </div>
                            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                Filter
                            </button>
                        </form>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Promotion Records</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {total} record{total !== 1 ? 's' : ''}</p>
                            </div>
                            <Link
                                href={route('academic.promotions.create')}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From (group)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To (group)</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Promoted by</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No promotion records. Click + to record a class promotion.</td>
                                        </tr>
                                    ) : (
                                        list.map((p) => (
                                            <tr key={p.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{studentName(p.student)}</td>
                                                <td className="px-6 py-4 text-sm">{groupLabel(p.from_enrollment?.class_section_group)}</td>
                                                <td className="px-6 py-4 text-sm">{groupLabel(p.to_class_section_group)}</td>
                                                <td className="px-6 py-4">{formatDate(p.promotion_date)}</td>
                                                <td className="px-6 py-4">{p.promoted_by_user?.name ?? '—'}</td>
                                                <td className="px-6 py-4 max-w-[200px] truncate" title={p.remarks ?? ''}>{p.remarks ?? '—'}</td>
                                                <td className="px-6 py-4">
                                                    <Link href={route('academic.promotions.edit', p.id)} className="text-amber-500 hover:text-amber-600 mr-3" title="Edit">
                                                        <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                    </Link>
                                                    <button type="button" onClick={() => setDeletePromotion(p)} className="text-red-500 hover:text-red-600" title="Delete">
                                                        <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.links && pagination.links.length > 0 && (
                            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-2 justify-end">
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
                    </div>

                    {deletePromotion && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-lg">
                                <h2 className="text-xl font-semibold text-gray-900 mb-2">Delete Promotion</h2>
                                <p className="text-gray-600 mb-4">
                                    Are you sure you want to remove this promotion record for <strong>{studentName(deletePromotion.student)}</strong>? This action cannot be undone.
                                </p>
                                <div className="flex justify-end gap-3">
                                    <button type="button" onClick={() => setDeletePromotion(null)} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">Cancel</button>
                                    <button type="button" onClick={confirmDelete} className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg">Delete</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
