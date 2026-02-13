import React, { useState, useEffect } from 'react';
import { reportAPI } from '../api';
import { Users, AlertTriangle, CheckCircle, Mail, Calendar, DollarSign, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const DebtorList = () => {
    const [debtors, setDebtors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDebtors = async () => {
            try {
                const res = await reportAPI.getCustomerOutstandingReport();
                setDebtors(res.data);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching debtors:", error);
                toast.error("Failed to load debtors report");
                setLoading(false);
            }
        };
        fetchDebtors();
    }, []);

    const handleSendReminder = (debtor) => {
        if (!debtor.email) {
            toast.error(`No email address found for ${debtor.customerName}. Please add an email first.`);
            return;
        }
        toast.promise(
            reportAPI.sendReminder(debtor),
            {
                loading: `Sending reminder to ${debtor.email}...`,
                success: `Reminder sent to ${debtor.customerName}!`,
                error: (err) => err?.response?.data?.message || 'Failed to send reminder',
            }
        );
    };

    const filteredDebtors = debtors.filter(d =>
        d.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (d.email && d.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const totalOutstanding = debtors.reduce((acc, curr) => acc + curr.totalDue, 0);

    const getOverdueStatus = (days) => {
        if (days > 60) return { color: 'text-red-600 bg-red-100', text: '> 60 Days' };
        if (days > 30) return { color: 'text-orange-600 bg-orange-100', text: '30-60 Days' };
        return { color: 'text-blue-600 bg-blue-100', text: '< 30 Days' };
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    return (
        <div className="p-2 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Debtors Management</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track unpaid invoices and manage outstanding payments.</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 px-4 py-2 rounded-xl border border-red-100 dark:border-red-900/30">
                    <p className="text-xs text-red-600 dark:text-red-400 font-medium uppercase tracking-wider">Total Outstanding</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-700 dark:text-red-300">₹{totalOutstanding.toLocaleString()}</p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex gap-4">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        placeholder="Search debtors by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Debtors List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDebtors.map((debtor, index) => {
                    const status = getOverdueStatus(debtor.daysPending);
                    return (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                                            {debtor.customerName.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-white truncate max-w-[150px]" title={debtor.customerName}>{debtor.customerName}</h3>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{debtor.invoiceCount} invoices pending</p>
                                        </div>
                                    </div>
                                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${status.color}`}>
                                        {status.text}
                                    </span>
                                </div>

                                <div className="space-y-3 mb-5">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" /> Total Due
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-white">₹{debtor.totalDue.toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-500 dark:text-gray-400 flex items-center gap-2">
                                            <Calendar className="w-4 h-4" /> Oldest Due
                                        </span>
                                        <span className="text-gray-700 dark:text-gray-300">
                                            {new Date(debtor.oldestInvoice).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <button
                                        onClick={() => handleSendReminder(debtor)}
                                        className="flex-1 flex items-center justify-center px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                                    >
                                        <Mail className="w-4 h-4 mr-2" />
                                        Remind
                                    </button>
                                    <button
                                        onClick={() => navigate(`/customers/${debtor._id}`)} // Assuming _id is customerId
                                        className="flex-1 flex items-center justify-center px-4 py-2 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        details
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {filteredDebtors.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                    <p className="text-gray-900 dark:text-white font-medium">No debtors found!</p>
                    <p className="text-gray-500 dark:text-gray-400 text-sm">Great job! All payments are up to date.</p>
                </div>
            )}
        </div>
    );
};

export default DebtorList;
