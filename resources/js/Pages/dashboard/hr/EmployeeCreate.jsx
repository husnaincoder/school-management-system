import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faUserTie } from '@fortawesome/free-solid-svg-icons';

const inputClass = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;

const STATUS_OPTIONS = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'on_leave', label: 'On Leave' },
    { value: 'terminated', label: 'Terminated' },
];

export default function EmployeeCreate({ departments = [], designations = [] }) {
    const deptList = Array.isArray(departments) ? departments : [];
    const desigList = Array.isArray(designations) ? designations : [];

    const form = useForm({
        name: '',
        id_card_number: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        employee_id: '',
        department: '',
        designation: '',
        joining_date: '',
        basic_salary: '',
        status: 'active',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        qualification: '',
        experience: '',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post(route('hr.employees.store'), { preserveScroll: true });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Employee" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserTie} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Create Employee</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Creates a new user account with role <strong>Employee</strong> and an employee profile.</p>
                            </div>
                        </div>
                        <Link
                            href={route('hr.employees')}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                            Back
                        </Link>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                                    <h2 className="text-base font-semibold text-gray-900 mb-4">User Account</h2>
                                    <p className="text-sm text-gray-500 mb-4">Role will be automatically set to <span className="font-medium text-amber-600">Employee</span>.</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                            <input className={inputClass(form.errors.name)} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                            {form.errors.name && <p className="text-red-500 text-sm mt-1">{form.errors.name}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">ID Card Number *</label>
                                            <input className={inputClass(form.errors.id_card_number)} value={form.data.id_card_number} onChange={(e) => form.setData('id_card_number', e.target.value)} required />
                                            {form.errors.id_card_number && <p className="text-red-500 text-sm mt-1">{form.errors.id_card_number}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email (optional)</label>
                                            <input type="email" className={inputClass(form.errors.email)} value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                                            {form.errors.email && <p className="text-red-500 text-sm mt-1">{form.errors.email}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                                            <input className={inputClass(form.errors.phone)} value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                                            {form.errors.phone && <p className="text-red-500 text-sm mt-1">{form.errors.phone}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                            <input type="password" className={inputClass(form.errors.password)} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} required />
                                            {form.errors.password && <p className="text-red-500 text-sm mt-1">{form.errors.password}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                                            <input type="password" className={inputClass(form.errors.password_confirmation)} value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} required />
                                            {form.errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{form.errors.password_confirmation}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 min-h-0">
                                    <h2 className="text-base font-semibold text-gray-900 mb-4">Qualification</h2>
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <textarea rows={6} className={`${inputClass(form.errors.qualification)} flex-1 min-h-[120px] resize-y`} value={form.data.qualification} onChange={(e) => form.setData('qualification', e.target.value)} />
                                        {form.errors.qualification && <p className="text-red-500 text-sm mt-1">{form.errors.qualification}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 h-full flex flex-col">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Employee Profile</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                                    <input className={inputClass(form.errors.employee_id)} value={form.data.employee_id} onChange={(e) => form.setData('employee_id', e.target.value)} placeholder="Auto if empty" />
                                    {form.errors.employee_id && <p className="text-red-500 text-sm mt-1">{form.errors.employee_id}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select className={inputClass(form.errors.status)} value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>
                                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                                    </select>
                                    {form.errors.status && <p className="text-red-500 text-sm mt-1">{form.errors.status}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                                    <input className={inputClass(form.errors.department)} list="dept-list" value={form.data.department} onChange={(e) => form.setData('department', e.target.value)} />
                                    <datalist id="dept-list">{deptList.map((d) => <option key={d} value={d} />)}</datalist>
                                    {form.errors.department && <p className="text-red-500 text-sm mt-1">{form.errors.department}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
                                    <input className={inputClass(form.errors.designation)} list="desig-list" value={form.data.designation} onChange={(e) => form.setData('designation', e.target.value)} />
                                    <datalist id="desig-list">{desigList.map((d) => <option key={d} value={d} />)}</datalist>
                                    {form.errors.designation && <p className="text-red-500 text-sm mt-1">{form.errors.designation}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Joining Date</label>
                                    <input type="date" className={inputClass(form.errors.joining_date)} value={form.data.joining_date} onChange={(e) => form.setData('joining_date', e.target.value)} />
                                    {form.errors.joining_date && <p className="text-red-500 text-sm mt-1">{form.errors.joining_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Basic Salary</label>
                                    <input type="number" step="0.01" min="0" className={inputClass(form.errors.basic_salary)} value={form.data.basic_salary} onChange={(e) => form.setData('basic_salary', e.target.value)} />
                                    {form.errors.basic_salary && <p className="text-red-500 text-sm mt-1">{form.errors.basic_salary}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea rows={2} className={inputClass(form.errors.address)} value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                                    {form.errors.address && <p className="text-red-500 text-sm mt-1">{form.errors.address}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                                    <input className={inputClass(form.errors.emergency_contact)} value={form.data.emergency_contact} onChange={(e) => form.setData('emergency_contact', e.target.value)} />
                                    {form.errors.emergency_contact && <p className="text-red-500 text-sm mt-1">{form.errors.emergency_contact}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                                    <input className={inputClass(form.errors.emergency_phone)} value={form.data.emergency_phone} onChange={(e) => form.setData('emergency_phone', e.target.value)} />
                                    {form.errors.emergency_phone && <p className="text-red-500 text-sm mt-1">{form.errors.emergency_phone}</p>}
                                </div>
                                <div className="md:col-span-2 flex flex-col min-h-[120px]">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                                    <textarea rows={6} className={`${inputClass(form.errors.experience)} flex-1 min-h-[120px] resize-y`} value={form.data.experience} onChange={(e) => form.setData('experience', e.target.value)} />
                                    {form.errors.experience && <p className="text-red-500 text-sm mt-1">{form.errors.experience}</p>}
                                </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <Link href={route('hr.employees')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">
                                Cancel
                            </Link>
                            <button type="submit" disabled={form.processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faSave} className="text-xs" />
                                {form.processing ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}

