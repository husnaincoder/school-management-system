import React from 'react';
import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function EmployeeAttendance({ employee, records, stats = {}, filters = {} }) {
    const items = records?.data ?? records ?? [];

    const applyFilters = (e) => {
        e?.preventDefault();
        const form = e.target;
        router.get(route('employee.attendance'), {
            date_from: form.date_from?.value,
            date_to: form.date_to?.value,
        }, { preserveState: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="My Attendance" />
            <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <Link href={route('dashboard.employee')} className="text-gray-500 hover:text-gray-700 text-sm font-medium mb-6 inline-block">← Back to Dashboard</Link>
                <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>
                <p className="text-sm text-gray-500 mt-0.5">{employee?.user?.name ?? 'Employee'}</p>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-gray-500 text-xs">Present</div><div className="text-xl font-bold text-green-600">{stats.present ?? 0}</div></div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-gray-500 text-xs">Absent</div><div className="text-xl font-bold text-red-600">{stats.absent ?? 0}</div></div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-gray-500 text-xs">Late</div><div className="text-xl font-bold text-amber-600">{stats.late ?? 0}</div></div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4"><div className="text-gray-500 text-xs">Leave</div><div className="text-xl font-bold text-gray-600">{stats.leave ?? 0}</div></div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 mb-6">
                    <form onSubmit={applyFilters} className="flex flex-wrap gap-4 items-end">
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">From</label><input type="date" name="date_from" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" defaultValue={filters.date_from ?? ''} /></div>
                        <div><label className="block text-xs font-medium text-gray-500 mb-1">To</label><input type="date" name="date_to" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" defaultValue={filters.date_to ?? ''} /></div>
                        <button type="submit" className="bg-gray-600 hover:bg-gray-700 text-white text-sm font-medium py-2 px-4 rounded-lg">Apply</button>
                    </form>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Check In</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Check Out</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Remarks</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                            {items.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-12 text-center text-gray-500">No attendance records.</td></tr>
                            ) : items.map((att) => (
                                <tr key={att.id}>
                                    <td className="px-6 py-4 text-sm text-gray-900">{formatDate(att.attendance_session?.attendance_date)}</td>
                                    <td className="px-6 py-4"><span className="inline-flex px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 capitalize">{att.status}</span></td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{att.check_in ?? '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{att.check_out ?? '—'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{att.remarks ?? '—'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
