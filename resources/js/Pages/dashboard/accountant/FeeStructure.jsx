import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function FeeStructureIndex({ feeStructures, classes, sessions }) {
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        class_id: '',
        academic_session_id: '',
        tuition_fee: '',
        admission_fee: '',
        exam_fee: '',
        transport_fee: '',
        other_fee: '',
    });

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold">Fee Structure</h1>
                        <button 
                            onClick={() => setShowModal(true)}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Add Fee Structure
                        </button>
                    </div>

                    {/* Fee Structures Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tuition Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exam Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Transport Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Other Fee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {feeStructures.map(structure => (
                                    <tr key={structure.id}>
                                        <td className="px-6 py-4">{structure.class?.name}</td>
                                        <td className="px-6 py-4">{structure.academic_session?.name}</td>
                                        <td className="px-6 py-4">${structure.tuition_fee}</td>
                                        <td className="px-6 py-4">${structure.admission_fee}</td>
                                        <td className="px-6 py-4">${structure.exam_fee}</td>
                                        <td className="px-6 py-4">${structure.transport_fee}</td>
                                        <td className="px-6 py-4">${structure.other_fee}</td>
                                        <td className="px-6 py-4 font-semibold">${structure.total_fee}</td>
                                        <td className="px-6 py-4">
                                            <button className="text-blue-500 hover:text-blue-700 mr-3">Edit</button>
                                            <button className="text-red-500 hover:text-red-700">Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Add Fee Structure Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Add Fee Structure</h2>
                                    <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                                            <select
                                                className="w-full border rounded-md px-3 py-2"
                                                value={formData.class_id}
                                                onChange={(e) => setFormData({...formData, class_id: e.target.value})}
                                            >
                                                <option value="">Select Class</option>
                                                {classes.map(cls => (
                                                    <option key={cls.id} value={cls.id}>{cls.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Academic Session</label>
                                            <select
                                                className="w-full border rounded-md px-3 py-2"
                                                value={formData.academic_session_id}
                                                onChange={(e) => setFormData({...formData, academic_session_id: e.target.value})}
                                            >
                                                <option value="">Select Session</option>
                                                {sessions.map(session => (
                                                    <option key={session.id} value={session.id}>{session.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Tuition Fee</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={formData.tuition_fee}
                                                onChange={(e) => setFormData({...formData, tuition_fee: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Admission Fee</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={formData.admission_fee}
                                                onChange={(e) => setFormData({...formData, admission_fee: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Fee</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={formData.exam_fee}
                                                onChange={(e) => setFormData({...formData, exam_fee: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Transport Fee</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={formData.transport_fee}
                                                onChange={(e) => setFormData({...formData, transport_fee: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Other Fee</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={formData.other_fee}
                                                onChange={(e) => setFormData({...formData, other_fee: e.target.value})}
                                            />
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
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
                                        >
                                            Save
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
