import React, { useState, useEffect } from 'react';
import { paymentAPI } from '../api';
import { Search, Download } from 'lucide-react';
import jsPDF from "jspdf";

const PaymentsList = () => {
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchPayments(); }, []);

    const fetchPayments = async () => {
        try {
            const res = await paymentAPI.getAll();
            setPayments(res.data.payments || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching payments:", err);
            setLoading(false);
        }
    };

    const downloadReceipt = (payment) => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text("Payment Receipt", 105, 20, null, null, "center");
        doc.setFontSize(12);
        doc.text(`Receipt ID: ${payment._id}`, 20, 40);
        doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, 20, 50);
        doc.text(`Received From: ${payment.customerId?.name || 'Customer'}`, 20, 70);
        doc.text(`Amount Received: Rs. ${payment.amount}`, 20, 80);
        doc.text(`Payment Mode: ${payment.paymentMode}`, 20, 90);
        if (payment.reference) doc.text(`Reference: ${payment.reference}`, 20, 100);
        doc.text(`Towards Invoice: #${payment.invoiceId?._id?.slice(-6).toUpperCase() || 'Unknown'}`, 20, 120);
        doc.save(`Receipt_${payment._id}.pdf`);
    };

    const filteredPayments = payments.filter(payment =>
        payment.customerId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        payment.reference?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Payments History</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track all received payments.</p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                        placeholder="Search by customer or reference..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            {['Date', 'Customer', 'Invoice', 'Amount', 'Mode', 'Reference', 'Receipt'].map(h => (
                                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredPayments.map((payment) => (
                            <tr key={payment._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(payment.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {payment.customerId?.name || 'Unknown'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    #{payment.invoiceId?._id?.slice(-6).toUpperCase()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600 dark:text-green-400">
                                    ₹{payment.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400">
                                        {payment.paymentMode}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {payment.reference || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <button onClick={() => downloadReceipt(payment)} className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center transition-colors">
                                        <Download className="w-4 h-4 mr-1" /> Receipt
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {filteredPayments.length === 0 && (
                            <tr>
                                <td colSpan="7" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No payments found</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PaymentsList;
