import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLock, faUserPlus, faArrowLeft, faWrench, faGear } from '@fortawesome/free-solid-svg-icons';

const DEFAULTS = {
    registration_enabled: false,
    email_verification_required: true,
    password_min_length: 8,
    session_timeout: 120,
    maintenance_mode: false,
};

export default function AuthSettingsPage(props) {
    const { props: pageProps } = usePage();
    const authSetting = props.authSetting ?? pageProps.authSetting ?? null;
    const { flash } = usePage().props;

    const [banner, setBanner] = useState({ type: '', message: '' });

    const { data, setData, post, processing, errors } = useForm({
        registration_enabled: authSetting?.registration_enabled ?? DEFAULTS.registration_enabled,
        email_verification_required: authSetting?.email_verification_required ?? DEFAULTS.email_verification_required,
        password_min_length: authSetting?.password_min_length ?? DEFAULTS.password_min_length,
        session_timeout: authSetting?.session_timeout ?? DEFAULTS.session_timeout,
        maintenance_mode: authSetting?.maintenance_mode ?? DEFAULTS.maintenance_mode,
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
        if (authSetting) {
            setData({
                registration_enabled: !!authSetting.registration_enabled,
                email_verification_required: !!authSetting.email_verification_required,
                password_min_length: authSetting.password_min_length ?? DEFAULTS.password_min_length,
                session_timeout: authSetting.session_timeout ?? DEFAULTS.session_timeout,
                maintenance_mode: !!authSetting.maintenance_mode,
            });
        }
    }, [authSetting]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post(route('settings.auth.update'), { preserveScroll: true });
    };

    const Toggle = ({ label, name, hint }) => (
        <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
            <div>
                <p className="font-medium text-gray-900">{label}</p>
                {hint && <p className="text-sm text-gray-500 mt-0.5">{hint}</p>}
            </div>
            <button
                type="button"
                role="switch"
                aria-checked={data[name]}
                onClick={() => setData(name, !data[name])}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 ${
                    data[name] ? 'bg-amber-500' : 'bg-gray-200'
                }`}
            >
                <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        data[name] ? 'translate-x-5' : 'translate-x-1'
                    }`}
                />
            </button>
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Auth Setting" />
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
                            { label: 'Auth Settings' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faLock} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Auth Settings</h1>
                                <p className="text-sm text-gray-500 mt-0.5">Registration, email verification, password rules, session timeout and maintenance mode</p>
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
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faUserPlus} className="text-amber-500 w-4 h-4" />
                                Registration & verification
                            </h2>
                            <div className="divide-y divide-gray-100">
                                <Toggle
                                    name="registration_enabled"
                                    label="Allow registration"
                                    hint="When enabled, /register opens and visitors can submit a request. New accounts stay inactive with no role until an admin activates them."
                                />
                                <Toggle
                                    name="email_verification_required"
                                    label="Email verification required"
                                    hint="When enabled, users who have an email must verify it before using the app (except profile/verification pages). Accounts without email are not blocked. Admin-created accounts with an email are marked verified automatically."
                                />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faLock} className="text-amber-500 w-4 h-4" />
                                Password & session
                            </h2>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Minimum password length</label>
                                    <input
                                        type="number"
                                        min={6}
                                        max={32}
                                        value={data.password_min_length}
                                        onChange={(e) => setData('password_min_length', parseInt(e.target.value, 10) || 8)}
                                        className={`w-24 border rounded-lg px-3 py-2 ${errors.password_min_length ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    <span className="ml-2 text-sm text-gray-500">characters (6–32) — enforced on register, reset, and password change</span>
                                    {errors.password_min_length && <p className="text-red-500 text-sm mt-1">{errors.password_min_length}</p>}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Session timeout</label>
                                    <input
                                        type="number"
                                        min={5}
                                        max={1440}
                                        value={data.session_timeout}
                                        onChange={(e) => setData('session_timeout', parseInt(e.target.value, 10) || 120)}
                                        className={`w-24 border rounded-lg px-3 py-2 ${errors.session_timeout ? 'border-red-500' : 'border-gray-300'}`}
                                    />
                                    <span className="ml-2 text-sm text-gray-500">minutes (5–1440) — applied before each session starts</span>
                                    {errors.session_timeout && <p className="text-red-500 text-sm mt-1">{errors.session_timeout}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faWrench} className="text-amber-500 w-4 h-4" />
                                Maintenance
                            </h2>
                            <Toggle
                                name="maintenance_mode"
                                label="Maintenance mode"
                                hint="When enabled, only admin / super_admin can use the system. Everyone else is redirected to login (admins can still sign in)."
                            />
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                                {processing ? 'Saving…' : 'Save settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
