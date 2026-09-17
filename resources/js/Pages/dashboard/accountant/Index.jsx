import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function AccountantDashboard({ transactions, totalIncome, totalExpense, netProfit, recentPayments, pendingFees }) {
    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Accountant Dashboard</h1>
                    
                    {/* Financial Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-green-500">
                            <div className="text-gray-500 text-sm">Total Income</div>
                            <div className="text-2xl font-bold text-green-600">${totalIncome}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-red-500">
                            <div className="text-gray-500 text-sm">Total Expense</div>
                            <div className="text-2xl font-bold text-red-600">${totalExpense}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-blue-500">
                            <div className="text-gray-500 text-sm">Net Profit</div>
                            <div className="text-2xl font-bold text-blue-600">${netProfit}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-yellow-500">
                            <div className="text-gray-500 text-sm">Pending Fees</div>
                            <div className="text-2xl font-bold text-yellow-600">{pendingFees.length}</div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <a href="/accountant/fee/collection" className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            Collect Fee
                        </a>
                        <a href="/accountant/fee/structure" className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            Manage Fee Structure
                        </a>
                        <a href="/accountant/reports" className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-3 px-6 rounded-lg text-center">
                            View Reports
                        </a>
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Recent Fee Payments</h2>
                            <table className="min-w-full">
                                <thead>
                                    <tr className="text-left text-gray-500 text-sm">
                                        <th className="pb-3">Student</th>
                                        <th className="pb-3">Amount</th>
                                        <th className="pb-3">Date</th>
                                        <th className="pb-3">Method</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {recentPayments.map((payment) => (
                                        <tr key={payment.id} className="border-t">
                                            <td className="py-3">{payment.student?.user?.name}</td>
                                            <td className="py-3">${payment.amount_paid}</td>
                                            <td className="py-3">{payment.payment_date}</td>
                                            <td className="py-3">{payment.payment_method}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
