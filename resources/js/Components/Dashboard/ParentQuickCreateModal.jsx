import React, { useEffect, useState } from 'react';
import { useForm } from '@inertiajs/react';
import axios from 'axios';
import Modal from '@/Components/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSave, faXmark } from '@fortawesome/free-solid-svg-icons';

const inputClass = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;

const emptyForm = {
    name: '',
    id_card_number: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
    spouse_name: '',
    relation_with_student: 'Father',
    father_cnic: '',
    spouse_cnic: '',
    address: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    occupation: '',
    monthly_income: '',
    photo: null,
    is_active: true,
};

function getXsrfToken() {
    const match = document.cookie.match(/XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

function appendFormData(fd, key, value) {
    if (value === null || value === undefined || value === '') {
        return;
    }
    if (key === 'photo' && !(value instanceof File)) {
        return;
    }
    if (typeof value === 'boolean') {
        fd.append(key, value ? '1' : '0');
        return;
    }
    fd.append(key, value);
}

export default function ParentQuickCreateModal({ show, onClose, onCreated }) {
    const form = useForm({ ...emptyForm });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        if (!show) {
            form.clearErrors();
            form.setData({ ...emptyForm });
            setProcessing(false);
        }
    }, [show]);

    const submit = async (e) => {
        e.preventDefault();
        form.clearErrors();
        setProcessing(true);

        try {
            const fd = new FormData();
            Object.entries(form.data).forEach(([key, value]) => appendFormData(fd, key, value));

            const { data } = await axios.post(route('admin.parents.store-quick'), fd, {
                headers: {
                    Accept: 'application/json',
                    'X-XSRF-TOKEN': getXsrfToken(),
                },
            });

            onCreated?.(data.parent, data.generated_password);
            onClose?.();
        } catch (error) {
            if (error.response?.status === 422) {
                const errs = error.response.data.errors ?? {};
                const flat = Object.fromEntries(
                    Object.entries(errs).map(([key, messages]) => [
                        key,
                        Array.isArray(messages) ? messages[0] : messages,
                    ])
                );
                form.setError(flat);
            }
        } finally {
            setProcessing(false);
        }
    };

    return (
        <Modal show={show} onClose={onClose} maxWidth="7xl">
            <form onSubmit={submit} className="max-h-[90vh] flex flex-col">
                <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900">Create Parent</h2>
                        <p className="text-sm text-gray-500 mt-0.5">Add a new parent without leaving this page.</p>
                    </div>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <FontAwesomeIcon icon={faXmark} />
                    </button>
                </div>

                <div className="overflow-y-auto px-6 py-4 flex-1">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">User Account</h3>
                            <div className="grid grid-cols-1 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                    <input className={inputClass(form.errors.name)} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                    {form.errors.name && <p className="text-red-500 text-sm mt-1">{form.errors.name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">ID Card Number *</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. 3660315391873"
                                        className={inputClass(form.errors.id_card_number)}
                                        value={form.data.id_card_number}
                                        onChange={(e) => form.setData('id_card_number', e.target.value)}
                                        required
                                    />
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
                                <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-900">
                                    <div className="flex items-center gap-2 font-medium text-amber-800">
                                        <span>🔑</span>
                                        <span>Automated Password Generation</span>
                                    </div>
                                    <p className="text-xs text-amber-700 mt-1">
                                        A secure, distinct login password for the Parent Portal will be automatically generated.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3">Parent Profile</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation with student</label>
                                    <select className={inputClass(form.errors.relation_with_student)} value={form.data.relation_with_student} onChange={(e) => form.setData('relation_with_student', e.target.value)}>
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Guardian">Guardian</option>
                                    </select>
                                    {form.errors.relation_with_student && <p className="text-red-500 text-sm mt-1">{form.errors.relation_with_student}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Spouse name</label>
                                    <input className={inputClass(form.errors.spouse_name)} value={form.data.spouse_name} onChange={(e) => form.setData('spouse_name', e.target.value)} />
                                    {form.errors.spouse_name && <p className="text-red-500 text-sm mt-1">{form.errors.spouse_name}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Father CNIC</label>
                                    <input className={inputClass(form.errors.father_cnic)} maxLength={15} placeholder="13 digits" value={form.data.father_cnic} onChange={(e) => form.setData('father_cnic', e.target.value)} />
                                    {form.errors.father_cnic && <p className="text-red-500 text-sm mt-1">{form.errors.father_cnic}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Spouse CNIC</label>
                                    <input className={inputClass(form.errors.spouse_cnic)} maxLength={15} placeholder="13 digits" value={form.data.spouse_cnic} onChange={(e) => form.setData('spouse_cnic', e.target.value)} />
                                    {form.errors.spouse_cnic && <p className="text-red-500 text-sm mt-1">{form.errors.spouse_cnic}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                                    <input className={inputClass(form.errors.occupation)} value={form.data.occupation} onChange={(e) => form.setData('occupation', e.target.value)} />
                                    {form.errors.occupation && <p className="text-red-500 text-sm mt-1">{form.errors.occupation}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Monthly income</label>
                                    <input type="number" step="0.01" min="0" className={inputClass(form.errors.monthly_income)} value={form.data.monthly_income} onChange={(e) => form.setData('monthly_income', e.target.value)} />
                                    {form.errors.monthly_income && <p className="text-red-500 text-sm mt-1">{form.errors.monthly_income}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                    <textarea rows={2} className={inputClass(form.errors.address)} value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                                    {form.errors.address && <p className="text-red-500 text-sm mt-1">{form.errors.address}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                                    <input className={inputClass(form.errors.city)} value={form.data.city} onChange={(e) => form.setData('city', e.target.value)} />
                                    {form.errors.city && <p className="text-red-500 text-sm mt-1">{form.errors.city}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
                                    <input className={inputClass(form.errors.state)} value={form.data.state} onChange={(e) => form.setData('state', e.target.value)} />
                                    {form.errors.state && <p className="text-red-500 text-sm mt-1">{form.errors.state}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Postal code</label>
                                    <input className={inputClass(form.errors.postal_code)} value={form.data.postal_code} onChange={(e) => form.setData('postal_code', e.target.value)} />
                                    {form.errors.postal_code && <p className="text-red-500 text-sm mt-1">{form.errors.postal_code}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                                    <input className={inputClass(form.errors.country)} value={form.data.country} onChange={(e) => form.setData('country', e.target.value)} />
                                    {form.errors.country && <p className="text-red-500 text-sm mt-1">{form.errors.country}</p>}
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                                        className={inputClass(form.errors.photo)}
                                        onChange={(e) => form.setData('photo', e.target.files?.[0] || null)}
                                    />
                                    {form.data.photo instanceof File && (
                                        <p className="text-green-600 text-xs mt-1">Selected: {form.data.photo.name}</p>
                                    )}
                                    {form.errors.photo && <p className="text-red-500 text-sm mt-1">{form.errors.photo}</p>}
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2">
                                    <input type="checkbox" id="parent_modal_is_active" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                                    <label htmlFor="parent_modal_is_active" className="text-sm font-medium text-gray-700">Active</label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-gray-200 px-6 py-4">
                    <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">
                        Cancel
                    </button>
                    <button type="submit" disabled={processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 inline-flex items-center gap-2">
                        <FontAwesomeIcon icon={faSave} className="text-xs" />
                        {processing ? 'Saving...' : 'Save Parent'}
                    </button>
                </div>
            </form>
        </Modal>
    );
}
