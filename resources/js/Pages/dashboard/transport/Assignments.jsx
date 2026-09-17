import React, { useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function AssignmentsIndex({ assignments, routes = [], vehicles = [], students = [], filters = {} }) {
    const [showModal, setShowModal] = useState(false);
    const { data, setData, post, processing, errors, reset } = useForm({
        student_id: '',
        route_id: '',
        vehicle_id: '',
        pickup_point: '',
        start_date: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('transport.assignments.store'), {
            onSuccess: () => {
                setShowModal(false);
                reset();
            },
        });
    };

    const assignmentList = assignments?.data ?? [];
    const links = assignments?.links ?? [];

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold">Transport Assignments</h1>
                        <button
                            type="button"
                            onClick={() => setShowModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Assign Transport
                        </button>
                    </div>

                    {/* Filter by route */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-4">
                        <form method="GET" className="flex flex-wrap gap-4 items-center">
                            <label className="font-medium text-gray-700">Filter by Route</label>
                            <select name="route_id" defaultValue={filters.route_id ?? ''} className="border rounded-md px-3 py-2 min-w-[200px]">
                                <option value="">All Routes</option>
                                {(routes ?? []).map((r) => (
                                    <option key={r.id} value={r.id}>{r.route_name}</option>
                                ))}
                            </select>
                            <button type="submit" className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                                Filter
                            </button>
                        </form>
                    </div>

                    {/* Assignments Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pickup Point</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {assignmentList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No assignments yet. Click &quot;Assign Transport&quot; to add one.
                                        </td>
                                    </tr>
                                ) : (
                                    assignmentList.map((a) => (
                                        <tr key={a.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">
                                                {a.student?.user?.name ?? `Student #${a.student_id}`}
                                            </td>
                                            <td className="px-6 py-4">{a.route?.route_name ?? '—'}</td>
                                            <td className="px-6 py-4">{a.vehicle?.vehicle_number ?? '—'}</td>
                                            <td className="px-6 py-4">{a.pickup_point ?? '—'}</td>
                                            <td className="px-6 py-4">{a.start_date ? new Date(a.start_date).toLocaleDateString() : '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${a.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {a.status ?? '—'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {links.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {links.map((link, index) =>
                                link.url ? (
                                    <Link
                                        key={index}
                                        href={link.url}
                                        className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ) : (
                                    <span
                                        key={index}
                                        className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                )
                            )}
                        </div>
                    )}

                    {/* Add Assignment Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Assign Transport</h2>
                                    <button type="button" onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                                            <select
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.student_id}
                                                onChange={(e) => setData('student_id', e.target.value)}
                                            >
                                                <option value="">Select Student</option>
                                                {(students ?? []).map((s) => (
                                                    <option key={s.id} value={s.id}>{s.user?.name ?? `Student #${s.id}`}</option>
                                                ))}
                                            </select>
                                            {errors.student_id && <p className="text-red-500 text-sm mt-1">{errors.student_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Route</label>
                                            <select
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.route_id}
                                                onChange={(e) => setData('route_id', e.target.value)}
                                            >
                                                <option value="">Select Route</option>
                                                {(routes ?? []).map((r) => (
                                                    <option key={r.id} value={r.id}>{r.route_name}</option>
                                                ))}
                                            </select>
                                            {errors.route_id && <p className="text-red-500 text-sm mt-1">{errors.route_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Vehicle</label>
                                            <select
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.vehicle_id}
                                                onChange={(e) => setData('vehicle_id', e.target.value)}
                                            >
                                                <option value="">Select Vehicle</option>
                                                {(vehicles ?? []).map((v) => (
                                                    <option key={v.id} value={v.id}>{v.vehicle_number} {v.vehicle_name ? `(${v.vehicle_name})` : ''}</option>
                                                ))}
                                            </select>
                                            {errors.vehicle_id && <p className="text-red-500 text-sm mt-1">{errors.vehicle_id}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Point</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.pickup_point}
                                                onChange={(e) => setData('pickup_point', e.target.value)}
                                                placeholder="e.g. Main Gate"
                                            />
                                            {errors.pickup_point && <p className="text-red-500 text-sm mt-1">{errors.pickup_point}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                            <input
                                                type="date"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={data.start_date}
                                                onChange={(e) => setData('start_date', e.target.value)}
                                            />
                                            {errors.start_date && <p className="text-red-500 text-sm mt-1">{errors.start_date}</p>}
                                        </div>
                                    </div>
                                    <div className="mt-6 flex justify-end gap-3">
                                        <button type="button" onClick={() => setShowModal(false)} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded">
                                            Cancel
                                        </button>
                                        <button type="submit" disabled={processing} className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50">
                                            {processing ? 'Saving...' : 'Assign'}
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
