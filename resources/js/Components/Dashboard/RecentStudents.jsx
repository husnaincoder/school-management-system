import { Link } from '@inertiajs/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUserGraduate } from '@fortawesome/free-solid-svg-icons';

export default function RecentStudents({ enrollments = [] }) {
    const list = Array.isArray(enrollments) ? enrollments : [];

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-800">Recent Students</h3>
                <Link
                    href={route('academic.students')}
                    className="text-xs font-medium text-amber-600 hover:text-amber-700"
                >
                    View all
                </Link>
            </div>
            <p className="text-xs text-slate-500 mb-3">Admitted in the last one month</p>

            {list.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center">
                    <FontAwesomeIcon icon={faUserGraduate} className="text-3xl text-slate-200 mb-2" />
                    <p className="text-sm text-slate-500">No new admissions this month.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-auto -mx-1">
                    <table className="min-w-full text-sm">
                        <thead>
                            <tr className="text-left text-xs text-slate-500 uppercase tracking-wide border-b border-slate-100">
                                <th className="pb-2 pr-2 font-medium">Name</th>
                                <th className="pb-2 pr-2 font-medium">Class</th>
                                <th className="pb-2 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {list.map((enrollment) => {
                                const student = enrollment.student;
                                const csg = enrollment.classSectionGroup || enrollment.class_section_group;
                                const cs = csg?.classSection || csg?.class_section;
                                const className = cs
                                    ? [cs.class?.name, cs.section?.name].filter(Boolean).join(' - ')
                                    : '—';
                                const admissionDate = enrollment.admission_date
                                    ? new Date(enrollment.admission_date).toLocaleDateString('en-GB', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric',
                                    })
                                    : '—';

                                return (
                                    <tr key={enrollment.id} className="hover:bg-slate-50/80">
                                        <td className="py-2.5 pr-2 font-medium text-slate-800 truncate max-w-[100px]">
                                            {student?.user?.name
                                                || [student?.first_name, student?.last_name].filter(Boolean).join(' ')
                                                || '—'}
                                        </td>
                                        <td className="py-2.5 pr-2 text-slate-600 truncate max-w-[90px]">{className}</td>
                                        <td className="py-2.5 text-slate-500 whitespace-nowrap text-xs">{admissionDate}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
