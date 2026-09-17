import React, { useEffect, useState } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import axios from 'axios';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ParentQuickCreateModal from '@/Components/Dashboard/ParentQuickCreateModal';
import ParentFieldSelect from '@/Components/Dashboard/ParentFieldSelect';
import ClassSectionGroupSelect from '@/Components/Dashboard/ClassSectionGroupSelect';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faClipboardList, faSave, faUserGraduate, faKey, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

const inputClass = (err) =>
    `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;

export default function StudentCreate({ parents = [], classSectionGroups = [] }) {
    const [parentList, setParentList] = useState(parents);
    const [showParentModal, setShowParentModal] = useState(false);
    const [loadingNumber, setLoadingNumber] = useState(false);
    const [parentCopied, setParentCopied] = useState(false);

    const form = useForm({
        name: '',
        email: '',
        phone: '',
        first_name: '',
        last_name: '',
        cnic: '',
        profile_photo: null,
        date_of_birth: '',
        gender: '',
        address: '',
        parent_id: '',
        parent_generated_password: '',
        sibling_discount_eligible: false,
        class_section_group_id: '',
        enrollment_admission_date: new Date().toISOString().split('T')[0],
        enrollment_status: 'active',
    });

    const groups = Array.isArray(classSectionGroups) ? classSectionGroups : [];
    const [studentNumber, setStudentNumber] = useState('');

    useEffect(() => {
        if (!form.data.class_section_group_id && groups.length > 0) {
            form.setData('class_section_group_id', String(groups[0].id));
        }
    }, [groups]);

    useEffect(() => {
        if (!form.data.class_section_group_id) {
            setStudentNumber('');
            return;
        }

        let cancelled = false;
        setLoadingNumber(true);

        axios
            .get(route('academic.students.next-roll-number'), {
                params: { class_section_group_id: form.data.class_section_group_id },
            })
            .then(({ data }) => {
                if (!cancelled) {
                    setStudentNumber(data.number ?? '');
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setStudentNumber('');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoadingNumber(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [form.data.class_section_group_id]);

    const submit = (e) => {
        e.preventDefault();
        const hasFile = form.data.profile_photo instanceof File;
        form.post(route('academic.students.store'), {
            preserveScroll: true,
            forceFormData: hasFile,
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Create Student" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="mb-6 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faUserGraduate} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Create Student</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Creates a user account, student profile, and enrollment in one step.</p>
                            </div>
                        </div>
                        <Link
                            href={route('academic.students')}
                            className="inline-flex items-center gap-2 rounded-lg bg-gray-100 hover:bg-gray-200 px-3 py-2 text-sm font-medium text-gray-700"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />
                          
                        </Link>
                    </div>

                    {Object.keys(form.errors).length > 0 && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            <p className="font-semibold mb-1">Could not save the student:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                                {Object.entries(form.errors).map(([field, message]) => (
                                    <li key={field}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    )}

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            <div className="lg:col-span-5 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 h-full">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">User Account</h2>
                                <p className="text-sm text-gray-500 mb-4">Role will be automatically set to <span className="font-medium text-amber-600">Student</span>.</p>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                                        <input className={inputClass(form.errors.name)} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
                                        {form.errors.name && <p className="text-red-500 text-sm mt-1">{form.errors.name}</p>}
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
                                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3.5 text-sm text-amber-900">
                                        <div className="flex items-center gap-2 font-medium text-amber-800">
                                            <span>🔑</span>
                                            <span>Automated Password Generation</span>
                                        </div>
                                        <p className="text-xs text-amber-700 mt-1">
                                            A secure, distinct login password for the Student Portal will be automatically generated upon creation.
                                        </p>
                                    </div>
                                    {form.data.parent_generated_password && (() => {
                                        const linkedParent = parentList.find(p => String(p.id) === String(form.data.parent_id));
                                        const parentLogin = linkedParent?.user?.id_card_number || linkedParent?.id_card_number || '';
                                        const parentName = linkedParent?.user?.name || linkedParent?.name || 'Parent';

                                        const copyParentCreds = () => {
                                            const text = `=== Parent Portal Login ===\nName: ${parentName}\nLogin ID: ${parentLogin}\nPassword: ${form.data.parent_generated_password}`;
                                            navigator.clipboard.writeText(text);
                                            setParentCopied(true);
                                            setTimeout(() => setParentCopied(false), 3000);
                                        };

                                        return (
                                            <div className="rounded-lg bg-emerald-50 border border-emerald-300 p-3.5 text-xs text-emerald-900 space-y-2">
                                                <div className="flex items-center justify-between gap-2">
                                                    <div className="font-bold text-emerald-800 text-xs flex items-center gap-1.5">
                                                        <FontAwesomeIcon icon={faKey} />
                                                        <span>New Parent Login Credentials</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={copyParentCreds}
                                                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 rounded text-xs font-semibold transition shadow-sm"
                                                    >
                                                        <FontAwesomeIcon icon={parentCopied ? faCheck : faCopy} />
                                                        {parentCopied ? 'Copied!' : 'Copy Parent Login'}
                                                    </button>
                                                </div>
                                                <div className="bg-white/80 rounded p-2 border border-emerald-200 space-y-1">
                                                    <div><span className="text-gray-500 font-medium">Name:</span> <span className="font-semibold">{parentName}</span></div>
                                                    <div><span className="text-gray-500 font-medium">Login ID:</span> <code className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-900 font-mono font-bold">{parentLogin}</code></div>
                                                    <div><span className="text-gray-500 font-medium">Password:</span> <code className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 rounded font-mono font-bold">{form.data.parent_generated_password}</code></div>
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            </div>

                            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 h-full">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Student Profile</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                                        <input className={inputClass(form.errors.first_name)} value={form.data.first_name} onChange={(e) => form.setData('first_name', e.target.value)} />
                                        {form.errors.first_name && <p className="text-red-500 text-sm mt-1">{form.errors.first_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                                        <input className={inputClass(form.errors.last_name)} value={form.data.last_name} onChange={(e) => form.setData('last_name', e.target.value)} />
                                        {form.errors.last_name && <p className="text-red-500 text-sm mt-1">{form.errors.last_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CNIC / B-Form</label>
                                        <input className={inputClass(form.errors.cnic)} maxLength={15} placeholder="13 digits" value={form.data.cnic} onChange={(e) => form.setData('cnic', e.target.value)} />
                                        {form.errors.cnic && <p className="text-red-500 text-sm mt-1">{form.errors.cnic}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                                        <input type="date" className={inputClass(form.errors.date_of_birth)} value={form.data.date_of_birth} onChange={(e) => form.setData('date_of_birth', e.target.value)} />
                                        {form.errors.date_of_birth && <p className="text-red-500 text-sm mt-1">{form.errors.date_of_birth}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                                        <select className={inputClass(form.errors.gender)} value={form.data.gender} onChange={(e) => form.setData('gender', e.target.value)}>
                                            <option value="">Select</option>
                                            <option value="male">Male</option>
                                            <option value="female">Female</option>
                                            <option value="other">Other</option>
                                        </select>
                                        {form.errors.gender && <p className="text-red-500 text-sm mt-1">{form.errors.gender}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Profile Photo</label>
                                        <input type="file" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml" className={inputClass(form.errors.profile_photo)} onChange={(e) => form.setData('profile_photo', e.target.files[0] || null)} />
                                        {form.data.profile_photo && <p className="text-green-600 text-xs mt-1">Selected: {form.data.profile_photo.name}</p>}
                                        {form.errors.profile_photo && <p className="text-red-500 text-sm mt-1">{form.errors.profile_photo}</p>}
                                    </div>
                                    <ParentFieldSelect
                                        parentList={parentList}
                                        value={form.data.parent_id}
                                        onChange={(id) => form.setData('parent_id', id)}
                                        onNew={() => setShowParentModal(true)}
                                        error={form.errors.parent_id}
                                        inputClass={inputClass}
                                    />
                                    <div className="md:col-span-2">
                                        <label className="inline-flex items-start gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="mt-1 rounded border-gray-300 text-amber-500 focus:ring-amber-500"
                                                checked={!!form.data.sibling_discount_eligible}
                                                onChange={(e) => form.setData('sibling_discount_eligible', e.target.checked)}
                                            />
                                            <span>
                                                <span className="block text-sm font-medium text-gray-700">Apply sibling discount</span>
                                                <span className="block text-xs text-gray-500 mt-0.5">
                                                    Enable only for the child who should get sibling discount. Others under the same parent can stay unchecked.
                                                </span>
                                            </span>
                                        </label>
                                        {form.errors.sibling_discount_eligible && (
                                            <p className="text-red-500 text-sm mt-1">{form.errors.sibling_discount_eligible}</p>
                                        )}
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                                        <textarea rows={2} className={inputClass(form.errors.address)} value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} />
                                        {form.errors.address && <p className="text-red-500 text-sm mt-1">{form.errors.address}</p>}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                    <FontAwesomeIcon icon={faClipboardList} className="text-amber-500" />
                                </div>
                                <div>
                                    <h2 className="text-base font-semibold text-gray-900">Enrollment</h2>
                                    <p className="text-sm text-gray-500">Assign the student to a class section group.</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <ClassSectionGroupSelect
                                    className="md:col-span-2"
                                    groups={groups}
                                    value={form.data.class_section_group_id}
                                    onChange={(id) => form.setData('class_section_group_id', id)}
                                    error={form.errors.class_section_group_id}
                                    inputClass={inputClass}
                                    required
                                />
                                {groups.length === 0 && (
                                    <p className="md:col-span-2 text-amber-600 text-sm -mt-2">No class section groups found. Create one under Academic first.</p>
                                )}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission / Roll Number</label>
                                    <input
                                        readOnly
                                        className={`${inputClass()} bg-gray-50 text-gray-700 cursor-not-allowed`}
                                        value={loadingNumber ? 'Generating...' : studentNumber}
                                        placeholder="Select class section group"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Auto: Class-Section-Group-01, then +1 for each student.</p>
                                    {(form.errors.admission_number || form.errors.roll_number) && (
                                        <p className="text-red-500 text-sm mt-1">{form.errors.admission_number || form.errors.roll_number}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date</label>
                                    <input
                                        type="date"
                                        className={inputClass(form.errors.enrollment_admission_date)}
                                        value={form.data.enrollment_admission_date}
                                        onChange={(e) => form.setData('enrollment_admission_date', e.target.value)}
                                    />
                                    {form.errors.enrollment_admission_date && <p className="text-red-500 text-sm mt-1">{form.errors.enrollment_admission_date}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                                    <select
                                        className={inputClass(form.errors.enrollment_status)}
                                        value={form.data.enrollment_status}
                                        onChange={(e) => form.setData('enrollment_status', e.target.value)}
                                    >
                                        <option value="active">Active</option>
                                        <option value="promoted">Promoted</option>
                                        <option value="left">Left</option>
                                    </select>
                                    {form.errors.enrollment_status && <p className="text-red-500 text-sm mt-1">{form.errors.enrollment_status}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3">
                            <Link href={route('academic.students')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm">
                                Cancel
                            </Link>
                            <button type="submit" disabled={form.processing} className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm disabled:opacity-50 inline-flex items-center gap-2">
                                <FontAwesomeIcon icon={faSave} className="text-xs" />
                                {form.processing ? 'Saving...' : 'Save'}
                            </button>
                        </div>
                    </form>

                    <ParentQuickCreateModal
                        show={showParentModal}
                        onClose={() => setShowParentModal(false)}
                        onCreated={(parent, generatedPassword) => {
                            setParentList((prev) => [...prev, parent]);
                            form.setData((prev) => ({
                                ...prev,
                                parent_id: String(parent.id),
                                parent_generated_password: generatedPassword || '',
                            }));
                        }}
                    />
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
