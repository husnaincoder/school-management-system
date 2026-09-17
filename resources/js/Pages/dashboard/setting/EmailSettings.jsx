import React, { useState, useEffect } from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEnvelope, faServer, faUser, faAt, faToggleOn, faArrowLeft, faGear } from '@fortawesome/free-solid-svg-icons';

const DEFAULTS = {
    mailer: 'smtp',
    scheme: '',
    host: '',
    port: '',
    username: '',
    password: '',
    from_address: '',
    from_name: '',
    reply_to: '',
    email_enabled: true,
};

export default function EmailSettingsPage(props) {
    const { props: pageProps } = usePage();
    const emailSetting = props.emailSetting ?? pageProps.emailSetting ?? null;
    const { flash } = usePage().props;

    const [banner, setBanner] = useState({ type: '', message: '' });

    const { data, setData, post, processing, errors } = useForm({
        mailer: emailSetting?.mailer ?? DEFAULTS.mailer,
        scheme: emailSetting?.scheme ?? DEFAULTS.scheme,
        host: emailSetting?.host ?? DEFAULTS.host,
        port: emailSetting?.port != null ? String(emailSetting.port) : DEFAULTS.port,
        username: emailSetting?.username ?? DEFAULTS.username,
        password: '',
        from_address: emailSetting?.from_address ?? DEFAULTS.from_address,
        from_name: emailSetting?.from_name ?? DEFAULTS.from_name,
        reply_to: emailSetting?.reply_to ?? DEFAULTS.reply_to,
        email_enabled: emailSetting?.email_enabled ?? DEFAULTS.email_enabled,
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
        if (emailSetting) {
            setData({
                mailer: emailSetting.mailer ?? DEFAULTS.mailer,
                scheme: emailSetting.scheme ?? DEFAULTS.scheme,
                host: emailSetting.host ?? DEFAULTS.host,
                port: emailSetting.port != null ? String(emailSetting.port) : '',
                username: emailSetting.username ?? DEFAULTS.username,
                password: '',
                from_address: emailSetting.from_address ?? DEFAULTS.from_address,
                from_name: emailSetting.from_name ?? DEFAULTS.from_name,
                reply_to: emailSetting.reply_to ?? DEFAULTS.reply_to,
                email_enabled: !!emailSetting.email_enabled,
            });
        }
    }, [emailSetting]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { ...data };
        if (!payload.password) delete payload.password;
        post(route('settings.email.update'), { preserveScroll: true });
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

    const Input = ({ label, name, type = 'text', placeholder, hint, ...rest }) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input
                type={type}
                value={data[name]}
                onChange={(e) => setData(name, type === 'number' ? e.target.value : e.target.value)}
                placeholder={placeholder}
                className={`w-full border rounded-lg px-3 py-2 ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
                {...rest}
            />
            {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
            {errors[name] && <p className="text-red-500 text-sm mt-1">{errors[name]}</p>}
        </div>
    );

    return (
        <AuthenticatedLayout>
            <Head title="Email Setting" />
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
                            { label: 'Email Settings' },
                        ]}
                    />

                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                                <FontAwesomeIcon icon={faEnvelope} className="text-amber-500 text-xl" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Email Settings</h1>
                                <p className="text-sm text-gray-500 mt-0.5">SMTP and mail configuration for outgoing emails</p>
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
                                <FontAwesomeIcon icon={faToggleOn} className="text-amber-500 w-4 h-4" />
                                General
                            </h2>
                            <Toggle
                                name="email_enabled"
                                label="Email enabled"
                                hint="Enable or disable sending emails from the application."
                            />
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faServer} className="text-amber-500 w-4 h-4" />
                                Server
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Mailer</label>
                                    <select
                                        value={data.mailer}
                                        onChange={(e) => setData('mailer', e.target.value)}
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2"
                                    >
                                        <option value="smtp">SMTP</option>
                                        <option value="ses">Amazon SES</option>
                                        <option value="mailgun">Mailgun</option>
                                        <option value="postmark">Postmark</option>
                                        <option value="sendmail">Sendmail</option>
                                        <option value="log">Log (no send)</option>
                                    </select>
                                </div>
                                <Input name="scheme" label="Encryption / Scheme" placeholder="tls or ssl" hint="e.g. tls, ssl" />
                                <Input name="host" label="Host" placeholder="smtp.example.com" />
                                <Input name="port" label="Port" type="number" placeholder="587" hint="e.g. 587, 465, 25" />
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faUser} className="text-amber-500 w-4 h-4" />
                                Credentials
                            </h2>
                            <div className="space-y-4">
                                <Input name="username" label="Username" placeholder="SMTP username" />
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                    <input
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder={emailSetting?.password_is_set ? '•••••••• (leave blank to keep)' : 'SMTP password'}
                                        className={`w-full border rounded-lg px-3 py-2 ${errors.password ? 'border-red-500' : 'border-gray-300'}`}
                                        autoComplete="new-password"
                                    />
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        {emailSetting?.password_is_set
                                            ? 'A password is already set in .env. Leave blank to keep it; enter a new value only to replace it. Never stored in the database.'
                                            : 'Stored only in .env (MAIL_PASSWORD), never in System Settings.'}
                                    </p>
                                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-6">
                            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <FontAwesomeIcon icon={faAt} className="text-amber-500 w-4 h-4" />
                                From & Reply
                            </h2>
                            <div className="space-y-4">
                                <Input name="from_address" label="From address" type="email" placeholder="noreply@school.com" />
                                <Input name="from_name" label="From name" placeholder="My School" />
                                <Input name="reply_to" label="Reply-To address" type="email" placeholder="support@school.com" />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={processing}
                                className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faGear} className="w-4 h-4" />
                                {processing ? 'Saving…' : 'Save email settings'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
