import React, { useState } from 'react';
import {Head } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function MarksIndex({ exams, classes, sections, subjects, marks }) {
    const [selectedExam, setSelectedExam] = useState('');
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedSection, setSelectedSection] = useState('');
    const [selectedSubject, setSelectedSubject] = useState('');
    const [studentMarks, setStudentMarks] = useState({});

    const handleMarksChange = (studentId, field, value) => {
        setStudentMarks({
            ...studentMarks,
            [studentId]: {
                ...studentMarks[studentId],
                [field]: value
            }
        });
    };

    const handleSaveMarks = () => {
        // Save marks logic
    };

    // Sample students data (would come from props in real app)
    const students = [
        { id: 1, roll_number: '001', name: 'John Doe' },
        { id: 2, roll_number: '002', name: 'Jane Smith' },
        { id: 3, roll_number: '003', name: 'Bob Johnson' },
    ];

    return (
        <AuthenticatedLayout>
            <Head title="Marks" />
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Marks Management</h1>

                    {/* Filter Section */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Exam</label>
                                <select
                                    className="w-full border rounded-md px-3 py-2"
                                    value={selectedExam}
                                    onChange={(e) => setSelectedExam(e.target.value)}
                                >
                                    <option value="">Select Exam</option>
                                    {exams.map(exam => (
                                        <option key={exam.id} value={exam.id}>{exam.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
                                <select
                                    className="w-full border rounded-md px-3 py-2"
                                    value={selectedClass}
                                    onChange={(e) => setSelectedClass(e.target.value)}
                                >
                                    <option value="">Select Class</option>
                                    {classes.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                                <select
                                    className="w-full border rounded-md px-3 py-2"
                                    value={selectedSection}
                                    onChange={(e) => setSelectedSection(e.target.value)}
                                >
                                    <option value="">Select Section</option>
                                    {sections.map(section => (
                                        <option key={section.id} value={section.id}>{section.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                                <select
                                    className="w-full border rounded-md px-3 py-2"
                                    value={selectedSubject}
                                    onChange={(e) => setSelectedSubject(e.target.value)}
                                >
                                    <option value="">Select Subject</option>
                                    {subjects.map(subject => (
                                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                                    Load Students
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Enter Marks */}
                    {selectedExam && selectedClass && selectedSection && selectedSubject && (
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Enter Marks</h2>
                                    <button
                                        onClick={handleSaveMarks}
                                        className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
                                    >
                                        Save Marks
                                    </button>
                                </div>
                                <table className="min-w-full">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Roll No</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student Name</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Theory Marks</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Practical Marks</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assignment Marks</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {students.map(student => (
                                            <tr key={student.id}>
                                                <td className="px-6 py-4">{student.roll_number}</td>
                                                <td className="px-6 py-4">{student.name}</td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        className="w-20 border rounded px-2 py-1"
                                                        value={studentMarks[student.id]?.theory || ''}
                                                        onChange={(e) => handleMarksChange(student.id, 'theory', e.target.value)}
                                                        max="100"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        className="w-20 border rounded px-2 py-1"
                                                        value={studentMarks[student.id]?.practical || ''}
                                                        onChange={(e) => handleMarksChange(student.id, 'practical', e.target.value)}
                                                        max="100"
                                                    />
                                                </td>
                                                <td className="px-6 py-4">
                                                    <input
                                                        type="number"
                                                        className="w-20 border rounded px-2 py-1"
                                                        value={studentMarks[student.id]?.assignment || ''}
                                                        onChange={(e) => handleMarksChange(student.id, 'assignment', e.target.value)}
                                                        max="100"
                                                    />
                                                </td>
                                                <td className="px-6 py-4 font-medium">
                                                    {((parseInt(studentMarks[student.id]?.theory) || 0) +
                                                      (parseInt(studentMarks[student.id]?.practical) || 0) +
                                                      (parseInt(studentMarks[student.id]?.assignment) || 0))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
