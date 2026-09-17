import Checkbox from '@/Components/Checkbox';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import GuestLayout from '@/Layouts/GuestLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Login({ status, canResetPassword, canRegister, flash }) {
    const { data, setData, post, processing, errors, reset } = useForm({
        login: '',
        password: '',
        remember: false,
    });

    const submit = (e) => {
        e.preventDefault();

        post(route('login'), {
            onFinish: () => reset('password'),
        });
    };

    const flashError = flash?.error;

    return (
        <GuestLayout>
            <Head title="Log in" />

            {status && (
                <div className="mb-4 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700">
                    {status}
                </div>
            )}

            {flashError && (
                <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                    {flashError}
                </div>
            )}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <InputLabel htmlFor="login" value="Email or ID Card Number" className="text-[#2E3D50]" />

                    <TextInput
                        id="login"
                        type="text"
                        name="login"
                        value={data.login}
                        className="mt-1 block w-full border-[#2E3D50]/20 focus:border-[#FFA500] focus:ring-[#FFA500]"
                        autoComplete="email"
                        isFocused={true}
                        onChange={(e) => setData('login', e.target.value)}
                    />

                    <InputError message={errors.login} className="mt-2" />
                </div>

                <div>
                    <InputLabel htmlFor="password" value="Password" className="text-[#2E3D50]" />

                    <TextInput
                        id="password"
                        type="password"
                        name="password"
                        value={data.password}
                        className="mt-1 block w-full border-[#2E3D50]/20 focus:border-[#FFA500] focus:ring-[#FFA500]"
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />

                    <InputError message={errors.password} className="mt-2" />
                </div>

                <div className="block">
                    <label className="flex cursor-pointer items-center">
                        <Checkbox
                            name="remember"
                            checked={data.remember}
                            onChange={(e) =>
                                setData('remember', e.target.checked)
                            }
                            className="rounded border-[#2E3D50]/30 text-[#FFA500] focus:ring-[#FFA500]"
                        />
                        <span className="ms-2 text-sm text-[#2E3D50]">
                            Remember me
                        </span>
                    </label>
                </div>

                <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                    {canResetPassword && (
                        <Link
                            href={route('password.request')}
                            className="rounded-md text-sm text-[#2E3D50] underline hover:text-[#FFA500] focus:outline-none focus:ring-2 focus:ring-[#FFA500] focus:ring-offset-2"
                        >
                            Forgot your password?
                        </Link>
                    )}

                    <PrimaryButton
                        className="ms-4 bg-[#FFA500] hover:bg-[#e59400] focus:bg-[#e59400] focus:ring-[#FFA500] active:bg-[#cc8400]"
                        disabled={processing}
                    >
                        Log in
                    </PrimaryButton>
                </div>

                {canRegister && (
                    <p className="mt-6 text-center text-sm text-[#2E3D50]">
                        If you are not registered,{' '}
                        <Link
                            href={route('register')}
                            className="font-medium text-[#FFA500] underline hover:text-[#e59400] focus:outline-none focus:ring-2 focus:ring-[#FFA500] focus:ring-offset-2 rounded"
                        >
                            register yourself
                        </Link>
                    </p>
                )}
            </form>
        </GuestLayout>
    );
}
