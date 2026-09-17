import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

function toTimeInputValue(val) {
    if (!val) return '';
    const s = String(val).trim();
    return s.length >= 5 ? s.slice(0, 5) : s;
}

function durationLabel(start, end) {
    if (!start || !end) return '';
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    const mins = eh * 60 + em - (sh * 60 + sm);
    if (Number.isNaN(mins) || mins <= 0) return '';
    return `${mins} min`;
}

function formatAmPm(val) {
    const t = toTimeInputValue(val);
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hr = ((h + 11) % 12) + 1;
    return `${String(hr).padStart(2, '0')}:${String(m).padStart(2, '0')} ${suffix}`;
}

const TYPE_LABELS = { period: 'Period', break: 'Break', assembly: 'Assembly', lunch: 'Lunch' };

export default function TimeSlotsIndex(props) {
    const { props: pageProps } = usePage();
    const timeSlots = Array.isArray(props.timeSlots) ? props.timeSlots : (pageProps.timeSlots || []);
    const slotTypes = props.slotTypes ?? pageProps.slotTypes ?? ['period', 'break', 'assembly', 'lunch'];
    const nextOrder = props.nextOrder ?? pageProps.nextOrder ?? timeSlots.length + 1;

    const emptyForm = useMemo(() => ({
        name: '',
        start_time: '',
        end_time: '',
        slot_order: nextOrder,
        slot_type: 'period',
        is_break: false,
        is_active: true,
    }), [nextOrder]);

    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const openAdd = () => {
        setEditing(null);
        setData({ ...emptyForm, slot_order: nextOrder });
        setShowModal(true);
    };

    const openEdit = (row) => {
        setEditing(row);
        setData({
            name: row.name ?? '',
            start_time: toTimeInputValue(row.start_time),
            end_time: toTimeInputValue(row.end_time),
            slot_order: row.slot_order ?? 0,
            slot_type: row.slot_type ?? (row.is_break ? 'break' : 'period'),
            is_break: row.is_break ?? false,
            is_active: row.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const opts = {
            onSuccess: () => { setShowModal(false); setEditing(null); reset(); },
        };
        if (editing) put(route('academic.time-slots.update', editing.id), opts);
        else post(route('academic.time-slots.store'), opts);
    };

    const handleDelete = (row) => {
        if (!window.confirm('Remove this time slot?')) return;
        router.delete(route('academic.time-slots.destroy', row.id));
    };

    const setType = (type) => {
        setData({
            ...data,
            slot_type: type,
            is_break: type === 'break' || type === 'lunch',
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Time Slots" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Time Table Management', href: route('admin.timetable-management') },
                            { label: 'Time Slots' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClock} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Time Slots</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Daily periods, breaks, and assemblies</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('admin.timetable-management')} className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" /> Back
                            </Link>
                            <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                <FontAwesomeIcon icon={faPlus} className="text-sm" /> Add Time Slot
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Time Slots</h2>
                            <p className="text-sm text-gray-500 mt-0.5">Total: {timeSlots.length}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {timeSlots.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                                                No time slots found. Click &quot;Add Time Slot&quot; to create one.
                                            </td>
                                        </tr>
                                    ) : timeSlots.map((slot) => {
                                        const type = slot.slot_type || (slot.is_break ? 'break' : 'period');
                                        const breakish = type === 'break' || type === 'lunch' || slot.is_break;
                                        return (
                                            <tr key={slot.id} className={breakish ? 'bg-amber-50/60' : ''}>
                                                <td className="px-6 py-4 font-medium text-gray-900">{slot.slot_order}</td>
                                                <td className="px-6 py-4">{slot.name ?? '—'}</td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    {slot.time_range_label || `${formatAmPm(slot.start_time)} - ${formatAmPm(slot.end_time)}`}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {slot.duration_minutes != null
                                                        ? `${slot.duration_minutes} min`
                                                        : durationLabel(toTimeInputValue(slot.start_time), toTimeInputValue(slot.end_time)) || '—'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${breakish ? 'bg-amber-100 text-amber-800' : type === 'assembly' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                                                        {TYPE_LABELS[type] || type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-0.5 text-xs rounded ${(slot.is_active ?? true) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                        {(slot.is_active ?? true) ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <button type="button" onClick={() => openEdit(slot)} className="text-amber-500 hover:text-amber-600 mr-3"><FontAwesomeIcon icon={faPen} className="text-sm" /></button>
                                                    <button type="button" onClick={() => handleDelete(slot)} className="text-red-500 hover:text-red-600"><FontAwesomeIcon icon={faTrashCan} className="text-sm" /></button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editing ? 'Edit Time Slot' : 'Add Time Slot'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditing(null); reset(); }} className="text-gray-500">✕</button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                                        <input type="text" className={`w-full border rounded-md px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`} value={data.name} onChange={(e) => setData('name', e.target.value)} placeholder="e.g. Period 1" required />
                                        {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Start *</label>
                                            <input type="time" className={`w-full border rounded-md px-3 py-2 ${errors.start_time ? 'border-red-500' : 'border-gray-300'}`} value={data.start_time} onChange={(e) => setData('start_time', e.target.value)} required />
                                            {errors.start_time && <p className="text-red-500 text-sm mt-1">{errors.start_time}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">End *</label>
                                            <input type="time" className={`w-full border rounded-md px-3 py-2 ${errors.end_time ? 'border-red-500' : 'border-gray-300'}`} value={data.end_time} onChange={(e) => setData('end_time', e.target.value)} required />
                                            {errors.end_time && <p className="text-red-500 text-sm mt-1">{errors.end_time}</p>}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-500">Duration: <strong>{durationLabel(data.start_time, data.end_time) || '—'}</strong></p>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                        <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={data.slot_type} onChange={(e) => setType(e.target.value)}>
                                            {slotTypes.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                                        <input type="number" min="0" className="w-full border border-gray-300 rounded-md px-3 py-2" value={data.slot_order} onChange={(e) => setData('slot_order', parseInt(e.target.value, 10) || 0)} />
                                        <p className="text-xs text-gray-400 mt-1">Auto-suggested; change if needed.</p>
                                    </div>
                                    <label className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                                        Active
                                    </label>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setShowModal(false); setEditing(null); reset(); }} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                                        <button type="submit" disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded disabled:opacity-50">{editing ? 'Update' : 'Save'}</button>
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
