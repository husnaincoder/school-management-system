import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faClock, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

const MONTHS = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
const monthName = (m) => new Date(2000, parseInt(m, 10) - 1, 1).toLocaleString('default', { month: 'short' });

function personLabel(name, code) {
    const n = (name || '').trim() || '—';
    const c = code != null ? String(code).trim() : '';
    return c ? `${n} (${c})` : n;
}

const selectInputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

export default function OvertimePayments({ overtimes = [], filterMonth, filterYear, employees = [], teachers = [] }) {
    const { flash } = usePage().props;
    const list = Array.isArray(overtimes) ? overtimes : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const { data, setData, post, put, processing, errors, reset } = useForm({
        staff_type: 'employee',
        employee_id: '',
        teacher_id: '',
        month: filterMonth || String(new Date().getMonth() + 1).padStart(2, '0'),
        year: filterYear || String(new Date().getFullYear()),
        hours: '',
        rate_per_hour: '',
        remarks: '',
    });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
    }, [flash?.success, flash?.error]);

    const employeeOptions = useMemo(
        () =>
            (employees || []).map((e) => {
                const label = personLabel(e.name, e.employee_id);
                return {
                    value: String(e.id),
                    label,
                    searchText: `${e.name || ''} ${e.employee_id || ''}`,
                    selectedLabel: label,
                };
            }),
        [employees]
    );

    const teacherOptions = useMemo(
        () =>
            (teachers || []).map((t) => {
                const label = personLabel(t.name, t.staff_id);
                return {
                    value: String(t.id),
                    label,
                    searchText: `${t.name || ''} ${t.staff_id || ''}`,
                    selectedLabel: label,
                };
            }),
        [teachers]
    );

    const openAdd = () => {
        setEditingItem(null);
        reset();
        setData({
            staff_type: 'employee',
            employee_id: '',
            teacher_id: '',
            month: filterMonth || String(new Date().getMonth() + 1).padStart(2, '0'),
            year: filterYear || String(new Date().getFullYear()),
            hours: '',
            rate_per_hour: '',
            remarks: '',
        });
        setShowModal(true);
    };

    const openEdit = (item) => {
        setEditingItem(item);
        const staffType = item.teacher_id ? 'teacher' : 'employee';
        setData({
            staff_type: staffType,
            employee_id: staffType === 'employee' ? String(item.employee_id) : '',
            teacher_id: staffType === 'teacher' ? String(item.teacher_id) : '',
            month: item.month,
            year: String(item.year),
            hours: String(item.hours),
            rate_per_hour: String(item.rate_per_hour),
            remarks: item.remarks || '',
        });
        setShowModal(true);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingItem) {
            router.put(
                route('payroll.overtime.update', editingItem.id),
                { hours: data.hours, rate_per_hour: data.rate_per_hour, remarks: data.remarks },
                { preserveScroll: true, onSuccess: () => { setShowModal(false); reset(); } }
            );
        } else {
            const payload = {
                employee_id: data.staff_type === 'employee' ? data.employee_id : null,
                teacher_id: data.staff_type === 'teacher' ? data.teacher_id : null,
                month: data.month,
                year: data.year,
                hours: data.hours,
                rate_per_hour: data.rate_per_hour,
                remarks: data.remarks,
            };
            router.post(route('payroll.overtime.store'), payload, {
                preserveScroll: true,
                onSuccess: () => { setShowModal(false); reset(); },
            });
        }
    };

    const handleDelete = (item) => {
        if (item.status === 'paid') return;
        if (!window.confirm('Delete this overtime entry?')) return;
        router.delete(route('payroll.overtime.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Overtime Payments" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Payroll Management', href: route('admin.payroll-management') },
                            { label: 'Overtime' },
                        ]}
                    />

                    <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faClock} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Overtime Payments</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Manage overtime hours and rates.</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Link
                                href={route('admin.payroll-management')}
                                className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                            >
                                <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                                Back
                            </Link>
                            <select
                                value={filterMonth}
                                onChange={(e) => router.get(route('payroll.overtime.index'), { month: e.target.value, year: filterYear })}
                                className="border border-gray-300 rounded-lg px-8 py-2"
                            >
                                <option value="">All months</option>
                                {MONTHS.map((m) => (
                                    <option key={m} value={m}>{monthName(m)}</option>
                                ))}
                            </select>
                            <select
                                value={filterYear}
                                onChange={(e) => router.get(route('payroll.overtime.index'), { month: filterMonth, year: e.target.value })}
                                className="border border-gray-300 rounded-lg px-8 py-2"
                            >
                                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                                    <option key={y} value={y}>{y}</option>
                                ))}
                            </select>
                            <button
                                type="button"
                                onClick={openAdd}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600"
                            >
                                <FontAwesomeIcon icon={faPlus} /> Add
                            </button>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Month / Year</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Hours</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Rate/hr</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-8 text-center text-gray-500">No overtime entries.</td>
                                    </tr>
                                ) : (
                                    list.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{item.employee_name}</td>
                                            <td className="px-6 py-4">{monthName(item.month)} {item.year}</td>
                                            <td className="px-6 py-4 text-right">{item.hours}</td>
                                            <td className="px-6 py-4 text-right">{item.rate_per_hour}</td>
                                            <td className="px-6 py-4 text-right">{item.amount}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 rounded text-xs ${item.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {item.status === 'pending' && (
                                                    <>
                                                        <button type="button" onClick={() => openEdit(item)} className="text-amber-600 hover:text-amber-700 mr-2">
                                                            <FontAwesomeIcon icon={faPen} />
                                                        </button>
                                                        <button type="button" onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-700">
                                                            <FontAwesomeIcon icon={faTrashCan} />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto pt-20 pb-8 px-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                                <h2 className="text-xl font-semibold mb-4">{editingItem ? 'Edit Overtime' : 'Add Overtime'}</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    {!editingItem && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Staff type</label>
                                                <div className="flex gap-4">
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="staff_type"
                                                            checked={data.staff_type === 'employee'}
                                                            onChange={() => setData({ ...data, staff_type: 'employee', teacher_id: '' })}
                                                            className="rounded border-gray-300 text-amber-500"
                                                        />
                                                        Employee
                                                    </label>
                                                    <label className="inline-flex items-center gap-2">
                                                        <input
                                                            type="radio"
                                                            name="staff_type"
                                                            checked={data.staff_type === 'teacher'}
                                                            onChange={() => setData({ ...data, staff_type: 'teacher', employee_id: '' })}
                                                            className="rounded border-gray-300 text-amber-500"
                                                        />
                                                        Teacher
                                                    </label>
                                                </div>
                                            </div>
                                            {data.staff_type === 'employee' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                                                    <SearchableSelect
                                                        options={employeeOptions}
                                                        value={data.employee_id}
                                                        onChange={(v) => setData('employee_id', v)}
                                                        placeholder="Search employee..."
                                                        emptyText="No employees found"
                                                        inputClassName={selectInputClass}
                                                    />
                                                    {errors.employee_id && <p className="text-red-500 text-sm mt-1">{errors.employee_id}</p>}
                                                </div>
                                            )}
                                            {data.staff_type === 'teacher' && (
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Teacher</label>
                                                    <SearchableSelect
                                                        options={teacherOptions}
                                                        value={data.teacher_id}
                                                        onChange={(v) => setData('teacher_id', v)}
                                                        placeholder="Search teacher..."
                                                        emptyText="No teachers found"
                                                        inputClassName={selectInputClass}
                                                    />
                                                    {errors.teacher_id && <p className="text-red-500 text-sm mt-1">{errors.teacher_id}</p>}
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {!editingItem && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                                                <select
                                                    value={data.month}
                                                    onChange={(e) => setData('month', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                                    required
                                                >
                                                    {MONTHS.map((m) => (
                                                        <option key={m} value={m}>{monthName(m)}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                                                <input
                                                    type="number"
                                                    min={2000}
                                                    max={2100}
                                                    value={data.year}
                                                    onChange={(e) => setData('year', e.target.value)}
                                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Hours</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={data.hours}
                                            onChange={(e) => setData('hours', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2"
                                            required
                                        />
                                        {errors.hours && <p className="text-red-500 text-sm mt-1">{errors.hours}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Rate per hour</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min={0}
                                            value={data.rate_per_hour}
                                            onChange={(e) => setData('rate_per_hour', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2"
                                            required
                                        />
                                        {errors.rate_per_hour && <p className="text-red-500 text-sm mt-1">{errors.rate_per_hour}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                                        <textarea
                                            value={data.remarks}
                                            onChange={(e) => setData('remarks', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2"
                                            rows={2}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => { setShowModal(false); reset(); }}
                                            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50"
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
