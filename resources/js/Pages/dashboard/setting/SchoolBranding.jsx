import React, { useState, useEffect } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSchool, faImage, faUpload, faArrowLeft, faGear } from '@fortawesome/free-solid-svg-icons';

const FILE_ACCEPT = 'image/jpeg,image/jpg,image/png,image/gif,image/svg+xml,image/webp';
const FAVICON_ACCEPT = 'image/x-icon,image/png,image/gif,image/svg+xml';

export default function SchoolBrandingPage(props) {
    const { props: pageProps } = usePage();
    const branding = props.branding ?? pageProps.branding ?? null;
    const { flash } = usePage().props;

    const [banner, setBanner] = useState({ type: '', message: '' });
    const [previews, setPreviews] = useState({
        logo_light: null,
        logo_dark: null,
        logo_small: null,
        favicon: null,
    });

    const { data, setData, post, processing, errors } = useForm({
        company_name: branding?.company_name ?? '',
        logo_light: null,
        logo_dark: null,
        logo_small: null,
        favicon: null,
    });

    useEffect(() => {
        if (flash?.success) setBanner({ type: 'success', message: flash.success });
        else if (flash?.error) setBanner({ type: 'error', message: flash.error });
        else setBanner({ type: '', message: '' });
        if (flash?.success || flash?.error) {
            const t = setTimeout(() => setBanner({ type: '', message: '' }), 5000);
            return () => clearTimeout(t);
        }
    }, [flash?.success, flash?.error]);

    useEffect(() => {
        setData('company_name', branding?.company_name ?? '');
    }, [branding?.company_name]);

    const handleFileChange = (field, file) => {
        setData(field, file);
        if (file) {
            setPreviews((p) => ({ ...p, [field]: URL.createObjectURL(file) }));
        } else {
            setPreviews((p) => ({ ...p, [field]: null }));
        }
    };

    const previewUrl = (field) => {
        if (previews[field]) return previews[field];
        const b = branding;
        if (b?.[`${field}_url`]) return b[`${field}_url`];
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('company_name', data.company_name);
        if (data.logo_light instanceof File) formData.append('logo_light', data.logo_light);
        if (data.logo_dark instanceof File) formData.append('logo_dark', data.logo_dark);
        if (data.logo_small instanceof File) formData.append('logo_small', data.logo_small);
        if (data.favicon instanceof File) formData.append('favicon', data.favicon);
        router.post(route('settings.branding.update'), formData, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setData({ logo_light: null, logo_dark: null, logo_small: null, favicon: null });
                setPreviews({ logo_light: null, logo_dark: null, logo_small: null, favicon: null });
            },
        });
    };

    const ImageField = ({ label, field, accept, hint }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
            <div className="flex flex-wrap items-start gap-4">
                <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50 overflow-hidden">
                    {previewUrl(field) ? (
                        <img src={previewUrl(field)} alt={label} className="max-w-full max-h-full object-contain" />
                    ) : (
                        <span className="text-gray-400 text-xs text-center px-2">
                            <FontAwesomeIcon icon={faImage} className="block text-2xl mb-1" />
                            No image
                        </span>
                    )}
                </div>
                <div className="flex flex-col gap-2">
                    <label className="inline-flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 rounded-lg cursor-pointer hover:bg-amber-100 text-amber-800 text-sm font-medium">
                        <FontAwesomeIcon icon={faUpload} className="w-4 h-4" />
                        Choose file
                        <input
                            type="file"
                            accept={accept}
                            className="hidden"
                            onChange={(e) => handleFileChange(field, e.target.files?.[0] ?? null)}
                        />
                    </label>
                    {hint && <p className="text-xs text-gray-500">{hint}</p>}
                    {errors[field] && <p className="text-red-500 text-sm">{errors[field]}</p>}
                </div>
            </div>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="School Branding" />
            <div className="py-8">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    {banner.message && (
                        <div
                            className={`mb-4 px-4 py-3 rounded-lg ${banner.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
                            role="alert"
                        >
                            {banner.message}
                        </div>
                    )}
                    <PageBreadcrumbs
                        items={[
                            { label: 'Dashboard', href: route('dashboard.superadmin') },
                            { label: 'Settings', href: route('admin.settings-management') },
                            { label: 'School Branding' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faSchool} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">School Branding</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Company name, logos (light/dark/small) and favicon</p>
                            </div>
                        </div>
                        <Link
                            href={route('admin.settings-management')}
                            className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                            <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                            Back
                        </Link>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">General</h2>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Company / School name</label>
                                <input
                                    type="text"
                                    value={data.company_name}
                                    onChange={(e) => setData('company_name', e.target.value)}
                                    className={`w-full border rounded-lg px-3 py-2 ${errors.company_name ? 'border-red-500' : 'border-gray-300'}`}
                                    placeholder="e.g. My School"
                                    maxLength={255}
                                />
                                {errors.company_name && <p className="text-red-500 text-sm mt-1">{errors.company_name}</p>}
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Logos</h2>
                            <div className="space-y-6">
                                <ImageField
                                    label="Logo (light background)"
                                    field="logo_light"
                                    accept={FILE_ACCEPT}
                                    hint="JPEG, PNG, GIF, SVG, WebP. Max 2MB."
                                />
                                <ImageField
                                    label="Logo (dark background)"
                                    field="logo_dark"
                                    accept={FILE_ACCEPT}
                                    hint="For dark theme / sidebar."
                                />
                                <ImageField
                                    label="Logo (small / icon)"
                                    field="logo_small"
                                    accept={FILE_ACCEPT}
                                    hint="Small version for compact spaces."
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4">Favicon</h2>
                            <ImageField
                                label="Favicon"
                                field="favicon"
                                accept={FAVICON_ACCEPT}
                                hint="ICO, PNG, GIF, SVG. Max 512KB. Shown in browser tab."
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                                {processing ? 'Saving…' : 'Save branding'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
