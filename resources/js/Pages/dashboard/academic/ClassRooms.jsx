import React, { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faDoorOpen, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const TYPE_LABELS = {
    classroom: 'Classroom',
    laboratory: 'Laboratory',
    computer_lab: 'Computer Lab',
    auditorium: 'Auditorium',
    library: 'Library',
    hall: 'Hall',
};

const FACILITY_LABELS = {
    projector: 'Projector',
    ac: 'AC',
    smart_board: 'Smart Board',
    computers: 'Computers',
};

const emptyForm = {
    name: '',
    code: '',
    building: '',
    floor: '',
    room_type: 'classroom',
    capacity: '',
    is_lab: false,
    is_active: true,
    facilities: [],
};

export default function ClassRoomsIndex(props) {
    const { props: pageProps } = usePage();
    const classRooms = Array.isArray(props.classRooms) ? props.classRooms : (pageProps.classRooms || []);
    const roomTypes = props.roomTypes ?? pageProps.roomTypes ?? Object.keys(TYPE_LABELS);
    const facilityOptions = props.facilityOptions ?? pageProps.facilityOptions ?? Object.keys(FACILITY_LABELS);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm(emptyForm);

    const openAdd = () => { setEditing(null); setData(emptyForm); setShowModal(true); };
    const openEdit = (row) => {
        setEditing(row);
        setData({
            name: row.name ?? '',
            code: row.code ?? '',
            building: row.building ?? '',
            floor: row.floor ?? '',
            room_type: row.room_type ?? (row.is_lab ? 'laboratory' : 'classroom'),
            capacity: row.capacity != null ? String(row.capacity) : '',
            is_lab: row.is_lab ?? false,
            is_active: row.is_active ?? true,
            facilities: Array.isArray(row.facilities) ? row.facilities : [],
        });
        setShowModal(true);
    };

    const transformData = (d) => ({
        ...d,
        capacity: d.capacity === '' ? null : (parseInt(d.capacity, 10) || null),
        code: d.code || null,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        const opts = {
            transform: transformData,
            onSuccess: () => { setShowModal(false); setEditing(null); reset(); },
        };
        if (editing) put(route('academic.class-rooms.update', editing.id), opts);
        else post(route('academic.class-rooms.store'), opts);
    };

    const toggleFacility = (key) => {
        const set = new Set(data.facilities || []);
        if (set.has(key)) set.delete(key);
        else set.add(key);
        setData('facilities', Array.from(set));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Class Rooms" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Time Table Management', href: route('admin.timetable-management') },
                            { label: 'Class Rooms' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faDoorOpen} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Class Rooms</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Rooms, labs, and venues</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Link href={route('admin.timetable-management')} className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm">
                                <FontAwesomeIcon icon={faArrowLeft} /> Back
                            </Link>
                            <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg text-sm">
                                <FontAwesomeIcon icon={faPlus} /> Add Class Room
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold">Class Rooms</h2>
                            <p className="text-sm text-gray-500">Total: {classRooms.length}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {classRooms.length === 0 ? (
                                        <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">No class rooms found.</td></tr>
                                    ) : classRooms.map((room) => (
                                        <tr key={room.id}>
                                            <td className="px-4 py-3 font-medium">{room.name}</td>
                                            <td className="px-4 py-3">{room.code || '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 text-xs rounded ${room.is_lab || room.room_type === 'laboratory' || room.room_type === 'computer_lab' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                    {TYPE_LABELS[room.room_type] || (room.is_lab ? 'Lab' : 'Classroom')}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">{room.floor || '—'}</td>
                                            <td className="px-4 py-3">{room.capacity ?? '—'}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 text-xs rounded ${(room.is_active ?? true) ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                                                    {(room.is_active ?? true) ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3">
                                                <button type="button" onClick={() => openEdit(room)} className="text-amber-500 mr-3"><FontAwesomeIcon icon={faPen} /></button>
                                                <button type="button" onClick={() => { if (window.confirm('Remove this room?')) router.delete(route('academic.class-rooms.destroy', room.id)); }} className="text-red-500"><FontAwesomeIcon icon={faTrashCan} /></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between mb-4">
                                    <h2 className="text-xl font-semibold">{editing ? 'Edit Class Room' : 'Add Class Room'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); reset(); }}>✕</button>
                                </div>
                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Room Name *</label>
                                        <input className={`w-full border rounded-md px-3 py-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`} value={data.name} onChange={(e) => setData('name', e.target.value)} required />
                                        {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Room Number / Code</label>
                                            <input className={`w-full border rounded-md px-3 py-2 ${errors.code ? 'border-red-500' : 'border-gray-300'}`} value={data.code} onChange={(e) => setData('code', e.target.value)} />
                                            {errors.code && <p className="text-red-500 text-sm">{errors.code}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Capacity</label>
                                            <input type="number" min="1" className="w-full border border-gray-300 rounded-md px-3 py-2" value={data.capacity} onChange={(e) => setData('capacity', e.target.value)} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Building</label>
                                            <input className="w-full border border-gray-300 rounded-md px-3 py-2" value={data.building} onChange={(e) => setData('building', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium mb-1">Floor</label>
                                            <input className="w-full border border-gray-300 rounded-md px-3 py-2" value={data.floor} onChange={(e) => setData('floor', e.target.value)} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Room Type</label>
                                        <select className="w-full border border-gray-300 rounded-md px-3 py-2" value={data.room_type} onChange={(e) => setData('room_type', e.target.value)}>
                                            {roomTypes.map((t) => <option key={t} value={t}>{TYPE_LABELS[t] || t}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Facilities</label>
                                        <div className="flex flex-wrap gap-3">
                                            {facilityOptions.map((f) => (
                                                <label key={f} className="inline-flex items-center gap-1.5 text-sm">
                                                    <input type="checkbox" checked={(data.facilities || []).includes(f)} onChange={() => toggleFacility(f)} className="rounded border-gray-300" />
                                                    {FACILITY_LABELS[f] || f}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                    <label className="inline-flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300" />
                                        Active
                                    </label>
                                    <div className="flex justify-end gap-3 pt-2">
                                        <button type="button" onClick={() => { setShowModal(false); reset(); }} className="bg-gray-500 text-white px-4 py-2 rounded">Cancel</button>
                                        <button type="submit" disabled={processing} className="bg-amber-500 text-white px-4 py-2 rounded disabled:opacity-50">{editing ? 'Update' : 'Save'}</button>
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
