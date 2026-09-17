import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faMoneyBillWave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const TYPE_LABELS = { fixed: 'Fixed', percentage: 'Percentage' };
const emptyForm = { name: '', type: 'fixed', value: '', is_active: true };

export default function Allowances({ allowances = [] }) {
    const { flash } = usePage().props;
    const list = Array.isArray(allowances) ? allowances : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const openAdd = () => { setEditingItem(null); setData(emptyForm); setShowModal(true); };
    const openEdit = (item) => {
        setEditingItem(item);
        setData({ name: item.name, type: item.type, value: String(item.value), is_active: item.is_active !== false });
        setShowModal(true);
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('payroll.allowances.update', editingItem.id), { onSuccess: () => { setShowModal(false); reset(); } });
        } else {
            post(route('payroll.allowances.store'), { onSuccess: () => { setShowModal(false); reset(); } });
        }
    };
    const handleDelete = (item) => {
        if (!window.confirm(`Delete allowance "${item.name}"?`)) return;
        router.delete(route('payroll.allowances.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Allowances" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Payroll Management', href: route('admin.payroll-management') },
                            { label: 'Allowances' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faMoneyBillWave} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Allowances</h1>
                                <p className="text-sm text-gray-500 mt-0.5">House Rent, Medical, Transport, etc.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.payroll-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">
                                <FontAwesomeIcon icon={faPlus} /> Add
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No allowances yet. Add one to use in salary structures.</td></tr>
                                ) : (
                                    list.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                                            <td className="px-6 py-4"><span className="px-2 py-0.5 text-xs rounded bg-gray-100">{TYPE_LABELS[item.type] || item.type}</span></td>
                                            <td className="px-6 py-4 text-right">{item.type === 'percentage' ? `${item.value}%` : item.value}</td>
                                            <td className="px-6 py-4">{item.is_active ? 'Yes' : 'No'}</td>
                                            <td className="px-6 py-4 text-right">
                                                <button type="button" onClick={() => openEdit(item)} className="text-amber-600 hover:text-amber-700 mr-3"><FontAwesomeIcon icon={faPen} /></button>
                                                <button type="button" onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-700"><FontAwesomeIcon icon={faTrashCan} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <h2 className="text-xl font-semibold mb-4">{editingItem ? 'Edit Allowance' : 'Add Allowance'}</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                        <input type="text" value={data.name} onChange={(e) => setData('name', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" placeholder="e.g. House Rent" />
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                        <select value={data.type} onChange={(e) => setData('type', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2">
                                            <option value="fixed">Fixed</option>
                                            <option value="percentage">Percentage</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                                        <input type="number" step="0.01" min={0} value={data.value} onChange={(e) => setData('value', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" />
                                        {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300 text-amber-500" />
                                        <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={() => { setShowModal(false); reset(); }} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50">Save</button>
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
