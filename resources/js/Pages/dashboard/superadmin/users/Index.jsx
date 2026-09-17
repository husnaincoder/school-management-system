import React, { useEffect, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PageBreadcrumbs from '@/Components/Dashboard/PageBreadcrumbs';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faPen, faFilter, faUsers, faArrowLeft, faKey, faCopy, faCheck } from '@fortawesome/free-solid-svg-icons';

export default function UsersIndex({ users, roles, filters }) {
const [search, setSearch] = useState(filters?.search ?? '');
const [role, setRole] = useState(filters?.role ?? '');
const [status, setStatus] = useState(filters?.status ?? '');
const [banner, setBanner] = useState({ type: '', message: '' });
const [credentials, setCredentials] = useState(null);
const [copied, setCopied] = useState(false);
const { flash } = usePage().props;

useEffect(() => {
    if (flash?.credentials) {
        setCredentials(flash.credentials);
    }
    if (flash?.success) setBanner({ type: 'success', message: flash.success });
    else if (flash?.error) setBanner({ type: 'error', message: flash.error });
    else setBanner({ type: '', message: '' });
    if (flash?.success || flash?.error) {
        const t = setTimeout(() => setBanner({ type: '', message: '' }), 10000);
        return () => clearTimeout(t);
    }
}, [flash?.success, flash?.error, flash?.credentials]);

const copyCredentials = () => {
    if (!credentials?.user) return;
    const u = credentials.user;
    let text = `=== User Login Credentials ===\nName: ${u.name}\nRole: ${u.role}\nLogin ID: ${u.login}\n`;
    if (u.email) text += `Email: ${u.email}\n`;
    if (u.password) text += `Password: ${u.password}\n`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
};

const applyFilters = (e) => {
e.preventDefault();
router.get(route('superadmin.users.index'), { search, role, status }, { preserveState: true });
};

const userList = users?.data ?? [];
const total = users?.total ?? userList.length;

return (
<AuthenticatedLayout>
    <Head title="User Management" />
    <div className="py-8">
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <PageBreadcrumbs
                items={[
                    { label: 'Dashboard', href: route('dashboard.superadmin') },
                    { label: 'User Management', href: route('admin.user-management') },
                    { label: 'Users' },
                ]}
            />

            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-[#e8eef7]">
                        <FontAwesomeIcon icon={faUsers} className="text-amber-500 text-xl" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <p className="text-sm text-gray-500 mt-0.5">Manage system users and roles</p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={route('admin.user-management')}
                        className="inline-flex items-center gap-2 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                        <FontAwesomeIcon icon={faArrowLeft} className="text-sm" />
                        Back
                    </Link>
                    <Link
                        href={route('superadmin.users.create')}
                        className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                    >
                        <FontAwesomeIcon icon={faPlus} className="text-sm" />
                        Add User
                    </Link>
                </div>
            </div>

            {banner.message && (
                <div className={`mb-4 px-4 py-3 rounded-lg border ${banner.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'}`} role="alert">
                    {banner.message}
                </div>
            )}

            {credentials?.user && (
                <div className="mb-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-300 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between gap-4 mb-3 border-b border-amber-200 pb-3">
                        <div className="flex items-center gap-2 text-amber-900 font-bold text-base">
                            <FontAwesomeIcon icon={faKey} className="text-amber-600" />
                            <span>New User Account Credentials</span>
                        </div>
                        <button
                            type="button"
                            onClick={copyCredentials}
                            className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition shadow-sm"
                        >
                            <FontAwesomeIcon icon={copied ? faCheck : faCopy} />
                            {copied ? 'Copied!' : 'Copy Credentials'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 bg-white/70 rounded-lg p-3 border border-amber-200/60 text-sm">
                        <div>
                            <span className="text-xs text-gray-500 block">Name</span>
                            <span className="font-semibold text-gray-900">{credentials.user.name}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block">Role</span>
                            <span className="font-semibold text-amber-700 capitalize">{credentials.user.role}</span>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block">Login ID</span>
                            <code className="font-mono font-bold text-gray-900 bg-gray-100 px-1.5 py-0.5 rounded text-xs">{credentials.user.login}</code>
                        </div>
                        <div>
                            <span className="text-xs text-gray-500 block">Password</span>
                            <code className="font-mono font-bold text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded text-xs">{credentials.user.password}</code>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters Card - same as Sections */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] p-5 mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <FontAwesomeIcon icon={faFilter} className="text-amber-500 w-4 h-4" />
                    Filters
                </h2>
                <form onSubmit={applyFilters} className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="user-search" className="text-sm font-medium text-gray-700 shrink-0">Search</label>
                        <input
                            id="user-search"
                            type="text"
                            name="search"
                            placeholder="Search by name, email, or ID card..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="min-w-[200px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                        <label htmlFor="user-role" className="text-sm font-medium text-gray-700 shrink-0">Role</label>
                        <select
                            id="user-role"
                            name="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="min-w-[140px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">All Roles</option>
                            {roles.map(r => (
                                <option key={r.id} value={r.name}>{r.name}</option>
                            ))}
                        </select>
                        <label htmlFor="user-status" className="text-sm font-medium text-gray-700 shrink-0">Status</label>
                        <select
                            id="user-status"
                            name="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="min-w-[120px] border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        >
                            <option value="">All Status</option>
                            <option value="1">Active</option>
                            <option value="0">Inactive</option>
                        </select>
                        <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm">
                            Filter
                        </button>
                    </div>
                </form>
            </div>

            {/* Table card */}
            <div
                className="bg-white rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.08)] overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">Users</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Total: {total} user{total !== 1 ? 's' : ''}</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID Card
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {userList.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                    No users found. Click &quot;Add User&quot; to create one.
                                </td>
                            </tr>
                            ) : (
                            userList.map(user => (
                            <tr key={user.id}>
                                <td className="px-6 py-4 font-medium text-gray-900">{user.name}</td>
                                <td className="px-6 py-4">{user.email ?? '—'}</td>
                                <td className="px-6 py-4">{user.id_card_number}</td>
                                <td className="px-6 py-4">
                                    {user.roles?.map(r => (
                                    <span key={r.id}
                                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#2E3D50] text-white mr-1">
                                        {r.name}
                                    </span>
                                    )) ?? '—'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-0.5 text-xs rounded ${user.is_active
                                        ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600' }`}>
                                        {user.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <Link href={route('superadmin.users.edit', user.id)}
                                        className="text-amber-500 hover:text-amber-600 inline-flex items-center gap-1"
                                        title="Edit">
                                    <FontAwesomeIcon icon={faPen} className="text-sm" />
                                    </Link>
                                </td>
                            </tr>
                            ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {users.links && users.links.length > 0 && (
            <div className="mt-4 flex gap-2 justify-end flex-wrap">
                {users.links.map((link, index) =>
                link.url ? (
                <Link key={index} href={link.url} className={`px-3 py-1.5 rounded-lg text-sm font-medium ${link.active
                    ? 'bg-amber-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300' }`}
                    dangerouslySetInnerHTML={{ __html: link.label }} />
                ) : (
                <span key={index}
                    className="px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-400 cursor-not-allowed"
                    dangerouslySetInnerHTML={{ __html: link.label }} />
                )
                )}
            </div>
            )}
        </div>
    </div>
</AuthenticatedLayout>
);
}