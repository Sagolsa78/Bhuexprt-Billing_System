import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { customerAPI } from '../api';
import { ArrowLeft, Download, FileText, DollarSign, MapPin, Phone, Mail, CreditCard } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const CustomerDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => { fetchCustomerDetails(); }, [id]);

    const fetchCustomerDetails = async () => {
        try {
            const res = await customerAPI.getLedger(id);
            setCustomer(res.data.customer);
            setTransactions(res.data.transactions);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching customer details:", err);
            setError("Failed to load customer details");
            setLoading(false);
        }
    };

    const exportPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(20);
        doc.text("Customer Statement", 14, 22);
        doc.setFontSize(12);
        doc.text(`Customer: ${customer.name}`, 14, 32);
        doc.text(`Email: ${customer.email}`, 14, 38);
        doc.text(`Phone: ${customer.phone}`, 14, 44);
        if (customer.gstNumber) doc.text(`GST: ${customer.gstNumber}`, 14, 50);
        doc.text(`Date: ${new Date().toLocaleDateString()}`, 150, 32);
        doc.text(`Balance Due: ₹${customer.outstandingBalance}`, 150, 38);

        const tableColumn = ["Date", "Type", "Reference/ID", "Credit (Paid)", "Debit (Inv)", "Status"];
        const tableRows = [];
        transactions.forEach(t => {
            const date = new Date(t.date).toLocaleDateString();
            const ref = t.type === 'INVOICE' ? `INV-${t._id.slice(-6)}` : `PAY-${t._id.slice(-6)}`;
            const debit = t.type === 'INVOICE' ? t.total : '-';
            const credit = t.type === 'PAYMENT' ? t.amount : '-';
            const status = t.status || t.paymentMode || '-';
            tableRows.push([date, t.type, ref, credit, debit, status]);
        });
        doc.autoTable({ head: [tableColumn], body: tableRows, startY: 60 });
        doc.save(`statement_${customer.name}_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    if (loading) return <div className="text-center mt-20 text-gray-500 dark:text-gray-400">Loading...</div>;
    if (error) return <div className="text-center mt-20 text-red-600 dark:text-red-400">{error}</div>;
    if (!customer) return <div className="text-center mt-20 text-gray-500 dark:text-gray-400">Customer not found</div>;

    return (
        <div>
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div className="flex items-center">
                    <button onClick={() => navigate('/customers')} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </button>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{customer.name}</h2>
                        <p className="text-gray-500 dark:text-gray-400 flex items-center mt-1">
                            <Mail className="w-4 h-4 mr-1" /> {customer.email} •
                            <Phone className="w-4 h-4 mx-1" /> {customer.phone}
                        </p>
                    </div>
                </div>
                <button onClick={exportPDF} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-shadow shadow-sm">
                    <Download className="w-4 h-4 mr-2" /> Export Statement
                </button>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                        <CreditCard className="w-5 h-5 mr-2" />
                        <span className="font-medium">Outstanding Balance</span>
                    </div>
                    <p className={`text-3xl font-bold ${customer.outstandingBalance > 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        ₹{customer.outstandingBalance?.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                        <DollarSign className="w-5 h-5 mr-2" />
                        <span className="font-medium">Credit Limit</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900 dark:text-white">
                        {customer.creditLimit > 0 ? `₹${customer.creditLimit.toFixed(2)}` : 'No Limit'}
                    </p>
                </div>
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center text-gray-500 dark:text-gray-400 mb-2">
                        <MapPin className="w-5 h-5 mr-2" />
                        <span className="font-medium">Details</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 truncate">{customer.address || 'No Address'}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">GST: {customer.gstNumber || 'N/A'}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 italic">{customer.notes || 'No notes'}</p>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Transaction History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Date</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Type</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Reference</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-green-600 dark:text-green-400 uppercase">Credit (Paid)</th>
                                <th className="px-6 py-3 text-right text-xs font-semibold text-red-600 dark:text-red-400 uppercase">Debit (Invoice)</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pl-10">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {transactions.map((t) => (
                                <tr key={t._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                        {new Date(t.date).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${t.type === 'INVOICE' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400' : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'}`}>
                                            {t.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-600 dark:text-indigo-400 font-medium">
                                        {t.type === 'INVOICE' ? `INV-${t._id.slice(-6).toUpperCase()}` : `PAY-${t._id.slice(-6).toUpperCase()}`}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-green-600 dark:text-green-400">
                                        {t.type === 'PAYMENT' ? `₹${t.amount}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium text-red-600 dark:text-red-400">
                                        {t.type === 'INVOICE' ? `₹${t.total}` : '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 pl-10">
                                        {t.status || t.paymentMode}
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">No transactions found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default CustomerDetails;
