import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faFilter, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const FINE_TYPE_LABELS = { fixed: 'Fixed', per_day: 'Per Day' };
const emptyForm = {
    academic_session_id: '',
    class_section_group_id: '',
    days_from: '',
    days_to: '',
    fine_type: 'fixed',
    amount: '',
    max_cap: '',
    is_active: true,
};

const selectInputClass = (hasError) =>
    `w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${hasError ? 'border-red-500' : 'border-gray-300'}`;

export default function LateFineRulesIndex({
    lateFineRules = [],
    academicSessions = [],
    classSectionGroups = [],
    filterAcademicSessionId = '',
    filterClassSectionGroupId = '',
}) {
    const { flash } = usePage().props;
    const list = Array.isArray(lateFineRules) ? lateFineRules : [];
    const sessions = Array.isArray(academicSessions) ? academicSessions : [];
    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const groupsForSession = useMemo(() => {
        const sid = data.academic_session_id ? String(data.academic_session_id) : '';
        if (!sid) return groups;
        return groups.filter((g) => String(g.academic_session_id) === sid);
    }, [groups, data.academic_session_id]);

    const sessionOptions = useMemo(
        () =>
            sessions.map((s) => ({
                value: String(s.id),
                label: s.name,
                searchText: s.name,
            })),
        [sessions]
    );

    const groupOptions = useMemo(
        () => [
            {
                value: '',
                label: 'None (apply to whole session)',
                searchText: 'none whole session',
            },
            ...groupsForSession.map((g) => ({
                value: String(g.id),
                label: g.name,
                searchText: g.name,
            })),
        ],
        [groupsForSession]
    );

    const fineTypeOptions = useMemo(
        () => [
            { value: 'fixed', label: 'Fixed', searchText: 'fixed' },
            { value: 'per_day', label: 'Per Day', searchText: 'per day' },
        ],
        []
    );

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
            academic_session_id: item.academic_session_id ?? '',
            class_section_group_id: item.class_section_group_id ?? '',
            days_from: item.days_from ?? '',
            days_to: item.days_to ?? '',
            fine_type: item.fine_type ?? 'fixed',
            amount: item.amount ?? '',
            max_cap: item.max_cap ?? '',
            is_active: item.is_active !== false,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            put(route('late-fine-rules.update', editingItem.id), {
                onSuccess: () => { setShowModal(false); setEditingItem(null); reset(); },
            });
        } else {
            post(route('late-fine-rules.store'), {
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        const range = item.days_to != null ? `Day ${item.days_from}–${item.days_to}` : `Day ${item.days_from}+`;
        const typeLabel = FINE_TYPE_LABELS[item.fine_type] || item.fine_type;
        if (!window.confirm(`Remove late fine rule (${range}, ${typeLabel}, ${item.amount})?`)) return;
        router.delete(route('late-fine-rules.destroy', item.id), { preserveScroll: true });
    };

    const applyFilter = (key, value) => {
        const academicSessionId = key === 'academic_session_id' ? value : filterAcademicSessionId;
        const classSectionGroupId = key === 'class_section_group_id' ? value : filterClassSectionGroupId;
        const params = {};
        if (academicSessionId) params.academic_session_id = academicSessionId;
        if (classSectionGroupId) params.class_section_group_id = classSectionGroupId;
        router.get(route('late-fine-rules.index'), params, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Late Fine Rules" />
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
                            { label: 'Late Fine Rules' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClock} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Late Fine Rules</h1>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Define fine by days late per academic session and class section group. Fixed amount or per day; optional max cap.
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
                                <label className="block text-sm font-medium text-gray-700 mb-1">Academic Session</label>
                                <select
                                    value={filterAcademicSessionId}
                                    onChange={(e) => applyFilter('academic_session_id', e.target.value)}
                                    className="min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                                >
                                    <option value="">All sessions</option>
                                    {sessions.map((s) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Class Section Group</label>
                                <select
                                    value={filterClassSectionGroupId}
                                    onChange={(e) => applyFilter('class_section_group_id', e.target.value)}
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

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">Rules</h2>
                                <p className="text-sm text-gray-500 mt-0.5">
                                    Total: {list.length} rule{list.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={openAddModal}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Late Fine Rule
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class Section Group</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days From</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days To</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Cap</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Active</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                                                No late fine rules yet. Click &quot;Add Late Fine Rule&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : (
                                        list.map((item) => (
                                            <tr key={item.id}>
                                                <td className="px-6 py-4 text-gray-900">{item.academic_session?.name ?? '—'}</td>
                                                <td className="px-6 py-4 text-gray-900">{item.class_section_group?.name ?? '—'}</td>
                                                <td className="px-6 py-4">{item.days_from}</td>
                                                <td className="px-6 py-4">{item.days_to != null ? item.days_to : '—'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-2 py-0.5 text-xs rounded bg-[#2E3D50] text-white">
                                                        {FINE_TYPE_LABELS[item.fine_type] || item.fine_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-medium">{Number(item.amount)}</td>
                                                <td className="px-6 py-4">{item.max_cap != null ? Number(item.max_cap) : '—'}</td>
                                                <td className="px-6 py-4">{item.is_active ? 'Yes' : 'No'}</td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => openEditModal(item)} className="text-amber-500 hover:text-amber-600 mr-3">
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
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">
                                        {editingItem ? 'Edit Late Fine Rule' : 'Add Late Fine Rule'}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => { setShowModal(false); setEditingItem(null); reset(); }}
                                        className="text-gray-500 hover:text-gray-700"
                                    >
                                        ✕
                                    </button>
                                </div>
                                {Object.keys(errors).length > 0 && (
                                    <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-800 text-sm">
                                        Please fix the errors below.
                                    </div>
                                )}
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Session</label>
                                            <SearchableSelect
                                                options={sessionOptions}
                                                value={data.academic_session_id ? String(data.academic_session_id) : ''}
                                                onChange={(value) => {
                                                    setData({
                                                        ...data,
                                                        academic_session_id: value,
                                                        class_section_group_id: '',
                                                    });
                                                }}
                                                placeholder="Search session..."
                                                inputClassName={selectInputClass(!!errors.academic_session_id)}
                                                emptyText="No sessions found"
                                            />
                                            {errors.academic_session_id && <p className="text-red-500 text-sm mt-1">{errors.academic_session_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group (optional)</label>
                                            <SearchableSelect
                                                options={groupOptions}
                                                value={data.class_section_group_id ? String(data.class_section_group_id) : ''}
                                                onChange={(value) => setData('class_section_group_id', value)}
                                                placeholder={data.academic_session_id ? 'Search class section group...' : 'Select session first (or leave none)'}
                                                inputClassName={selectInputClass(!!errors.class_section_group_id)}
                                                emptyText="No groups found"
                                            />
                                            {errors.class_section_group_id && <p className="text-red-500 text-sm mt-1">{errors.class_section_group_id}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Days From</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className={`w-full border rounded-md px-3 py-2 ${errors.days_from ? 'border-red-500' : 'border-gray-300'}`}
                                                    value={data.days_from}
                                                    onChange={(e) => setData('days_from', e.target.value)}
                                                />
                                                {errors.days_from && <p className="text-red-500 text-sm mt-1">{errors.days_from}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Days To (optional)</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className={`w-full border rounded-md px-3 py-2 ${errors.days_to ? 'border-red-500' : 'border-gray-300'}`}
                                                    value={data.days_to}
                                                    onChange={(e) => setData('days_to', e.target.value)}
                                                    placeholder="No upper limit"
                                                />
                                                {errors.days_to && <p className="text-red-500 text-sm mt-1">{errors.days_to}</p>}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Fine Type</label>
                                            <SearchableSelect
                                                options={fineTypeOptions}
                                                value={data.fine_type || 'fixed'}
                                                onChange={(value) => setData('fine_type', value || 'fixed')}
                                                placeholder="Search fine type..."
                                                inputClassName={selectInputClass(!!errors.fine_type)}
                                                emptyText="No fine types found"
                                            />
                                            {errors.fine_type && <p className="text-red-500 text-sm mt-1">{errors.fine_type}</p>}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    className={`w-full border rounded-md px-3 py-2 ${errors.amount ? 'border-red-500' : 'border-gray-300'}`}
                                                    value={data.amount}
                                                    onChange={(e) => setData('amount', e.target.value)}
                                                />
                                                {errors.amount && <p className="text-red-500 text-sm mt-1">{errors.amount}</p>}
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">Max Cap (optional)</label>
                                                <input
                                                    type="number"
                                                    min={0}
                                                    step="0.01"
                                                    className={`w-full border rounded-md px-3 py-2 ${errors.max_cap ? 'border-red-500' : 'border-gray-300'}`}
                                                    value={data.max_cap}
                                                    onChange={(e) => setData('max_cap', e.target.value)}
                                                    placeholder="Leave empty for no cap"
                                                />
                                                {errors.max_cap && <p className="text-red-500 text-sm mt-1">{errors.max_cap}</p>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                id="is_active"
                                                checked={data.is_active}
                                                onChange={(e) => setData('is_active', e.target.checked)}
                                                className="rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                            />
                                            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
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
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
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
