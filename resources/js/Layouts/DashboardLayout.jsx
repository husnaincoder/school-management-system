import { usePage } from '@inertiajs/react';
import { useState } from 'react';
import Sidebar from '@/Components/Dashboard/Sidebar';
import Header from '@/Components/Dashboard/Header';
import Footer from '@/Components/Dashboard/Footer';

export default function DashboardLayout({ header, children }) {
    const { props } = usePage();
    const user = props.auth?.user;
    const userRoles = user?.roles ?? [];
    const [sidebarOpen, setSidebarOpen] = useState(true);

    return (
        <div className="min-h-screen bg-slate-50">
            <Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
                user={user}
                userRoles={userRoles}
            />

            <div
                className={`flex min-h-screen min-w-0 flex-col transition-[margin] duration-300 ease-in-out ${
                    sidebarOpen ? 'ml-72' : 'ml-20'
                }`}
            >
                <Header
                    user={user}
                    sidebarOpen={sidebarOpen}
                    setSidebarOpen={setSidebarOpen}
                    header={header}
                />

                <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
                    {children}
                </main>

                <Footer />
            </div>
        </div>
    );
}
