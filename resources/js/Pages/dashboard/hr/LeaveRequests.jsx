import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function LeaveRequestsIndex({ leaveRequests, leaveTypes }) {
    const getStatusColor = (status) => {
        switch(status) {
            case 'approved': return 'bg-green-100 text-green-800';
            case 'rejected': return 'bg-red-100 text-red-800';
            default: return 'bg-yellow-100 text-yellow-800';
        }
    };

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold">Leave Requests</h1>
                        <Link href="/hr/employees" className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded">
                            Back to Employees
                        </Link>
                    </div>

                    {/* Leave Requests Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">From Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">To Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {leaveRequests.map(request => (
                                    <tr key={request.id}>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{request.employee?.user?.name}</div>
                                            <div className="text-sm text-gray-500">{request.employee?.department}</div>
                                        </td>
                                        <td className="px-6 py-4">{request.leave_type}</td>
                                        <td className="px-6 py-4">{request.from_date}</td>
                                        <td className="px-6 py-4">{request.to_date}</td>
                                        <td className="px-6 py-4">{request.days}</td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm text-gray-600 truncate max-w-xs block">
                                                {request.reason}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            {request.status === 'pending' && (
                                                <div className="flex gap-2">
                                                    <form method="POST" action={`/hr/leave-requests/${request.id}/approve`} className="inline">
                                                        <button className="text-green-500 hover:text-green-700 text-sm">
                                                            Approve
                                                        </button>
                                                    </form>
                                                    <form method="POST" action={`/hr/leave-requests/${request.id}/reject`} className="inline">
                                                        <button className="text-red-500 hover:text-red-700 text-sm">
                                                            Reject
                                                        </button>
                                                    </form>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
