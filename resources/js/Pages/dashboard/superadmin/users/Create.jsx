import React from 'react';
import {Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserPlus, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

export default function UserCreate({ roles = [] }) {
    const { data, setData, post, errors, processing } = useForm({
        name: '',
        id_card_number: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        role: '',
        is_active: true,
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('superadmin.users.store'));
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create User" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {/* Page Title - same as Index */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserPlus} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Create User</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Add a new user to the system</p>
                            </div>
                        </div>
                        <Link
                            href={route('superadmin.users.index')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.name ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                            </div>


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    ID Card Number <span className="text-xs text-gray-400 font-normal">(optional - auto-generated if blank)</span>
                                </label>
                                <input
                                    type="text"
                                    value={data.id_card_number}
                                    placeholder="Leave blank for automatic ID generation"
                                    onChange={(e) => setData('id_card_number', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.id_card_number ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.id_card_number && <p className="text-red-500 text-sm mt-1">{errors.id_card_number}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                                <input
                                    type="email"
                                    value={data.email}
                                    placeholder="user@example.com"
                                    onChange={(e) => setData('email', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                <input
                                    type="text"
                                    value={data.phone}
                                    onChange={(e) => setData('phone', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.phone ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                                <select
                                    value={data.role}
                                    onChange={(e) => setData('role', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.role ? 'border-red-500' : 'border-gray-300'}`}
                                >
                                    <option value="">Select Role</option>
                                    {roles.map((role) => {
                                        const labels = {
                                            super_admin: 'Super Admin',
                                            admin: 'Admin',
                                            accountant: 'Accountant',
                                            teacher: 'Teacher',
                                            class_incharge: 'Class Incharge',
                                            employee: 'Employee',
                                            student: 'Student',
                                            parent: 'Parent',
                                        };
                                        return (
                                            <option key={role.id} value={role.name}>
                                                {labels[role.name] || role.name}
                                            </option>
                                        );
                                    })}
                                </select>
                                {errors.role && <p className="text-red-500 text-sm mt-1">{errors.role}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Password <span className="text-xs text-gray-400 font-normal">(optional - auto-generated if blank)</span>
                                </label>
                                <input
                                    type="password"
                                    value={data.password}
                                    placeholder="Leave blank to auto-generate"
                                    onChange={(e) => setData('password', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    value={data.password_confirmation}
                                    placeholder="Confirm password"
                                    onChange={(e) => setData('password_confirmation', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${errors.password_confirmation ? 'border-red-500' : 'border-gray-300'}`}
                                />
                                {errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{errors.password_confirmation}</p>}
                            </div>

                            <div className="flex items-center gap-2 md:col-span-2">
                                <input
                                    type="checkbox"
                                    id="is_active"
                                    checked={data.is_active}
                                    onChange={(e) => setData('is_active', e.target.checked)}
                                    className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                                />
                                <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                                    Active
                                </label>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <Link
                                href={route('superadmin.users.index')}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
                            >
                                Cancel
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50"
                            >
                                Create User
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
