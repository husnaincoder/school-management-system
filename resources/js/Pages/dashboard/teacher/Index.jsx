import React from 'react';
import {Head} from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function TeacherDashboard({ subjects }) {
    return (
        <AuthenticatedLayout>
             <Head title="Teacher Dashboard" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Teacher Dashboard</h1>
                    
                    {/* My Subjects */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">My Subjects</h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {subjects.map((subject) => (
                                    <div key={subject.id} className="border rounded-lg p-4">
                                        <div className="font-semibold">{subject.name}</div>
                                        <div className="text-gray-500 text-sm">Class: {subject.class?.name}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <a href="/teacher/attendance" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            Take Attendance
                        </a>
                        <a href="/teacher/marks" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            Enter Marks
                        </a>
                        <a href="/teacher/students" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            My Students
                        </a>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
