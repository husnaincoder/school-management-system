import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Transition } from '@headlessui/react';
import { Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export default function UpdateProfileInformation({
    mustVerifyEmail,
    status,
    className = '',
}) {
    const user = usePage().props.auth.user;
    const [photoPreview, setPhotoPreview] = useState(null);

    const { data, setData, patch, errors, processing, recentlySuccessful } =
        useForm({
            name: user.name,
            email: user.email,
            profile_photo: null,
        });

    useEffect(() => {
        if (!(data.profile_photo instanceof File)) {
            setPhotoPreview(null);
            return undefined;
        }

        const url = URL.createObjectURL(data.profile_photo);
        setPhotoPreview(url);

        return () => URL.revokeObjectURL(url);
    }, [data.profile_photo]);

    const submit = (e) => {
        e.preventDefault();

        const hasFile = data.profile_photo instanceof File;
        patch(route('profile.update'), {
            forceFormData: hasFile,
        });
    };

    const currentPhoto = user.profile_photo ? `/storage/${user.profile_photo}` : null;
    const displayPhoto = photoPreview || currentPhoto;

    return (
        <section className={className}>
            <header>
                <h2 className="text-lg font-medium text-gray-900">
                    Profile Information
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                    Update your account&apos;s profile information and email address.
                </p>
            </header>

            <form onSubmit={submit} className="mt-6 space-y-6">
                <div>
                    <InputLabel htmlFor="profile_photo" value="Profile Photo" />

                    <div className="mt-2 flex items-center gap-4">
                        {displayPhoto ? (
                            <img
                                src={displayPhoto}
                                alt="Profile"
                                className="h-20 w-20 rounded-full border border-gray-200 object-cover"
                            />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-full border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-400">
                                No photo
                            </div>
                        )}
                        <div className="flex-1">
                            <input
                                id="profile_photo"
                                type="file"
                                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200"
                                onChange={(e) => setData('profile_photo', e.target.files[0] || null)}
                            />
                            {data.profile_photo instanceof File && (
                                <p className="mt-1 text-xs text-green-600">Selected: {data.profile_photo.name}</p>
                            )}
                        </div>
                    </div>

                    <InputError className="mt-2" message={errors.profile_photo} />
                </div>

                <div>
                    <InputLabel htmlFor="name" value="Name" />

                    <TextInput
                        id="name"
                        className="mt-1 block w-full"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        required
                        isFocused
                        autoComplete="name"
                    />

                    <InputError className="mt-2" message={errors.name} />
                </div>

                <div>
                    <InputLabel htmlFor="email" value="Email (optional)" />

                    <TextInput
                        id="email"
                        type="email"
                        className="mt-1 block w-full"
                        value={data.email ?? ''}
                        onChange={(e) => setData('email', e.target.value)}
                        autoComplete="email"
                    />

                    <InputError className="mt-2" message={errors.email} />
                </div>

                {mustVerifyEmail && user.email_verified_at === null && (
                    <div>
                        <p className="mt-2 text-sm text-gray-800">
                            Your email address is unverified.
                            <Link
                                href={route('verification.send')}
                                method="post"
                                as="button"
                                className="rounded-md text-sm text-gray-600 underline hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                            >
                                Click here to re-send the verification email.
                            </Link>
                        </p>

                        {status === 'verification-link-sent' && (
                            <div className="mt-2 text-sm font-medium text-green-600">
                                A new verification link has been sent to your
                                email address.
                            </div>
                        )}
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <PrimaryButton disabled={processing}>Save</PrimaryButton>

                    <Transition
                        show={recentlySuccessful}
                        enter="transition ease-in-out"
                        enterFrom="opacity-0"
                        leave="transition ease-in-out"
                        leaveTo="opacity-0"
                    >
                        <p className="text-sm text-gray-600">
                            Saved.
                        </p>
                    </Transition>
                </div>
            </form>
        </section>
    );
}
