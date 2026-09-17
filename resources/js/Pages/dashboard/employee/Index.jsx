import React from 'react';
import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faCalendarXmark, faMoneyBillWave } from '@fortawesome/free-solid-svg-icons';

const MONTHS = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthLabel(month) {
    const index = parseInt(month, 10);
    return MONTHS[index] || month || '—';
}

function paymentStatus(payroll) {
    return payroll?.payment_date ? 'Paid' : 'Pending';
}

export default function EmployeeDashboard({
    employee,
    profilePending,
    userName,
    attendanceStats = {},
    recentPayrolls = [],
    pendingLeaves = 0,
}) {
    const displayName = employee?.user?.name ?? userName ?? 'Employee';

    if (profilePending) {
        return (
            <AuthenticatedLayout>
                <Head title="Employee Dashboard" />
                <div className="py-12">
                    <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                        <h1 className="text-2xl font-semibold mb-6">Welcome, {displayName}</h1>
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-amber-800">
                            <p className="font-medium">Your employee profile is not set up yet.</p>
                            <p className="mt-2 text-sm">Please contact HR or admin to link your account with an employee record.</p>
                        </div>
                    </div>
                </div>
            </AuthenticatedLayout>
        );
    }

    return (
        <AuthenticatedLayout>
            <Head title="Employee Dashboard" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-2">Welcome, {displayName}</h1>
                    <p className="text-sm text-gray-500 mb-6">
                        {[employee?.designation, employee?.department].filter(Boolean).join(' · ') || 'Employee'}
                        {employee?.employee_id ? ` · ID: ${employee.employee_id}` : ''}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="text-gray-500 text-xs">Present</div>
                            <div className="text-2xl font-bold text-green-600">{attendanceStats.present ?? 0}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="text-gray-500 text-xs">Absent</div>
                            <div className="text-2xl font-bold text-red-600">{attendanceStats.absent ?? 0}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="text-gray-500 text-xs">Late</div>
                            <div className="text-2xl font-bold text-amber-600">{attendanceStats.late ?? 0}</div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="text-gray-500 text-xs">Pending Leaves</div>
                            <div className="text-2xl font-bold text-gray-800">{pendingLeaves}</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <Link
                            href={route('employee.attendance')}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-amber-300 hover:shadow-sm transition"
                        >
                            <FontAwesomeIcon icon={faCheck} className="text-amber-500 text-xl mb-3" />
                            <div className="font-semibold text-gray-900">My Attendance</div>
                            <p className="text-sm text-gray-500 mt-1">View your attendance records</p>
                        </Link>
                        <Link
                            href={route('employee.salary')}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-amber-300 hover:shadow-sm transition"
                        >
                            <FontAwesomeIcon icon={faMoneyBillWave} className="text-amber-500 text-xl mb-3" />
                            <div className="font-semibold text-gray-900">My Salary</div>
                            <p className="text-sm text-gray-500 mt-1">View salary payment history</p>
                        </Link>
                        <Link
                            href={route('employee.my-leaves.index')}
                            className="bg-white rounded-xl border border-gray-200 p-6 hover:border-amber-300 hover:shadow-sm transition"
                        >
                            <FontAwesomeIcon icon={faCalendarXmark} className="text-amber-500 text-xl mb-3" />
                            <div className="font-semibold text-gray-900">My Leave</div>
                            <p className="text-sm text-gray-500 mt-1">Apply and track leave requests</p>
                        </Link>
                    </div>

                    {recentPayrolls.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Payroll</h2>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Period</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Net Salary</th>
                                            <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {recentPayrolls.map((payroll) => (
                                            <tr key={payroll.id}>
                                                <td className="px-4 py-3 text-sm">{monthLabel(payroll.month)} {payroll.year}</td>
                                                <td className="px-4 py-3 text-sm font-medium">{Number(payroll.net_salary).toLocaleString()}</td>
                                                <td className="px-4 py-3 text-sm capitalize">{paymentStatus(payroll)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
