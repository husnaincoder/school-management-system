import React, { useRef, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChalkboardTeacher, faArrowLeft, faUpload } from '@fortawesome/free-solid-svg-icons';

const emptyQualification = { degree_name: '', field_of_study: '', board_university: '', passing_year: '', grade_division: '', certificate_image: null };

export default function TeacherCreate() {
    const form = useForm({
        name: '',
        id_card_number: '',
        email: '',
        phone: '',
        password: '',
        password_confirmation: '',
        staff_id: '',
        department: '',
        designation: '',
        joining_date: '',
        specialization: '',
        experience: '',
        basic_salary: '',
        cv: null,
        id_card_front: null,
        id_card_back: null,
        status: 'active',
        address: '',
        emergency_contact: '',
        emergency_phone: '',
        photo: null,
        is_active: true,
        qualifications: [{ ...emptyQualification }],
    });

    const addQual = () => form.setData('qualifications', [...form.data.qualifications, { ...emptyQualification }]);
    const removeQual = (idx) => {
        const q = form.data.qualifications.filter((_, i) => i !== idx);
        form.setData('qualifications', q.length ? q : [{ ...emptyQualification }]);
    };
    const setQual = (idx, field, value) => {
        const q = [...form.data.qualifications];
        q[idx] = { ...q[idx], [field]: value };
        form.setData('qualifications', q);
    };

    const hasNewFile = (value) => value instanceof File;

    const submit = (e) => {
        e.preventDefault();
        const hasFiles =
            hasNewFile(form.data.cv) ||
            hasNewFile(form.data.id_card_front) ||
            hasNewFile(form.data.id_card_back) ||
            hasNewFile(form.data.photo) ||
            form.data.qualifications.some((q) => hasNewFile(q.certificate_image));

        form.post(route('admin.teachers.store'), {
            preserveScroll: true,
            forceFormData: hasFiles,
        });
    };

    const [dragField, setDragField] = useState(null);
    const refCv = useRef(null);
    const refIdCardFront = useRef(null);
    const refIdCardBack = useRef(null);
    const refPhoto = useRef(null);
    const refQual = useRef({});

    const inputClass = (err) => `w-full border rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${err ? 'border-red-500' : 'border-gray-300'}`;

    const FileDrop = ({ fieldKey, label, accept, file, onFile, onClear, inputRef, compact }) => {
        const isDragging = dragField === fieldKey;
        const zoneClass = `cursor-pointer rounded-xl border-2 border-dashed transition-all duration-200 py-6 px-4 text-center ${compact ? 'py-4' : ''} ${isDragging ? 'border-amber-400 bg-amber-50' : 'border-gray-300 bg-gray-50/50 hover:border-amber-300 hover:bg-amber-50/30'}`;
        return (
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
                <input type="file" ref={inputRef} className="hidden" accept={accept} onChange={(e) => onFile(e.target.files?.[0] || null)} />
                {file ? (
                    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border border-gray-200 bg-gray-50">
                        <span className="text-sm font-medium text-gray-700 truncate flex-1" title={file.name}>{file.name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                            <button type="button" onClick={() => inputRef.current?.click()} className="text-sm text-amber-600 hover:text-amber-700 font-medium">Change</button>
                            <button type="button" onClick={() => { onClear(); inputRef.current && (inputRef.current.value = ''); }} className="text-sm text-red-600 hover:text-red-700 font-medium">Remove</button>
                        </div>
                    </div>
                ) : (
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setDragField(fieldKey); }}
                        onDragLeave={(e) => { e.preventDefault(); setDragField(null); }}
                        onDrop={(e) => { e.preventDefault(); setDragField(null); const f = e.dataTransfer.files?.[0]; if (f) onFile(f); }}
                        className={zoneClass}
                    >
                        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
                            <div className={`rounded-full bg-gray-200 flex items-center justify-center ${compact ? 'w-8 h-8' : 'w-10 h-10'}`}>
                                <FontAwesomeIcon icon={faUpload} className={compact ? 'text-sm text-gray-500' : 'text-lg text-gray-500'} />
                            </div>
                            <span className="text-sm font-medium text-gray-600">{isDragging ? 'Drop file here' : 'Drag & drop or click'}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <AuthenticatedLayout>
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'User Management', href: route('admin.user-management') },
                            { label: 'Teachers', href: route('admin.teachers') },
                            { label: 'Add Teacher' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faChalkboardTeacher} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Add Teacher</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Creates a new user account with role <strong>Teacher</strong> and a teacher profile.</p>
                            </div>
                        </div>
                        <Link href={route('admin.teachers')} className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        </Link>
                    </div>

                    <form onSubmit={submit} className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                            <div className="lg:col-span-5 flex flex-col gap-6">
                                <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                                    <h2 className="text-base font-semibold text-gray-900 mb-4">User Account</h2>
                                    <p className="text-sm text-gray-500 mb-4">Role will be automatically set to <span className="font-medium text-amber-600">Teacher</span>.</p>
                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Name *</label>
                                            <input type="text" className={inputClass(form.errors.name)} value={form.data.name} onChange={(e) => form.setData('name', e.target.value)} required />
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
                                            <input type="text" className={inputClass(form.errors.phone)} value={form.data.phone} onChange={(e) => form.setData('phone', e.target.value)} />
                                            {form.errors.phone && <p className="text-red-500 text-sm mt-1">{form.errors.phone}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                                            <input type="password" className={inputClass(form.errors.password)} value={form.data.password} onChange={(e) => form.setData('password', e.target.value)} required />
                                            {form.errors.password && <p className="text-red-500 text-sm mt-1">{form.errors.password}</p>}
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                                            <input type="password" className={inputClass(form.errors.password_confirmation)} value={form.data.password_confirmation} onChange={(e) => form.setData('password_confirmation', e.target.value)} required />
                                            {form.errors.password_confirmation && <p className="text-red-500 text-sm mt-1">{form.errors.password_confirmation}</p>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 min-h-0">
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-base font-semibold text-gray-900">Qualifications</h2>
                                        <button type="button" onClick={addQual} className="text-sm font-medium text-amber-600 hover:text-amber-700">+ Add</button>
                                    </div>
                                    <div className="flex-1 overflow-y-auto min-h-0">
                                        {form.data.qualifications.map((q, idx) => (
                                            <div key={idx} className="grid grid-cols-1 gap-3 mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 last:mb-0">
                                                <div className="flex justify-end"><button type="button" onClick={() => removeQual(idx)} className="text-red-500 hover:text-red-600 text-sm font-medium">Remove</button></div>
                                                <div><label className="block text-xs font-medium text-gray-500 mb-1">Degree</label><input type="text" className={inputClass()} value={q.degree_name} onChange={(e) => setQual(idx, 'degree_name', e.target.value)} /></div>
                                                <div><label className="block text-xs font-medium text-gray-500 mb-1">Field</label><input type="text" className={inputClass()} value={q.field_of_study} onChange={(e) => setQual(idx, 'field_of_study', e.target.value)} /></div>
                                                <div><label className="block text-xs font-medium text-gray-500 mb-1">Board / University</label><input type="text" className={inputClass()} value={q.board_university} onChange={(e) => setQual(idx, 'board_university', e.target.value)} /></div>
                                                <div><label className="block text-xs font-medium text-gray-500 mb-1">Passing Year</label><input type="number" min="1900" max="2100" className={inputClass()} value={q.passing_year} onChange={(e) => setQual(idx, 'passing_year', e.target.value)} /></div>
                                                <div><label className="block text-xs font-medium text-gray-500 mb-1">Grade / Division</label><input type="text" className={inputClass()} value={q.grade_division} onChange={(e) => setQual(idx, 'grade_division', e.target.value)} /></div>
                                                <div>
                                                    <FileDrop fieldKey={`qual_${idx}`} label="Certificate (Image / PDF)" accept=".pdf,.jpg,.jpeg,.png,.gif" file={q.certificate_image} onFile={(f) => setQual(idx, 'certificate_image', f)} onClear={() => setQual(idx, 'certificate_image', null)} inputRef={{ get current() { return refQual.current[idx]; }, set current(el) { refQual.current[idx] = el; } }} compact />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-7 bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6 h-full">
                                <h2 className="text-base font-semibold text-gray-900 mb-4">Teacher Profile</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Staff ID</label><input type="text" className={inputClass()} value={form.data.staff_id} onChange={(e) => form.setData('staff_id', e.target.value)} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Department</label><input type="text" className={inputClass()} value={form.data.department} onChange={(e) => form.setData('department', e.target.value)} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Designation</label><input type="text" className={inputClass()} value={form.data.designation} onChange={(e) => form.setData('designation', e.target.value)} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Joining Date</label><input type="date" className={inputClass()} value={form.data.joining_date} onChange={(e) => form.setData('joining_date', e.target.value)} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Specialization</label><input type="text" className={inputClass()} value={form.data.specialization} onChange={(e) => form.setData('specialization', e.target.value)} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Basic Salary</label><input type="number" step="0.01" min="0" className={inputClass()} value={form.data.basic_salary} onChange={(e) => form.setData('basic_salary', e.target.value)} /></div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                                <select className={inputClass()} value={form.data.status} onChange={(e) => form.setData('status', e.target.value)}>
                                    <option value="active">Active</option><option value="inactive">Inactive</option><option value="on_leave">On Leave</option><option value="left">Left</option>
                                </select>
                            </div>
                           
                            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Experience</label><textarea className={inputClass()} rows={2} value={form.data.experience} onChange={(e) => form.setData('experience', e.target.value)} /></div>
                            <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-2">Address</label><textarea className={inputClass()} rows={2} value={form.data.address} onChange={(e) => form.setData('address', e.target.value)} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contact</label><input type="text" className={inputClass()} value={form.data.emergency_contact} onChange={(e) => form.setData('emergency_contact', e.target.value)} /></div>
                            <div><label className="block text-sm font-medium text-gray-700 mb-2">Emergency Phone</label><input type="text" className={inputClass()} value={form.data.emergency_phone} onChange={(e) => form.setData('emergency_phone', e.target.value)} /></div>
                            <FileDrop fieldKey="photo" label="Photo (Image)" accept=".jpg,.jpeg,.png,.gif" file={form.data.photo} onFile={(f) => form.setData('photo', f)} onClear={() => form.setData('photo', null)} inputRef={refPhoto} />
                            <FileDrop fieldKey="cv" label="CV (PDF / Image)" accept=".pdf,.jpg,.jpeg,.png,.gif" file={form.data.cv} onFile={(f) => form.setData('cv', f)} onClear={() => form.setData('cv', null)} inputRef={refCv} />
                            <FileDrop fieldKey="id_card_front" label="ID Card Front (Image / PDF)" accept=".pdf,.jpg,.jpeg,.png,.gif" file={form.data.id_card_front} onFile={(f) => form.setData('id_card_front', f)} onClear={() => form.setData('id_card_front', null)} inputRef={refIdCardFront} />
                            <FileDrop fieldKey="id_card_back" label="ID Card Back (Image / PDF)" accept=".pdf,.jpg,.jpeg,.png,.gif" file={form.data.id_card_back} onFile={(f) => form.setData('id_card_back', f)} onClear={() => form.setData('id_card_back', null)} inputRef={refIdCardBack} />
                            <div className="md:col-span-2 flex items-center gap-2"><input type="checkbox" id="is_active" checked={form.data.is_active} onChange={(e) => form.setData('is_active', e.target.checked)} className="rounded border-gray-300 text-amber-600 focus:ring-amber-500" /><label htmlFor="is_active" className="text-sm font-medium text-gray-700">Active</label></div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3">
                            <Link href={route('admin.teachers')} className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg">Cancel</Link>
                            <button type="submit" disabled={form.processing} className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-6 rounded-lg disabled:opacity-50">{form.processing ? 'Saving...' : 'Save'}</button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
