import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function AdminDashboard({ stats, todayAttendance, recentPayments, recentStudents }) {
    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Admin Dashboard</h1>
                    
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-blue-500">
                            <div className="text-gray-500 text-sm">Total Students</div>
                            <div className="text-2xl font-bold">{stats.totalStudents}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-green-500">
                            <div className="text-gray-500 text-sm">Total Teachers</div>
                            <div className="text-2xl font-bold">{stats.totalTeachers}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-purple-500">
                            <div className="text-gray-500 text-sm">Total Staff</div>
                            <div className="text-2xl font-bold">{stats.totalStaff}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-yellow-500">
                            <div className="text-gray-500 text-sm">Total Parents</div>
                            <div className="text-2xl font-bold">{stats.totalParents}</div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <Link href="/academic/students" className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4 text-center hover:bg-gray-50">
                            <div className="text-blue-500 text-2xl mb-2">👥</div>
                            <div className="font-medium">Students</div>
                        </Link>
                        <Link href="/academic/classes" className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4 text-center hover:bg-gray-50">
                            <div className="text-green-500 text-2xl mb-2">📚</div>
                            <div className="font-medium">Classes</div>
                        </Link>
                        <Link href="/hr/employees" className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4 text-center hover:bg-gray-50">
                            <div className="text-purple-500 text-2xl mb-2">👨‍🏫</div>
                            <div className="font-medium">Employees</div>
                        </Link>
                        <Link href="/accountant/fee/collection" className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-4 text-center hover:bg-gray-50">
                            <div className="text-yellow-500 text-2xl mb-2">💰</div>
                            <div className="font-medium">Fee Collection</div>
                        </Link>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Today's Attendance */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h2 className="text-lg font-semibold mb-4">Today's Attendance</h2>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center p-4 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">{todayAttendance?.present || 0}</div>
                                        <div className="text-sm text-gray-600">Present</div>
                                    </div>
                                    <div className="text-center p-4 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">{todayAttendance?.absent || 0}</div>
                                        <div className="text-sm text-gray-600">Absent</div>
                                    </div>
                                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                                        <div className="text-2xl font-bold text-blue-600">{todayAttendance?.total || 0}</div>
                                        <div className="text-sm text-gray-600">Total</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent Fee Payments */}
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <h2 className="text-lg font-semibold mb-4">Recent Fee Payments</h2>
                                <table className="min-w-full">
                                    <tbody>
                                        {recentPayments?.map((payment) => (
                                            <tr key={payment.id} className="border-b">
                                                <td className="py-2">{payment.student?.user?.name}</td>
                                                <td className="py-2 text-right text-green-600">${payment.amount_paid}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
