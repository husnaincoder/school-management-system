import React, { useEffect, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faFilter, faUserTie, faMoneyBillWave, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

function formatDate(value) {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'terminated', label: 'Terminated' },
];

export default function EmployeesIndex({
    employees = {},
    departments = [],
    filters = {},
}) {
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { flash } = usePage().props;

    const list = employees?.data ?? employees ?? [];
    const pagination = employees?.links ? { ...employees, data: undefined } : null;
    const deptList = Array.isArray(departments) ? departments : [];

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    const filterForm = useForm({ department: filters.department ?? '', status: filters.status ?? '' });
    const submitFilters = (e) => {
        e?.preventDefault();
        const params = {};
        if (filterForm.data.department) params.department = filterForm.data.department;
        if (filterForm.data.status) params.status = filterForm.data.status;
        router.get(route('hr.employees'), params, { preserveState: true });
    };

    const statusClass = (s) => {
        switch (s) {
            case 'active': return 'bg-green-100 text-green-800';
            case 'on_leave': return 'bg-amber-100 text-amber-800';
            case 'terminated': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AuthenticatedLayout>
            <Head title="Employee Management" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg border ${banner.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'User Management', href: route('admin.user-management') },
                            { label: 'Employees' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserTie} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Employee Management</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Add and manage staff (HR) employee records.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.user-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <Link
                                href={route('hr.employees.create')}
                                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faPlus} className="text-sm" />
                                Add Employee
                            </Link>
                        </div>
                    </div>

                    {/* Filters Card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                        <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                            Filters
                        </h2>
                        <form onSubmit={submitFilters} className="flex flex-wrap items-center justify-between gap-4">
                            <div className="flex flex-wrap items-center gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <select className="min-w-[160px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500" value={filterForm.data.department} onChange={(e) => filterForm.setData('department', e.target.value)}>
                                        <option value="">All</option>
                                        {deptList.map((d) => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select className="min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500" value={filterForm.data.status} onChange={(e) => filterForm.setData('status', e.target.value)}>
                                        <option value="">All</option>
                                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                                Filter
                            </button>
                        </form>
                    </div>

                    {/* Table card */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200">
                            <h2 className="text-lg font-semibold text-gray-900">Employees</h2>
                            <p className="text-sm text-gray-500 mt-0.5">{list.length} employee{list.length !== 1 ? 's' : ''}</p>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Designation</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joining Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Salary</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {list.length === 0 ? (
                                        <tr>
                                            <td colSpan={8} className="px-6 py-8 text-center text-gray-500">No employees found. Click &quot;Add Employee&quot; to create one.</td>
                                        </tr>
                                    ) : list.map((emp) => (
                                        <tr key={emp.id}>
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{emp.user?.name}</div>
                                                <div className="text-sm text-gray-500">{emp.user?.email}</div>
                                            </td>
                                            <td className="px-6 py-4">{emp.employee_id ?? '—'}</td>
                                            <td className="px-6 py-4">{emp.department ?? '—'}</td>
                                            <td className="px-6 py-4">{emp.designation ?? '—'}</td>
                                            <td className="px-6 py-4">{formatDate(emp.joining_date)}</td>
                                            <td className="px-6 py-4">{emp.basic_salary != null ? Number(emp.basic_salary).toLocaleString() : '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 text-xs rounded ${statusClass(emp.status)}`}>
                                                    {emp.status ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <Link href={route('hr.employees.salary', emp.id)} className="text-amber-500 hover:text-amber-600 mr-3" title="Salary"><FontAwesomeIcon icon={faMoneyBillWave} className="text-sm" /></Link>
                                                <Link href={route('hr.employees.edit', emp.id)} className="text-amber-500 hover:text-amber-600" title="Edit"><FontAwesomeIcon icon={faPen} className="text-sm" /></Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {pagination?.links && pagination.links.length > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex flex-wrap items-center justify-end gap-1">
                                {pagination.links.map((link, i) => (
                                    <button
                                        key={i}
                                        type="button"
                                        onClick={() => link.url && router.get(link.url)}
                                        disabled={!link.url}
                                        className={`min-w-[2.25rem] px-2 py-1.5 rounded-lg text-sm font-medium ${link.active ? 'bg-amber-500 text-white' : link.url ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
