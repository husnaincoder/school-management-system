import React, { useState } from 'react';
import {Head, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

function groupLabel(csg) {
    if (!csg) return '—';
    const cs = csg.class_section || csg.classSection;
    const cls = cs?.class?.name ?? '';
    const sec = cs?.section?.name ?? '';
    const grp = csg.subject_group?.name ?? csg.subjectGroup?.name ?? '';
    return [cls, sec, grp].filter(Boolean).join(' · ') || '—';
}

export default function AttendanceIndex({ classSectionGroups = [], sessions = [], currentSessionId, students = [], selectedClassSectionGroupId = '', selectedDate }) {
    const [attendance, setAttendance] = useState({});
    const dateState = selectedDate || new Date().toISOString().split('T')[0];

    const handleAttendanceChange = (studentId, status) => {
        setAttendance((prev) => ({ ...prev, [studentId]: status }));
    };

    const loadStudents = () => {
        router.get(route('academic.attendance'), {
            class_section_group_id: selectedClassSectionGroupId || undefined,
            date: dateState,
        }, { preserveState: true });
    };

    const [saving, setSaving] = useState(false);
    const sessionId = currentSessionId || (sessions[0]?.id) || '';

    const handleSaveAttendance = (e) => {
        e.preventDefault();
        if (Object.keys(attendance).length === 0) {
            return;
        }
        setSaving(true);
        router.post(route('academic.attendance.store'), {
            academic_session_id: sessionId,
            date: dateState,
            attendances: attendance,
        }, {
            preserveScroll: true,
            onFinish: () => setSaving(false),
        });
    };

    return (
        <AuthenticatedLayout>
            <Head title="Attendance" /> 
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Attendance Management</h1>

                    {/* Filter Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Class Section Group (Class · Section · Group)</label>
                                <select
                                    className="w-full border rounded-md px-3 py-2"
                                    value={selectedClassSectionGroupId}
                                    onChange={(e) => {
                                        router.get(route('academic.attendance'), {
                                            class_section_group_id: e.target.value || undefined,
                                            date: dateState,
                                        }, { preserveState: true });
                                    }}
                                >
                                    <option value="">Select group</option>
                                    {classSectionGroups.map((csg) => (
                                        <option key={csg.id} value={csg.id}>{groupLabel(csg)}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-md px-3 py-2"
                                    value={dateState}
                                    onChange={(e) => {
                                        router.get(route('academic.attendance'), {
                                            class_section_group_id: selectedClassSectionGroupId || undefined,
                                            date: e.target.value,
                                        }, { preserveState: true });
                                    }}
                                />
                            </div>
                            <div className="flex items-end">
                                <button
                                    type="button"
                                    onClick={loadStudents}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full"
                                >
                                    Load Students
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Take Attendance */}
                    {students && students.length > 0 && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Take Attendance — {classSectionGroups.find((g) => String(g.id) === String(selectedClassSectionGroupId)) ? groupLabel(classSectionGroups.find((g) => String(g.id) === String(selectedClassSectionGroupId))) : 'Group'}</h2>
                                    <button
                                        type="button"
                                        onClick={handleSaveAttendance}
                                        disabled={saving || Object.keys(attendance).length === 0}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : 'Save Attendance'}
                                    </button>
                                </div>
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Present</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Absent</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Late</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {students.map((student) => (
                                            <tr key={student.id}>
                                                <td className="px-6 py-4">{student.roll_number}</td>
                                                <td className="px-6 py-4">{student.name}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="radio"
                                                        name={`attendance-${student.id}`}
                                                        checked={attendance[student.id] === 'present'}
                                                        onChange={() => handleAttendanceChange(student.id, 'present')}
                                                        className="h-4 w-4 text-green-600"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="radio"
                                                        name={`attendance-${student.id}`}
                                                        checked={attendance[student.id] === 'absent'}
                                                        onChange={() => handleAttendanceChange(student.id, 'absent')}
                                                        className="h-4 w-4 text-red-600"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="radio"
                                                        name={`attendance-${student.id}`}
                                                        checked={attendance[student.id] === 'late'}
                                                        onChange={() => handleAttendanceChange(student.id, 'late')}
                                                        className="h-4 w-4 text-yellow-600"
                                                    />
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {selectedClassSectionGroupId && (!students || students.length === 0) && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 text-center text-gray-500">
                            No students enrolled in this group, or click &quot;Load Students&quot; to refresh.
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
