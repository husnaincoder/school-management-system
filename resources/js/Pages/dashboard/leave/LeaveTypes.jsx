import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faTags, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = {
    name: '',
    is_paid: true,
    max_days: '',
    for_students: true,
    for_teachers: true,
    for_employees: true,
};

export default function LeaveTypesIndex({ leaveTypes = [] }) {
    const { flash } = usePage().props;
    const list = Array.isArray(leaveTypes) ? leaveTypes : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

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
        setData(emptyForm);
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setData({
            name: item.name || '',
            is_paid: item.is_paid ?? true,
            max_days: item.max_days != null ? String(item.max_days) : '',
            for_students: item.for_students ?? true,
            for_teachers: item.for_teachers ?? true,
            for_employees: item.for_employees ?? true,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = {
            name: data.name,
            is_paid: data.is_paid,
            max_days: data.max_days === '' ? null : parseInt(data.max_days, 10),
            for_students: data.for_students,
            for_teachers: data.for_teachers,
            for_employees: data.for_employees,
        };
        if (editingItem) {
            put(route('leave-types.update', editingItem.id), {
                ...payload,
                onSuccess: () => {
                    setShowModal(false);
                    setEditingItem(null);
                    reset();
                },
            });
        } else {
            post(route('leave-types.store'), {
                ...payload,
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete leave type "${item.name}"?`)) return;
        router.delete(route('leave-types.destroy', item.id), {
            preserveScroll: true,
        });
    };

    const yesNo = (v) => (v ? 'Yes' : 'No');
    const appliesTo = (item) => {
        const parts = [];
        if (item.for_students) parts.push('Students');
        if (item.for_teachers) parts.push('Teachers');
        if (item.for_employees) parts.push('Employees');
        return parts.length ? parts.join(', ') : '—';
    };

    return (
        <AuthenticatedLayout>
            <Head title="Leave Types" />
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
                            { label: 'Leave Types' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faTags} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Leave Types</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage leave types (Sick, Casual, etc.) for students, teachers and employees.</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.leave-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Leave Types</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} type{list.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Leave Type
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max days</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Applies to</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                                No leave types yet. Click &quot;Add Leave Type&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${item.is_paid ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {yesNo(item.is_paid)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-gray-600">{item.max_days != null ? item.max_days : '—'}</td>
                                                <td className="px-6 py-4 text-gray-600 text-sm">{appliesTo(item)}</td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => openEditModal(item)} className="text-amber-600 hover:text-amber-700 mr-3">
                                                        <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                    </button>
                                                    <button type="button" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-600">
                                                        <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg border border-gray-200">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold text-gray-900">{editingItem ? 'Edit Leave Type' : 'Add Leave Type'}</h2>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingItem(null);
                                            reset();
                                        }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Name <span className="text-red-500">*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="e.g. Sick Leave, Casual Leave"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                                maxLength={255}
                                                autoFocus
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Max days per year</label>
                                            <input
                                                type="number"
                                                min="0"
                                                className={`w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.max_days ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="Leave empty for no limit"
                                                value={data.max_days}
                                                onChange={(e) => setData('max_days', e.target.value)}
                                            />
                                            {errors.max_days && <p className="text-red-500 text-sm mt-1">{errors.max_days}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_paid"
                                                checked={data.is_paid}
                                                onChange={(e) => setData('is_paid', e.target.checked)}
                                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                            />
                                            <label htmlFor="is_paid" className="text-sm font-medium text-gray-700">
                                                Paid leave
                                            </label>
                                        </div>
                                        <div className="border-t border-gray-200 pt-3">
                                            <p className="text-sm font-medium text-gray-700 mb-2">Applies to</p>
                                            <div className="flex flex-wrap gap-4">
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.for_students}
                                                        onChange={(e) => setData('for_students', e.target.checked)}
                                                        className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                    />
                                                    <span className="text-sm text-gray-700">Students</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.for_teachers}
                                                        onChange={(e) => setData('for_teachers', e.target.checked)}
                                                        className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                    />
                                                    <span className="text-sm text-gray-700">Teachers</span>
                                                </label>
                                                <label className="flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.for_employees}
                                                        onChange={(e) => setData('for_employees', e.target.checked)}
                                                        className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                    />
                                                    <span className="text-sm text-gray-700">Employees</span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                setEditingItem(null);
                                                reset();
                                            }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50">
                                            {editingItem ? 'Update' : 'Save'}
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
