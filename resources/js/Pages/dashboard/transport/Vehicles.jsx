import React, { useState } from 'react';
import { useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function VehiclesIndex({ vehicles = [], routes = [] }) {
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        vehicle_number: '',
        vehicle_name: '',
        driver_name: '',
        driver_phone: '',
        capacity: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('transport.vehicles.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold">Transport - Vehicles</h1>
                        <button 
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Add Vehicle
                        </button>
                    </div>

                    {/* Vehicles Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle Number</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name / Model</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacity</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(vehicles ?? []).map(vehicle => (
                                    <tr key={vehicle.id}>
                                        <td className="px-6 py-4 font-medium text-gray-900">{vehicle.vehicle_number}</td>
                                        <td className="px-6 py-4">{vehicle.vehicle_name || '—'}</td>
                                        <td className="px-6 py-4">{vehicle.driver_name}</td>
                                        <td className="px-6 py-4">{vehicle.driver_phone}</td>
                                        <td className="px-6 py-4">{vehicle.capacity}</td>
                                        <td className="px-6 py-4">—</td>
                                        <td className="px-6 py-4">
                                            <button className="text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                                            <button className="text-red-500 hover:text-red-700">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Vehicle Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Add Vehicle</h2>
                                    <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Number</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.vehicle_number}
                                                onChange={(e) => setData('vehicle_number', e.target.value)}
                                            />
                                            {errors.vehicle_number && <p className="text-red-500 text-sm mt-1">{errors.vehicle_number}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle Name / Model (optional)</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.vehicle_name}
                                                onChange={(e) => setData('vehicle_name', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Driver Name</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.driver_name}
                                                onChange={(e) => setData('driver_name', e.target.value)}
                                            />
                                            {errors.driver_name && <p className="text-red-500 text-sm mt-1">{errors.driver_name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Driver Phone</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.driver_phone}
                                                onChange={(e) => setData('driver_phone', e.target.value)}
                                            />
                                            {errors.driver_phone && <p className="text-red-500 text-sm mt-1">{errors.driver_phone}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Capacity</label>
                                            <input
                                                type="number"
                                                min="1"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.capacity}
                                                onChange={(e) => setData('capacity', e.target.value)}
                                            />
                                            {errors.capacity && <p className="text-red-500 text-sm mt-1">{errors.capacity}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setShowModal(false)}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
                                            {processing ? 'Saving...' : 'Save'}
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
