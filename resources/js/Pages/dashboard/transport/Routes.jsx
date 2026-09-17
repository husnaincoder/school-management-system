import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function RoutesIndex({ routes = [] }) {
    const [showModal, setShowModal] = useState(false);
    const [editingRoute, setEditingRoute] = useState(null);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        route_name: '',
        start_point: '',
        end_point: '',
        monthly_fee: '',
        is_active: true,
    });

    const openAddModal = () => {
        setEditingRoute(null);
        reset();
        setShowModal(true);
    };

    const openEditModal = (routeItem) => {
        setEditingRoute(routeItem);
        setData({
            route_name: routeItem.route_name,
            start_point: routeItem.start_point || '',
            end_point: routeItem.end_point || '',
            monthly_fee: String(routeItem.monthly_fee ?? ''),
            is_active: routeItem.is_active ?? true,
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingRoute) {
            put(route('transport.routes.update', editingRoute.id), {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingRoute(null);
                    reset();
                },
            });
        } else {
            post(route('transport.routes.store'), {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                },
            });
        }
    };

    const handleDelete = (routeItem) => {
        if (!window.confirm(`Delete route "${routeItem.route_name}"?`)) return;
        router.delete(route('transport.routes.destroy', routeItem.id));
    };

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold">Transport Routes</h1>
                        <button 
                            type="button"
                            onClick={openAddModal}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Add Route
                        </button>
                    </div>

                    {/* Routes Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Point</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Point</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monthly Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {(routes ?? []).map(route => (
                                    <tr key={route.id}>
                                        <td className="px-6 py-4 font-medium text-gray-900">{route.route_name}</td>
                                        <td className="px-6 py-4">{route.start_point}</td>
                                        <td className="px-6 py-4">{route.end_point}</td>
                                        <td className="px-6 py-4">${route.monthly_fee}</td>
                                        <td className="px-6 py-4">{route.student_transports?.length ?? 0}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                type="button"
                                                onClick={() => openEditModal(route)}
                                                className="text-blue-500 hover:text-blue-700 mr-3 font-medium"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDelete(route)}
                                                className="text-red-500 hover:text-red-700 font-medium"
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Route Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">{editingRoute ? 'Edit Route' : 'Add Route'}</h2>
                                    <button type="button" onClick={() => { setShowModal(false); setEditingRoute(null); }} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Route Name</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.route_name}
                                                onChange={(e) => setData('route_name', e.target.value)}
                                            />
                                            {errors.route_name && <p className="text-red-500 text-sm mt-1">{errors.route_name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Point</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.start_point}
                                                onChange={(e) => setData('start_point', e.target.value)}
                                            />
                                            {errors.start_point && <p className="text-red-500 text-sm mt-1">{errors.start_point}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">End Point</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.end_point}
                                                onChange={(e) => setData('end_point', e.target.value)}
                                            />
                                            {errors.end_point && <p className="text-red-500 text-sm mt-1">{errors.end_point}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Fee</label>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.monthly_fee}
                                                onChange={(e) => setData('monthly_fee', e.target.value)}
                                            />
                                            {errors.monthly_fee && <p className="text-red-500 text-sm mt-1">{errors.monthly_fee}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); setEditingRoute(null); }}
                                            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                        >
                                            {processing ? 'Saving...' : (editingRoute ? 'Update' : 'Save')}
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
