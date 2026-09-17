import React, { useState, useEffect, useMemo } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import SearchableSelect from '@/Components/Dashboard/SearchableSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTrashCan, faPen, faLayerGroup, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

function personLabel(name, code) {
    const n = (name || '').trim() || '—';
    const c = code != null ? String(code).trim() : '';
    return c && c !== '—' ? `${n} (${c})` : n;
}

const selectInputClass =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500';

export default function SalaryStructures({ salaryStructures = [], employees = [], teachers = [], allowances = [], deductions = [] }) {
    const { flash } = usePage().props;
    const list = Array.isArray(salaryStructures) ? salaryStructures : [];
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [banner, setBanner] = useState({ type: '', message: '' });
    const [allowanceRows, setAllowanceRows] = useState([]);
    const [deductionRows, setDeductionRows] = useState([]);
    const { data, setData, post, put, processing, errors, reset } = useForm({
        staff_type: 'employee',
        employee_id: '',
        teacher_id: '',
        basic_salary: '',
        is_active: true,
        allowances: [],
        deductions: [],
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
        setData({ staff_type: 'employee', employee_id: '', teacher_id: '', basic_salary: '', is_active: true, allowances: [], deductions: [] });
        setAllowanceRows([]);
        setDeductionRows([]);
        setShowModal(true);
    };
    const openEdit = (item) => {
        setEditingItem(item);
        const staffType = item.teacher_id ? 'teacher' : 'employee';
        const all = (item.allowances || []).map((a) => ({ allowance_id: a.allowance_id, value: a.value, type: a.type || 'fixed' }));
        const dll = (item.deductions || []).map((d) => ({ deduction_id: d.deduction_id, value: d.value, type: d.type || 'fixed' }));
        setData({
            staff_type: staffType,
            employee_id: staffType === 'employee' ? String(item.employee_id) : '',
            teacher_id: staffType === 'teacher' ? String(item.teacher_id) : '',
            basic_salary: String(item.basic_salary),
            is_active: item.is_active !== false,
            allowances: all,
            deductions: dll,
        });
        setAllowanceRows(all.length ? all.map((_, i) => i) : [0]);
        setDeductionRows(dll.length ? dll.map((_, i) => i) : [0]);
        setShowModal(true);
    };
    const addAllowanceRow = () => setAllowanceRows((r) => [...r, r.length]);
    const addDeductionRow = () => setDeductionRows((r) => [...r, r.length]);
    const removeAllowanceRow = (idx) => {
        setAllowanceRows((r) => r.filter((_, i) => i !== idx));
        setData('allowances', data.allowances.filter((_, i) => i !== idx));
    };
    const removeDeductionRow = (idx) => {
        setDeductionRows((r) => r.filter((_, i) => i !== idx));
        setData('deductions', data.deductions.filter((_, i) => i !== idx));
    };
    const handleSubmit = (e) => {
        e.preventDefault();
        const allowancesPayload = allowanceRows.map((_, i) => {
            const row = data.allowances[i] || {};
            return { allowance_id: row.allowance_id || allowances[0]?.id, value: row.value ?? 0, type: row.type || 'fixed' };
        }).filter((r) => r.allowance_id && Number(r.value) > 0);
        const deductionsPayload = deductionRows.map((_, i) => {
            const row = data.deductions[i] || {};
            return { deduction_id: row.deduction_id || deductions[0]?.id, value: row.value ?? 0, type: row.type || 'fixed' };
        }).filter((r) => r.deduction_id && Number(r.value) > 0);
        const payload = {
            employee_id: data.employee_id || undefined,
            teacher_id: data.teacher_id || undefined,
            basic_salary: data.basic_salary,
            is_active: data.is_active,
            allowances: allowancesPayload,
            deductions: deductionsPayload,
        };
        if (editingItem) {
            router.put(route('payroll.salary-structures.update', editingItem.id), payload, { preserveScroll: true, onSuccess: () => { setShowModal(false); reset(); } });
        } else {
            router.post(route('payroll.salary-structures.store'), payload, { preserveScroll: true, onSuccess: () => { setShowModal(false); reset(); } });
        }
    };
    const handleDelete = (item) => {
        if (!window.confirm(`Delete salary structure for ${item.employee_name}?`)) return;
        router.delete(route('payroll.salary-structures.destroy', item.id), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Salary Structure" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{banner.message}</div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Payroll Management', href: route('admin.payroll-management') },
                            { label: 'Salary Structures' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faLayerGroup} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Salary Structures</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Assign basic salary, allowances and deductions per employee.</p>
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
                            <button type="button" onClick={openAdd} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600">
                                <FontAwesomeIcon icon={faPlus} /> Add
                            </button>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Basic</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Allowances</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {list.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No salary structures. Add one for an employee.</td></tr>
                                ) : (
                                    list.map((item) => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{personLabel(item.employee_name, item.employee_identifier)}</td>
                                            <td className="px-6 py-4 text-right">{item.basic_salary}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{item.allowances?.length || 0} item(s)</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">{item.deductions?.length || 0} item(s)</td>
                                            <td className="px-6 py-4 text-right">
                                                <button type="button" onClick={() => openEdit(item)} className="text-amber-600 hover:text-amber-700 mr-3"><FontAwesomeIcon icon={faPen} /></button>
                                                <button type="button" onClick={() => handleDelete(item)} className="text-red-600 hover:text-red-700"><FontAwesomeIcon icon={faTrashCan} /></button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    {showModal && (
                        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto pt-20 pb-8 px-4">
                            <div className="bg-white rounded-lg p-6 w-full max-w-2xl shadow-xl">
                                <h2 className="text-xl font-semibold mb-4">{editingItem ? 'Edit Salary Structure' : 'Add Salary Structure'}</h2>
                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Staff type</label>
                                        <div className="flex gap-4">
                                            <label className="inline-flex items-center gap-2">
                                                <input type="radio" name="staff_type" checked={data.staff_type === 'employee'} onChange={() => setData({ ...data, staff_type: 'employee', teacher_id: '' })} className="rounded border-gray-300 text-amber-500" />
                                                Employee
                                            </label>
                                            <label className="inline-flex items-center gap-2">
                                                <input type="radio" name="staff_type" checked={data.staff_type === 'teacher'} onChange={() => setData({ ...data, staff_type: 'teacher', employee_id: '' })} className="rounded border-gray-300 text-amber-500" />
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
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                                        <input type="number" step="0.01" min={0} value={data.basic_salary} onChange={(e) => setData('basic_salary', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2" required />
                                        {errors.basic_salary && <p className="text-red-500 text-sm mt-1">{errors.basic_salary}</p>}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-700">Allowances</label>
                                            <button type="button" onClick={addAllowanceRow} className="text-sm text-amber-600 hover:text-amber-700">+ Add row</button>
                                        </div>
                                        {allowanceRows.map((idx) => (
                                            <div key={idx} className="flex gap-2 mb-2">
                                                <select
                                                    value={data.allowances[idx]?.allowance_id ?? ''}
                                                    onChange={(e) => {
                                                        const next = [...(data.allowances || [])];
                                                        next[idx] = { ...next[idx], allowance_id: e.target.value, value: next[idx]?.value ?? '', type: next[idx]?.type ?? 'fixed' };
                                                        setData('allowances', next);
                                                    }}
                                                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                                                >
                                                    <option value="">Select</option>
                                                    {(allowances || []).map((a) => (
                                                        <option key={a.id} value={a.id}>{a.name} ({a.type})</option>
                                                    ))}
                                                </select>
                                                <input type="number" step="0.01" min={0} placeholder="Value" className="w-24 border border-gray-300 rounded px-3 py-2"
                                                    value={data.allowances[idx]?.value ?? ''}
                                                    onChange={(e) => {
                                                        const next = [...(data.allowances || [])];
                                                        next[idx] = { ...next[idx], value: e.target.value, allowance_id: next[idx]?.allowance_id, type: next[idx]?.type ?? 'fixed' };
                                                        setData('allowances', next);
                                                    }}
                                                />
                                                <select
                                                    value={data.allowances[idx]?.type ?? 'fixed'}
                                                    onChange={(e) => {
                                                        const next = [...(data.allowances || [])];
                                                        next[idx] = { ...next[idx], type: e.target.value };
                                                        setData('allowances', next);
                                                    }}
                                                    className="w-28 border border-gray-300 rounded px-3 py-2"
                                                >
                                                    <option value="fixed">Fixed</option>
                                                    <option value="percentage">%</option>
                                                </select>
                                                <button type="button" onClick={() => removeAllowanceRow(idx)} className="text-red-500 hover:text-red-700"><FontAwesomeIcon icon={faTrashCan} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-sm font-medium text-gray-700">Deductions</label>
                                            <button type="button" onClick={addDeductionRow} className="text-sm text-amber-600 hover:text-amber-700">+ Add row</button>
                                        </div>
                                        {deductionRows.map((idx) => (
                                            <div key={idx} className="flex gap-2 mb-2">
                                                <select
                                                    value={data.deductions[idx]?.deduction_id ?? ''}
                                                    onChange={(e) => {
                                                        const next = [...(data.deductions || [])];
                                                        next[idx] = { ...next[idx], deduction_id: e.target.value, value: next[idx]?.value ?? '', type: next[idx]?.type ?? 'fixed' };
                                                        setData('deductions', next);
                                                    }}
                                                    className="flex-1 border border-gray-300 rounded px-3 py-2"
                                                >
                                                    <option value="">Select</option>
                                                    {(deductions || []).map((d) => (
                                                        <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                                                    ))}
                                                </select>
                                                <input type="number" step="0.01" min={0} placeholder="Value" className="w-24 border border-gray-300 rounded px-3 py-2"
                                                    value={data.deductions[idx]?.value ?? ''}
                                                    onChange={(e) => {
                                                        const next = [...(data.deductions || [])];
                                                        next[idx] = { ...next[idx], value: e.target.value, deduction_id: next[idx]?.deduction_id, type: next[idx]?.type ?? 'fixed' };
                                                        setData('deductions', next);
                                                    }}
                                                />
                                                <select
                                                    value={data.deductions[idx]?.type ?? 'fixed'}
                                                    onChange={(e) => {
                                                        const next = [...(data.deductions || [])];
                                                        next[idx] = { ...next[idx], type: e.target.value };
                                                        setData('deductions', next);
                                                    }}
                                                    className="w-28 border border-gray-300 rounded px-3 py-2"
                                                >
                                                    <option value="fixed">Fixed</option>
                                                    <option value="percentage">%</option>
                                                </select>
                                                <button type="button" onClick={() => removeDeductionRow(idx)} className="text-red-500 hover:text-red-700"><FontAwesomeIcon icon={faTrashCan} /></button>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="is_active" checked={data.is_active} onChange={(e) => setData('is_active', e.target.checked)} className="rounded border-gray-300 text-amber-500" />
                                        <label htmlFor="is_active" className="text-sm text-gray-700">Active</label>
                                    </div>
                                    <div className="flex justify-end gap-2 pt-2">
                                        <button type="button" onClick={() => { setShowModal(false); reset(); }} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                                        <button type="submit" disabled={processing} className="px-4 py-2 bg-amber-500 text-white rounded hover:bg-amber-600 disabled:opacity-50">Save</button>
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
