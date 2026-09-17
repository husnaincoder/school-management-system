import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function ReportsIndex({ incomeExpenses, monthlyData, classWiseFees }) {
    const [dateRange, setDateRange] = useState({
        start_date: '',
        end_date: '',
    });
    const [reportType, setReportType] = useState('summary');

    return (
        <AuthenticatedLayout>
            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
                    <h1 className="text-2xl font-semibold mb-6">Financial Reports</h1>

                    {/* Report Type Selection */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6 p-6">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
                                <select
                                    className="w-full border rounded-md px-3 py-2"
                                    value={reportType}
                                    onChange={(e) => setReportType(e.target.value)}
                                >
                                    <option value="summary">Summary Report</option>
                                    <option value="income">Income Report</option>
                                    <option value="expense">Expense Report</option>
                                    <option value="fees">Fee Collection Report</option>
                                    <option value="profit">Profit & Loss</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-md px-3 py-2"
                                    value={dateRange.start_date}
                                    onChange={(e) => setDateRange({...dateRange, start_date: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                                <input
                                    type="date"
                                    className="w-full border rounded-md px-3 py-2"
                                    value={dateRange.end_date}
                                    onChange={(e) => setDateRange({...dateRange, end_date: e.target.value})}
                                />
                            </div>
                            <div className="flex items-end">
                                <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded w-full">
                                    Generate Report
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Monthly Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-green-500">
                            <div className="text-gray-500 text-sm">Total Income</div>
                            <div className="text-2xl font-bold text-green-600">${monthlyData?.totalIncome || 0}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-red-500">
                            <div className="text-gray-500 text-sm">Total Expense</div>
                            <div className="text-2xl font-bold text-red-600">${monthlyData?.totalExpense || 0}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-blue-500">
                            <div className="text-gray-500 text-sm">Net Profit</div>
                            <div className="text-2xl font-bold text-blue-600">${monthlyData?.netProfit || 0}</div>
                        </div>
                        <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg p-6 border-l-4 border-yellow-500">
                            <div className="text-gray-500 text-sm">Fee Collected</div>
                            <div className="text-2xl font-bold text-yellow-600">${monthlyData?.feeCollected || 0}</div>
                        </div>
                    </div>

                    {/* Income & Expense Table */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg mb-6">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Income & Expense Details</h2>
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {incomeExpenses?.map(item => (
                                        <tr key={item.id}>
                                            <td className="px-6 py-4">{item.date}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                                    item.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                    {item.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">{item.category}</td>
                                            <td className="px-6 py-4">{item.description}</td>
                                            <td className="px-6 py-4 text-right font-semibold">
                                                <span className={item.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                                                    ${item.amount}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Class Wise Fee Collection */}
                    <div className="bg-white overflow-hidden shadow-sm sm:rounded-lg">
                        <div className="p-6">
                            <h2 className="text-lg font-semibold mb-4">Class Wise Fee Collection</h2>
                            <table className="min-w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Fee</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collected</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Pending</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Collection %</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {classWiseFees?.map(item => (
                                        <tr key={item.class_id}>
                                            <td className="px-6 py-4 font-medium">{item.class_name}</td>
                                            <td className="px-6 py-4 text-right">${item.total_fee}</td>
                                            <td className="px-6 py-4 text-right text-green-600">${item.collected}</td>
                                            <td className="px-6 py-4 text-right text-red-600">${item.pending}</td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end">
                                                    <span className="mr-2">{item.percentage}%</span>
                                                    <div className="w-24 bg-gray-200 rounded-full h-2">
                                                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${item.percentage}%` }}></div>
                                                    </div>
                                                </div>
                                            </td>
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
