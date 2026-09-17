import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faSave, faUserGroup } from '@fortawesome/free-solid-svg-icons';

const inputClass = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;

export default function ParentEdit({ parent }) {
    const form = useForm({
        name: parent?.user?.name ?? '',
        id_card_number: parent?.user?.id_card_number ?? '',
        email: parent?.user?.email ?? '',
        phone: parent?.user?.phone ?? '',
        password: '',
        password_confirmation: '',
        spouse_name: parent?.spouse_name ?? '',
        relation_with_student: parent?.relation_with_student ?? 'Father',
        father_cnic: parent?.father_cnic ?? '',
        spouse_cnic: parent?.spouse_cnic ?? '',
        address: parent?.address ?? '',
        city: parent?.city ?? '',
        state: parent?.state ?? '',
        postal_code: parent?.postal_code ?? '',
        country: parent?.country ?? '',
        occupation: parent?.occupation ?? '',
        monthly_income: parent?.monthly_income ?? '',
        photo: null,
        is_active: parent?.is_active ?? true,
    });

    const submit = (e) => {
        e.preventDefault();
        const hasFile = form.data.photo instanceof File;
        form.patch(route('admin.parents.update', parent.id), {
            preserveScroll: true,
            forceFormData: hasFile,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Edit Parent" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGroup} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Edit Parent</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Role: <span className="font-medium text-amber-600">Parent</span></p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.parents')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            
                        </Link>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 h-full">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">User Account</h2>
                                <p className="text-sm text-gray-500 mb-4">Role: <span className="font-medium text-amber-600">Parent</span></p>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                                        <input className={inputClass(form.errors.name)} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                        {form.errors.name && <p className="text-red-500 text-sm mt-1">{form.errors.name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">ID Card Number *</label>
                                        <input className={inputClass(form.errors.id_card_number)} value={form.data.id_card_number} onChange={(e) => form.setData('id_card_number', e.target.value)} required />
                                        {form.errors.id_card_number && <p className="text-red-500 text-sm mt-1">{form.errors.id_card_number}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Email (optional)</label>
                                        <input type="email" className={inputClass(form.errors.email)} value={form.data.email} onChange={(e) => form.setData('email', e.target.value)} />
                                        {form.errors.email && <p className="text-red-500 text-sm mt-1">{form.errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                                        <input className={inputClass(form.errors.phone)} value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                                        {form.errors.phone && <p className="text-red-500 text-sm mt-1">{form.errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Password (leave blank to keep current)</label>
                                        <input type="password" className={inputClass(form.errors.password)} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} autoComplete="new-password" />
                                        {form.errors.password && <p className="text-red-500 text-sm mt-1">{form.errors.password}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                        <input type="password" className={inputClass(form.errors.password_confirmation)} value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} autoComplete="new-password" />
                                        {form.errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{form.errors.password_confirmation}</p>}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 h-full">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Parent Profile</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Relation with student</label>
                                    <select className={inputClass(form.errors.relation_with_student)} value={form.data.relation_with_student} onChange={(e) => form.setData('relation_with_student', e.target.value)}>
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Guardian">Guardian</option>
                                    </select>
                                    {form.errors.relation_with_student && <p className="text-red-500 text-sm mt-1">{form.errors.relation_with_student}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Guardian name</label>
                                    <input className={inputClass(form.errors.spouse_name)} value={form.data.spouse_name} onChange={(e) => form.setData('spouse_name', e.target.value)} />
                                    {form.errors.spouse_name && <p className="text-red-500 text-sm mt-1">{form.errors.spouse_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Father CNIC</label>
                                    <input className={inputClass(form.errors.father_cnic)} maxLength={15} placeholder="13 digits" value={form.data.father_cnic} onChange={(e) => form.setData('father_cnic', e.target.value)} />
                                    {form.errors.father_cnic && <p className="text-red-500 text-sm mt-1">{form.errors.father_cnic}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Guardian CNIC</label>
                                    <input className={inputClass(form.errors.spouse_cnic)} maxLength={15} placeholder="13 digits" value={form.data.spouse_cnic} onChange={(e) => form.setData('spouse_cnic', e.target.value)} />
                                    {form.errors.spouse_cnic && <p className="text-red-500 text-sm mt-1">{form.errors.spouse_cnic}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Occupation</label>
                                    <input className={inputClass(form.errors.occupation)} value={form.data.occupation} onChange={(e) => form.setData('occupation', e.target.value)} />
                                    {form.errors.occupation && <p className="text-red-500 text-sm mt-1">{form.errors.occupation}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Monthly income</label>
                                    <input type="number" step="0.01" min="0" className={inputClass(form.errors.monthly_income)} value={form.data.monthly_income} onChange={(e) => form.setData('monthly_income', e.target.value)} />
                                    {form.errors.monthly_income && <p className="text-red-500 text-sm mt-1">{form.errors.monthly_income}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                                    <textarea rows={2} className={inputClass(form.errors.address)} value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                                    {form.errors.address && <p className="text-red-500 text-sm mt-1">{form.errors.address}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                                    <input className={inputClass(form.errors.city)} value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} />
                                    {form.errors.city && <p className="text-red-500 text-sm mt-1">{form.errors.city}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                                    <input className={inputClass(form.errors.state)} value={form.data.state} onChange={(e) => form.setData('state', e.target.value)} />
                                    {form.errors.state && <p className="text-red-500 text-sm mt-1">{form.errors.state}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Postal code</label>
                                    <input className={inputClass(form.errors.postal_code)} value={form.data.postal_code} onChange={(e) => form.setData('postal_code', e.target.value)} />
                                    {form.errors.postal_code && <p className="text-red-500 text-sm mt-1">{form.errors.postal_code}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                                    <input className={inputClass(form.errors.country)} value={form.data.country} onChange={(e) => form.setData('country', e.target.value)} />
                                    {form.errors.country && <p className="text-red-500 text-sm mt-1">{form.errors.country}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Photo</label>
                                    {parent?.photo && !(form.data.photo instanceof File) && (
                                        <div className="mb-2">
                                            <img
                                                src={`/storage/${parent.photo}`}
                                                alt="Current"
                                                className="w-16 h-16 rounded-full object-cover border border-gray-200"
                                            />
                                        </div>
                                    )}
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        className={inputClass(form.errors.photo)}
                                        onChange={(e) => form.setData('photo', e.target.files?.[0] || null)}
                                    />
                                    {form.data.photo instanceof File && (
                                        <p className="text-green-600 text-xs mt-1">New file: {form.data.photo.name}</p>
                                    )}
                                    {form.errors.photo && <p className="text-red-500 text-sm mt-1">{form.errors.photo}</p>}
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2">
                                    <input type="checkbox" id="is_active" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                    <label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label>
                                </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Link href={route('admin.parents')} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">
                                Cancel
                            </Link>
                            <button type="submit" disabled={form.processing} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50 inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faSave} className="text-xs" />
                                {form.processing ? 'Updating...' : 'Update'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
