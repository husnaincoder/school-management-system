import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faClockRotateLeft, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = {
    class_section_group_id: '',
    student_enrollment_id: '',
    fee_type_id: '',
    date: new Date().toISOString().slice(0, 10),
    amount: '',
};

export default function OverTimeCharges({
    charges = {},
    classSectionGroups = [],
    enrollments = [],
    feeTypes = [],
    filterClassSectionGroupId = '',
}) {
    const { flash } = usePage().props;
    const list = charges?.data ?? (Array.isArray(charges) ? charges : []);
    const pagination = charges?.links ? { links: charges.links } : null;
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const feeTypesList = Array.isArray(feeTypes) ? feeTypes : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const enrollmentsForGroup = useMemo(() => {
        const gid = data.class_section_group_id ? String(data.class_section_group_id) : '';
        if (!gid) return [];
        return (enrollments || []).filter((e) => String(e.class_section_group_id) === gid);
    }, [enrollments, data.class_section_group_id]);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const openAddModal = () => {
        setEditingItem(null);
        setData({ ...emptyForm, date: new Date().toISOString().slice(0, 10) });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setData({
            class_section_group_id: item.class_section_group_id ?? '',
            student_enrollment_id: String(item.student_enrollment_id ?? ''),
            fee_type_id: String(item.fee_type_id ?? ''),
            date: item.date ?? new Date().toISOString().slice(0, 10),
            amount: item.amount ?? '',
        });
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
        reset();
    };

    const onGroupChange = (groupId) => {
        setData('class_section_group_id', groupId);
        setData('student_enrollment_id', '');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('over-time-charges.update', editingItem.id), {
                onSuccess: () => closeModal(),
            });
        } else {
            post(route('over-time-charges.store'), {
                onSuccess: () => closeModal(),
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Remove this over time charge (${item.fee_type?.name}, ${item.date}, ${item.amount})?`)) return;
        router.delete(route('over-time-charges.destroy', item.id), { preserveScroll: true });
    };

    const applyFilter = (value) => {
        const params = value ? { class_section_group_id: value } : {};
        router.get(route('over-time-charges.index'), params, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Over Time Charges" />
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
                            { label: 'Over Time Charges' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClockRotateLeft} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Over Time Charges</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Record extra charges per student (fee type, date, amount). Filter by class section group.
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

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <div className="flex flex-wrap items-center gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class Section Group</label>
                                <select
                                    value={filterClassSectionGroupId}
                                    onChange={(e) => applyFilter(e.target.value)}
                                    className="min-w-[280px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">All groups</option>
                                    {groups.map((g) => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 z-50 overflow-y-auto">
                            <div className="flex min-h-screen items-center justify-center p-4">
                                <div className="fixed inset-0 bg-black/50" onClick={closeModal} aria-hidden="true" />
                                <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                        {editingItem ? 'Edit Over Time Charge' : 'Add Over Time Charge'}
                                    </h3>
                                    <form onSubmit={handleSubmit} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Class Section Group *</label>
                                            <select
                                                value={data.class_section_group_id}
                                                onChange={(e) => onGroupChange(e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                required
                                            >
                                                <option value="">Select group</option>
                                                {groups.map((g) => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Student *</label>
                                            <select
                                                value={data.student_enrollment_id}
                                                onChange={(e) => setData('student_enrollment_id', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                required
                                            >
                                                <option value="">Select student</option>
                                                {enrollmentsForGroup.map((e) => (
                                                    <option key={e.id} value={e.id}>{e.name}</option>
                                                ))}
                                            </select>
                                            {errors.student_enrollment_id && <p className="text-red-500 text-xs mt-0.5">{errors.student_enrollment_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fee type *</label>
                                            <select
                                                value={data.fee_type_id}
                                                onChange={(e) => setData('fee_type_id', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                required
                                            >
                                                <option value="">Select fee type</option>
                                                {feeTypesList.map((ft) => (
                                                    <option key={ft.id} value={ft.id}>{ft.name}</option>
                                                ))}
                                            </select>
                                            {errors.fee_type_id && <p className="text-red-500 text-xs mt-0.5">{errors.fee_type_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                                            <input
                                                type="date"
                                                value={data.date}
                                                onChange={(e) => setData('date', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                required
                                            />
                                            {errors.date && <p className="text-red-500 text-xs mt-0.5">{errors.date}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                                                required
                                            />
                                            {errors.amount && <p className="text-red-500 text-xs mt-0.5">{errors.amount}</p>}
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <button
                                                type="submit"
                                                disabled={processing}
                                                className="px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50"
                                            >
                                                {editingItem ? 'Update' : 'Add'}
                                            </button>
                                            <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Charges</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Total: {list.length} charge{list.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Over Time Charge
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Section</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-sm text-gray-500">
                                                No over time charges yet. Click &quot;Add Over Time Charge&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((row) => (
                                            <tr key={row.id}>
                                                <td className="px-6 py-3 text-sm text-gray-900">{row.session}</td>
                                                <td className="px-6 py-3 text-sm text-gray-900">{row.class}</td>
                                                <td className="px-6 py-3 text-sm text-gray-900">{row.section}</td>
                                                <td className="px-6 py-3 text-sm text-gray-900">{row.enrollment_label}</td>
                                                <td className="px-6 py-3 text-sm text-gray-900">{row.fee_type?.name ?? '—'}</td>
                                                <td className="px-6 py-3 text-sm text-gray-900">{row.date}</td>
                                                <td className="px-6 py-3 text-sm text-right text-gray-900">{Number(row.amount)}</td>
                                                <td className="px-6 py-3 text-right">
                                                    <button type="button" onClick={() => openEditModal(row)} className="text-amber-600 hover:text-amber-700 mr-3" title="Edit">
                                                        <FontAwesomeIcon icon={faPen} />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(row)} className="text-red-600 hover:text-red-700" title="Delete">
                                                        <FontAwesomeIcon icon={faTrashCan} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.links && (
                            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-2">
                                {pagination.links.map((link, i) => (
                                    <a
                                        key={i}
                                        href={link.url ?? '#'}
                                        className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
