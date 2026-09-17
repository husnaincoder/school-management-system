import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function HostelsIndex({ hostels }) {
    const [showModal, setShowModal] = useState(false);
    const [editingHostel, setEditingHostel] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        name: '',
        type: '',
        total_rooms: '',
        description: '',
        address: '',
        is_active: true,
    });

    const openAddModal = () => {
        setEditingHostel(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (hostel) => {
        setEditingHostel(hostel);
        setData({
            name: hostel.name,
            type: hostel.type,
            total_rooms: String(hostel.total_rooms),
            description: hostel.description || '',
            address: hostel.address || '',
            is_active: hostel.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingHostel) {
            put(route('hostel.hostels.update', editingHostel.id), {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingHostel(null);
                    reset();
                },
            });
        } else {
            post(route('hostel.hostels.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold">Hostel Management</h1>
                        <button 
                            onClick={openAddModal}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Add Hostel
                        </button>
                    </div>

                    {/* Hostels Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {hostels.map(hostel => (
                            <div key={hostel.id} className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold">{hostel.name}</h3>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                            hostel.type === 'boys' ? 'bg-blue-100 text-blue-800' : 
                                            hostel.type === 'girls' ? 'bg-pink-100 text-pink-800' : 'bg-gray-100 text-gray-800'
                                        }`}>
                                            {hostel.type}
                                        </span>
                                    </div>
                                </div>
                                <div className="mt-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-gray-500 text-sm">Total Rooms</div>
                                        <div className="font-semibold">{hostel.total_rooms}</div>
                                    </div>
                                    <div>
                                        <div className="text-gray-500 text-sm">Available</div>
                                        <div className="font-semibold text-green-600">{hostel.available_rooms || 0}</div>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mt-3">{hostel.description || '—'}</p>
                                <div className="mt-4 flex gap-2">
                                    <Link
                                        href={route('hostel.rooms', { hostel_id: hostel.id })}
                                        className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                                    >
                                        Manage Rooms
                                    </Link>
                                    <button
                                        type="button"
                                        onClick={() => openEditModal(hostel)}
                                        className="text-green-500 hover:text-green-700 text-sm font-medium"
                                    >
                                        Edit
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Add Hostel Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editingHostel ? 'Edit Hostel' : 'Add Hostel'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingHostel(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Hostel Name</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.name}
                                                onChange={(e) => setData('name', e.target.value)}
                                            />
                                            {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                                            <select
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.type}
                                                onChange={(e) => setData('type', e.target.value)}
                                            >
                                                <option value="">Select Type</option>
                                                <option value="boys">Boys</option>
                                                <option value="girls">Girls</option>
                                                <option value="mixed">Mixed</option>
                                            </select>
                                            {errors.type && <p className="text-red-500 text-sm mt-1">{errors.type}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Total Rooms</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.total_rooms}
                                                onChange={(e) => setData('total_rooms', e.target.value)}
                                            />
                                            {errors.total_rooms && <p className="text-red-500 text-sm mt-1">{errors.total_rooms}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Address (optional)</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.address}
                                                onChange={(e) => setData('address', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Description (optional)</label>
                                            <textarea
                                                className="w-full border rounded-md px-3 py-2"
                                                rows="3"
                                                value={data.description}
                                                onChange={(e) => setData('description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingHostel(null); }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
                                            {processing ? 'Saving...' : (editingHostel ? 'Update' : 'Save')}
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
