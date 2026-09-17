import DashboardLayout from './DashboardLayout';

export default function AuthenticatedLayout({ header, children }) {
    return (
        <DashboardLayout header={header}>
            {children}
        </DashboardLayout>
    );
}
