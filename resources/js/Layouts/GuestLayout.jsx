import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link, usePage } from '@inertiajs/react';

const headerOrange = '#FFA500';
const sidebarDark = '#2E3D50';

export default function GuestLayout({ children }) {
    const { props } = usePage();
    const branding = props.branding ?? null;
    const logoUrl = branding?.logo_light_url ?? null;
    const companyName = branding?.company_name?.trim() || 'School';

    return (
        <div
            className="flex min-h-screen flex-col items-center justify-center pt-6 sm:pt-0"
            style={{ backgroundColor: sidebarDark }}
        >
            <div
                className="flex w-full flex-col overflow-hidden px-6 py-6 shadow-xl sm:max-w-md sm:rounded-xl border border-white/10"
                style={{ backgroundColor: 'rgba(255,255,255,0.97)' }}
            >
                <div className="flex flex-col items-center justify-center pb-4">
                    <Link href="/" className="block rounded-lg focus:outline-none focus:ring-2 focus:ring-[#FFA500] focus:ring-offset-2 focus:ring-offset-white">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt={companyName}
                                className="h-20 w-auto max-w-[200px] object-contain object-center"
                            />
                        ) : (
                            <ApplicationLogo className="h-20 w-20 fill-current" style={{ color: headerOrange }} />
                        )}
                    </Link>
                    {companyName && logoUrl && (
                        <span className="mt-2 text-sm font-medium text-[#2E3D50]">{companyName}</span>
                    )}
                </div>
                {children}
            </div>
        </div>
    );
}
