import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faGear, faFilter, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const emptyForm = { key: '', value: '', group: '' };

export default function SystemSettingsIndex(props) {
    const { props: pageProps } = usePage();
    const settings = props.settings ?? pageProps.settings ?? [];
    const groups = props.groups ?? pageProps.groups ?? [];
    const filterGroup = props.filterGroup ?? pageProps.filterGroup ?? '';
    const { flash } = usePage().props;

    const list = Array.isArray(settings) ? settings : [];
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
            key: item.key || '',
            value: item.value ?? '',
            group: item.group ?? '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { key: data.key.trim(), value: data.value, group: data.group.trim() || null };
        if (editingItem) {
            put(route('settings.system.update', editingItem.id), {
                ...payload,
                onSuccess: () => {
                    setShowModal(false);
                    setEditingItem(null);
                    reset();
                },
            });
        } else {
            post(route('settings.system.store'), {
                ...payload,
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (item) => {
        if (!window.confirm(`Delete setting "${item.key}"?`)) return;
        router.delete(route('settings.system.destroy', item.id), { preserveScroll: true });
    };

    const applyFilter = (group) => {
        const params = group ? { group } : {};
        router.get(route('settings.system.index'), Object.keys(params).length ? params : {}, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="System Setting" />
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
                            { label: 'Settings', href: route('admin.settings-management') },
                            { label: 'System Settings' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faGear} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Key-value settings (secrets like passwords are blocked — use Email Settings for SMTP password)</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.settings-management')}
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
                        <div className="flex flex-wrap items-center gap-4 justify-end">
                            <label className="text-sm font-medium text-gray-700">Group</label>
                            <select
                                value={filterGroup || ''}
                                onChange={(e) => applyFilter(e.target.value || null)}
                                className="min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm"
                            >
                                <option value="">All groups</option>
                                {groups.map((g) => (
                                    <option key={g} value={g}>{g}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <div className="flex flex-wrap items-center gap-4 justify-end">
                            <span className="text-sm font-medium text-gray-700">Total: {list.length} setting{list.length !== 1 ? 's' : ''}</span>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-medium"
                            >
                                <FontAwesomeIcon icon={faPlus} className="w-4 h-4" />
                                Add Setting
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Total: {list.length} setting{list.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Key</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Value</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                                No settings yet. Add one (e.g. key: app_name, value: My School, group: school).
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 font-medium text-gray-900 font-mono text-sm">{item.key}</td>
                                                <td className="px-6 py-4 text-gray-600">
                                                    {item.group ? (
                                                        <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700">{item.group}</span>
                                                    ) : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-gray-600 text-sm max-w-md truncate" title={item.is_sensitive ? undefined : (item.value || undefined)}>
                                                    {item.is_sensitive ? (
                                                        <span className="font-mono tracking-widest text-gray-400">{item.has_value ? '••••••••' : '—'}</span>
                                                    ) : (
                                                        item.value || '—'
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {item.is_sensitive ? (
                                                        <button type="button" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-600" title="Delete leftover secret row">
                                                            <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button type="button" onClick={() => openEditModal(item)} className="text-amber-600 hover:text-amber-700 mr-3">
                                                                <FontAwesomeIcon icon={faPen} className="text-sm" />
                                                            </button>
                                                            <button type="button" onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-600">
                                                                <FontAwesomeIcon icon={faTrashCan} className="text-sm" />
                                                            </button>
                                                        </>
                                                    )}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-lg">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editingItem ? 'Edit Setting' : 'Add Setting'}</h2>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); setEditingItem(null); reset(); }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Key <span className="text-red-500">*</span></label>
                                            <input
                                                type="text"
                                                className={`w-full border rounded-md px-3 py-2 ${errors.key ? 'border-red-500' : 'border-gray-300'} font-mono text-sm`}
                                                placeholder="e.g. app_name, smtp_host"
                                                value={data.key}
                                                onChange={(e) => setData('key', e.target.value)}
                                                maxLength={255}
                                                autoFocus
                                                readOnly={!!editingItem}
                                            />
                                            {editingItem && <p className="text-xs text-gray-500 mt-1">Key cannot be changed when editing.</p>}
                                            {errors.key && <p className="text-red-500 text-sm mt-1">{errors.key}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Group</label>
                                            <input
                                                type="text"
                                                className={`w-full border rounded-md px-3 py-2 ${errors.group ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="e.g. system, school, email"
                                                value={data.group}
                                                onChange={(e) => setData('group', e.target.value)}
                                                maxLength={255}
                                            />
                                            {errors.group && <p className="text-red-500 text-sm mt-1">{errors.group}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Value</label>
                                            <textarea
                                                rows={3}
                                                className={`w-full border rounded-md px-3 py-2 ${errors.value ? 'border-red-500' : 'border-gray-300'}`}
                                                placeholder="Setting value"
                                                value={data.value}
                                                onChange={(e) => setData('value', e.target.value)}
                                            />
                                            {errors.value && <p className="text-red-500 text-sm mt-1">{errors.value}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingItem(null); reset(); }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">
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
