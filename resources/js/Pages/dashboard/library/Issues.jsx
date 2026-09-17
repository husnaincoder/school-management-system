import React from 'react';
import { Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function IssuesIndex({ issues }) {
    const issueList = issues?.data ?? (Array.isArray(issues) ? issues : []);
    const links = issues?.links ?? [];

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center mb-6">
                        <h1 className="text-2xl font-semibold">Library - Book Issues</h1>
                        <Link
                            href={route('library.issues')}
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded"
                        >
                            Issue Book
                        </Link>
                    </div>

                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <table className="min-w-full">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Book</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Issue Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {issueList.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No issues yet.</td>
                                    </tr>
                                ) : (
                                    issueList.map((issue) => (
                                        <tr key={issue.id}>
                                            <td className="px-6 py-4 font-medium text-gray-900">{issue.book?.title ?? '—'}</td>
                                            <td className="px-6 py-4">{issue.student?.user?.name ?? `Student #${issue.student_id}`}</td>
                                            <td className="px-6 py-4">{issue.issue_date ? new Date(issue.issue_date).toLocaleDateString() : '—'}</td>
                                            <td className="px-6 py-4">{issue.due_date ? new Date(issue.due_date).toLocaleDateString() : '—'}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${issue.status === 'issued' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                                                    {issue.status ?? '—'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">—</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {links.length > 0 && (
                        <div className="mt-4 flex flex-wrap gap-2">
                            {links.map((link, index) =>
                                link.url ? (
                                    <Link key={index} href={link.url} className={`px-3 py-1 rounded text-sm ${link.active ? 'bg-blue-500 text-white' : 'bg-gray-200 hover:bg-gray-300'}`} dangerouslySetInnerHTML={{ __html: link.label }} />
                                ) : (
                                    <span key={index} className="px-3 py-1 rounded text-sm bg-gray-100 text-gray-400 cursor-not-allowed" dangerouslySetInnerHTML={{ __html: link.label }} />
                                )
                            )}
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
