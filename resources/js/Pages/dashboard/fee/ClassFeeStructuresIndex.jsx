import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faMoneyBillWave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { class_section_group_id: '', fee_type_id: '', amount: '' };

export default function ClassFeeStructuresIndex({ feeStructures = [], classSectionGroups = [], feeTypes = [] }) {
    const { flash } = usePage().props;
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
        reset();
        setShowModal(true);
    };

    const openEditModal = (item) => {
        setEditingItem(item);
        setData({
            class_section_group_id: item.class_section_group_id || '',
            fee_type_id: item.fee_type_id || '',
            amount: item.amount || '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('class-fee-structures.update', editingItem.id), {
                onSuccess: () => { setShowModal(false); setEditingItem(null); reset(); },
            });
        } else {
            post(route('class-fee-structures.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete this fee structure?`)) return;
        router.delete(route('class-fee-structures.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
             <Head title="Class Fee Structures" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">

                    {/* Flash Banner */}
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`} role="alert">
                            {banner.message}
                        </div>
                    )}

                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Accountant Management', href: route('admin.accountant-management') },
                            { label: 'Class Fee Structure' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Fee Structures</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage class fee structures (Tuition, Monthly, One-time, Fine, etc.)</p>
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
                                <h2 className="text-lg font-semibold text-gray-900">Fee Structures</h2>
                                <p className="text-sm text-gray-500 mt-0.5">Total: {feeStructures.length} structure{feeStructures.length !== 1 ? 's' : ''}</p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Fee Structure
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Section Group</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {feeStructures.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No fee structures found. Click &quot;Add Fee Structure&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        feeStructures.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4">{item.class_section_group?.name || '-'}</td>
                                                <td className="px-6 py-4">{item.fee_type?.name || '-'}</td>
                                                <td className="px-6 py-4">{item.amount}</td>
                                                <td className="px-6 py-4">
                                                    <button onClick={() => openEditModal(item)} className="text-amber-500 hover:text-amber-600 mr-3">
                                                        <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                    </button>
                                                    <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-600">
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

                    {/* Add/Edit Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editingItem ? 'Edit Fee Structure' : 'Add Fee Structure'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        {/* Class Section Group */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group</label>
                                            <select
                                                className={`w-full border rounded-md px-3 py-2 ${errors.class_section_group_id ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.class_section_group_id}
                                                onChange={(e) => setData('class_section_group_id', e.target.value)}
                                            >
                                                <option value="">Select Class Section Group</option>
                                                {classSectionGroups.map((group) => (
                                                    <option key={group.id} value={group.id}>{group.name}</option>
                                                ))}
                                            </select>
                                            {errors.class_section_group_id && <p className="text-red-500 text-sm mt-1">{errors.class_section_group_id}</p>}
                                        </div>

                                        {/* Fee Type */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Fee Type</label>
                                            <select
                                                className={`w-full border rounded-md px-3 py-2 ${errors.fee_type_id ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.fee_type_id}
                                                onChange={(e) => setData('fee_type_id', e.target.value)}
                                            >
                                                <option value="">Select Fee Type</option>
                                                {feeTypes.map((type) => (
                                                    <option key={type.id} value={type.id}>{type.name}</option>
                                                ))}
                                            </select>
                                            {errors.fee_type_id && <p className="text-red-500 text-sm mt-1">{errors.fee_type_id}</p>}
                                        </div>

                                        {/* Amount */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                            <input
                                                type="number"
                                                className={`w-full border rounded-md px-3 py-2 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                                                value={data.amount}
                                                onChange={(e) => setData('amount', e.target.value)}
                                                min={0}
                                                step="0.01"
                                            />
                                            {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                                        </div>
                                    </div>

                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => { setShowModal(false); setEditingItem(null); reset(); }} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">Cancel</button>
                                        <button type="submit" disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">{editingItem ? 'Update' : 'Save'}</button>
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