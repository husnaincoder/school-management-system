import React, { useState, useEffect } from 'react';
import {Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faCalendarDays, faFilter, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function LeaveBalancesIndex({ balances, leaveTypes = [], years = [], teachers = [], employees = [], filters = {} }) {
    const { flash } = usePage().props;
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedYear, setSelectedYear] = useState(filters.year ?? '');
    const [selectedLeaveType, setSelectedLeaveType] = useState(filters.leave_type_id ?? '');

    const [formData, setFormData] = useState({
        leave_type_id: '',
        applicant_type: 'teacher',
        teacher_id: '',
        employee_id: '',
        year: new Date().getFullYear(),
        total_days: '',
    });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const applyFilters = () => {
        router.get(route('leave-balances.index'), {
            year: selectedYear || undefined,
            leave_type_id: selectedLeaveType || undefined,
        }, { preserveState: true });
    };

    const clearFilters = () => {
        setSelectedYear('');
        setSelectedLeaveType('');
        router.get(route('leave-balances.index'));
    };

    const openAddModal = () => {
        setEditingItem(null);
        setFormData({
            leave_type_id: '',
            applicant_type: 'teacher',
            teacher_id: '',
            employee_id: '',
            year: new Date().getFullYear(),
            total_days: '',
        });
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setFormData({
            leave_type_id: String(item.leave_type_id),
            applicant_type: item.teacher_id ? 'teacher' : 'employee',
            teacher_id: item.teacher_id ? String(item.teacher_id) : '',
            employee_id: item.employee_id ? String(item.employee_id) : '',
            year: item.year,
            total_days: String(item.total_days),
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            leave_type_id: formData.leave_type_id,
            applicant_type: formData.applicant_type,
            teacher_id: formData.applicant_type === 'teacher' ? formData.teacher_id : null,
            employee_id: formData.applicant_type === 'employee' ? formData.employee_id : null,
            year: parseInt(formData.year, 10),
            total_days: parseInt(formData.total_days, 10),
        };

        if (editingItem) {
            router.put(route('leave-balances.update', editingItem.id), {
                total_days: payload.total_days,
                onSuccess: () => {
                    setShowModal(false);
                    setEditingItem(null);
                },
            });
        } else {
            router.post(route('leave-balances.store'), {
                ...payload,
                onSuccess: () => {
                    setShowModal(false);
                },
            });
        }
    };

    const data = balances?.data ?? [];
    const pagination = balances?.links ?? [];

    const getPersonName = (item) => {
        if (item.teacher?.user) return item.teacher.user.name;
        if (item.employee?.user) return item.employee.user.name;
        return '—';
    };

    const getPersonType = (item) => {
        if (item.teacher_id) return 'Teacher';
        if (item.employee_id) return 'Employee';
        return '—';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Leave Balances" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div
                            className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            role="alert"
                        >
                            {banner.message}
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Leave Management', href: route('admin.leave-management') },
                            { label: 'Leave Balances' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faCalendarDays} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Leave Balances</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage leave balances for teachers and employees.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.leave-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} /> Add Balance
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-4 mb-6">
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-2">
                                <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                                <span className="text-sm font-medium text-gray-700">Filters:</span>
                            </div>
                            <div className="flex flex-wrap gap-4 flex-1">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Year</label>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => setSelectedYear(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="">All Years</option>
                                        {(years || []).map((y) => (
                                            <option key={y} value={y}>{y}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Leave Type</label>
                                    <select
                                        value={selectedLeaveType}
                                        onChange={(e) => setSelectedLeaveType(e.target.value)}
                                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm min-w-[150px] bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                    >
                                        <option value="">All Types</option>
                                        {(leaveTypes || []).map((lt) => (
                                            <option key={lt.id} value={lt.id}>{lt.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex items-end gap-2">
                                    <button
                                        onClick={applyFilters}
                                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm rounded-lg font-medium transition-colors"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        onClick={clearFilters}
                                        className="px-3 py-1.5 bg-gray-200 text-gray-700 text-sm rounded-md hover:bg-gray-300"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Used</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {data.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                                                No leave balances found.
                                            </td>
                                        </tr>
                                    ) : (
                                        data.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{getPersonName(item)}</td>
                                                <td className="px-6 py-4 text-gray-600">{getPersonType(item)}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.leave_type?.name ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.year}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.total_days}</td>
                                                <td className="px-6 py-4 text-gray-600">{item.used_days}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`font-medium ${item.remaining_days > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                        {item.remaining_days}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button
                                                        onClick={() => openEditModal(item)}
                                                        className="text-amber-500 hover:text-amber-600"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {pagination.length > 3 && (
                            <div className="px-6 py-3 border-t border-gray-200 flex flex-wrap gap-2">
                                {pagination.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-amber-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                {editingItem ? 'Edit Leave Balance' : 'Add Leave Balance'}
                            </h2>
                            <button
                                onClick={() => {
                                    setShowModal(false);
                                    setEditingItem(null);
                                }}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {!editingItem && (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Leave Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.leave_type_id}
                                                onChange={(e) => setFormData({ ...formData, leave_type_id: e.target.value })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                required
                                            >
                                                <option value="">Select leave type</option>
                                                {(leaveTypes || []).map((lt) => (
                                                    <option key={lt.id} value={lt.id}>{lt.name}</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Person Type <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.applicant_type}
                                                onChange={(e) => setFormData({ ...formData, applicant_type: e.target.value, teacher_id: '', employee_id: '' })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                            >
                                                <option value="teacher">Teacher</option>
                                                <option value="employee">Employee</option>
                                            </select>
                                        </div>

                                        {formData.applicant_type === 'teacher' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Teacher</label>
                                                <select
                                                    value={formData.teacher_id}
                                                    onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                    required
                                                >
                                                    <option value="">Select teacher</option>
                                                    {(teachers || []).map((t) => (
                                                        <option key={t.id} value={t.id}>{t.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        {formData.applicant_type === 'employee' && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Employee</label>
                                                <select
                                                    value={formData.employee_id}
                                                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                                                    className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                    required
                                                >
                                                    <option value="">Select employee</option>
                                                    {(employees || []).map((e) => (
                                                        <option key={e.id} value={e.id}>{e.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Year <span className="text-red-500">*</span>
                                            </label>
                                            <select
                                                value={formData.year}
                                                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value, 10) })}
                                                className="w-full border border-gray-300 rounded-md px-3 py-2"
                                                required
                                            >
                                                {(years || []).map((y) => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Total Days <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.total_days}
                                        onChange={(e) => setFormData({ ...formData, total_days: e.target.value })}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        placeholder="e.g. 12"
                                        required
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setEditingItem(null);
                                    }}
                                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">
                                    {editingItem ? 'Update' : 'Save'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}

