import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function FeeCollectionIndex({ students, feeAssignments, pendingFees }) {
    const [selectedStudent, setSelectedStudent] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [paymentData, setPaymentData] = useState({
        amount_paid: '',
        payment_method: 'cash',
        transaction_id: '',
        payment_date: new Date().toISOString().split('T')[0],
        note: '',
    });

    const selectedStudentFees = pendingFees.filter(fee => fee.student_id === parseInt(selectedStudent));
    const totalPending = selectedStudentFees.reduce((sum, fee) => sum + fee.balance_amount, 0);

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Fee Collection</h1>

                    {/* Search Student */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Search Student</label>
                                <select
                                    className="w-full border rounded-md px-3 py-2"
                                    value={selectedStudent}
                                    onChange={(e) => setSelectedStudent(e.target.value)}
                                >
                                    <option value="">Select Student</option>
                                    {students.map(student => (
                                        <option key={student.id} value={student.id}>
                                            {student.roll_number} - {student.user?.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Student Fee Details */}
                    {selectedStudent && (
                        <>
                            {/* Fee Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-blue-500">
                                    <div className="text-gray-500 text-sm">Total Fee</div>
                                    <div className="text-2xl font-bold">${selectedStudentFees.reduce((sum, fee) => sum + fee.total_amount, 0)}</div>
                                </div>
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-green-500">
                                    <div className="text-gray-500 text-sm">Total Paid</div>
                                    <div className="text-2xl font-bold text-green-600">${selectedStudentFees.reduce((sum, fee) => sum + fee.paid_amount, 0)}</div>
                                </div>
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-red-500">
                                    <div className="text-gray-500 text-sm">Total Pending</div>
                                    <div className="text-2xl font-bold text-red-600">${totalPending}</div>
                                </div>
                                <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-yellow-500">
                                    <div className="text-gray-500 text-sm">Actions</div>
                                    <button
                                        onClick={() => setShowModal(true)}
                                        className="mt-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded text-sm"
                                        disabled={totalPending === 0}
                                    >
                                        Collect Fee
                                    </button>
                                </div>
                            </div>

                            {/* Pending Fees Table */}
                            <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                                <div className="p-6">
                                    <h2 className="text-lg font-semibold mb-4">Pending Fees</h2>
                                    <table className="min-w-full">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fee Type</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Paid Amount</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {selectedStudentFees.map(fee => (
                                                <tr key={fee.id}>
                                                    <td className="px-6 py-4">{fee.fee_type}</td>
                                                    <td className="px-6 py-4">${fee.total_amount}</td>
                                                    <td className="px-6 py-4">${fee.paid_amount}</td>
                                                    <td className="px-6 py-4 font-semibold text-red-600">${fee.balance_amount}</td>
                                                    <td className="px-6 py-4">{fee.due_date}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                            fee.balance_amount > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                                                        }`}>
                                                            {fee.balance_amount > 0 ? 'Pending' : 'Paid'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Payment Modal */}
                    {showModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-semibold">Collect Fee</h2>
                                    <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                                </div>
                                <form>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                            <input
                                                type="number"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={paymentData.amount_paid}
                                                onChange={(e) => setPaymentData({...paymentData, amount_paid: e.target.value})}
                                                max={totalPending}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                                            <select
                                                className="w-full border rounded-md px-3 py-2"
                                                value={paymentData.payment_method}
                                                onChange={(e) => setPaymentData({...paymentData, payment_method: e.target.value})}
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="bank_transfer">Bank Transfer</option>
                                                <option value="cheque">Cheque</option>
                                                <option value="online">Online</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID</label>
                                            <input
                                                type="text"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={paymentData.transaction_id}
                                                onChange={(e) => setPaymentData({...paymentData, transaction_id: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Date</label>
                                            <input
                                                type="date"
                                                className="w-full border rounded-md px-3 py-2"
                                                value={paymentData.payment_date}
                                                onChange={(e) => setPaymentData({...paymentData, payment_date: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Note</label>
                                            <textarea
                                                className="w-full border rounded-md px-3 py-2"
                                                rows="2"
                                                value={paymentData.note}
                                                onChange={(e) => setPaymentData({...paymentData, note: e.target.value})}
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
                                            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                                        >
                                            Process Payment
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
