import React, { useState, useEffect } from 'react';
import { expenseAPI } from '../api';
import { Plus, Trash2, Search, X, Paperclip, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const ExpenseList = () => {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('');

    const initialExpenseState = {
        description: '', amount: '', category: 'Other', vendor: '',
        paymentMode: 'CASH', date: new Date().toISOString().split('T')[0], notes: ''
    };

    const [newExpense, setNewExpense] = useState(initialExpenseState);
    const [receiptFile, setReceiptFile] = useState(null);

    const categories = ['Rent', 'Salaries', 'Utilities', 'Maintenance', 'Office Supplies', 'Marketing', 'Other'];

    useEffect(() => { fetchExpenses(); }, []);

    const fetchExpenses = async () => {
        try {
            const res = await expenseAPI.getAll();
            setExpenses(res.data.expenses || []);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching expenses:", err);
            setLoading(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) return;
        try {
            await expenseAPI.delete(id);
            toast.success("Expense deleted successfully!");
            fetchExpenses();
        } catch (error) {
            console.error("Error deleting expense:", error);
            toast.error("Failed to delete expense");
        }
    };

    const handleCreateExpense = async (e) => {
        e.preventDefault();
        try {
            const formData = new FormData();
            formData.append('description', newExpense.description);
            formData.append('amount', newExpense.amount);
            formData.append('category', newExpense.category);
            formData.append('vendor', newExpense.vendor);
            formData.append('paymentMode', newExpense.paymentMode);
            formData.append('date', newExpense.date);
            formData.append('notes', newExpense.notes);
            if (receiptFile) formData.append('receipt', receiptFile);

            await expenseAPI.create(formData);
            toast.success("Expense created successfully!");
            setShowModal(false);
            setNewExpense(initialExpenseState);
            setReceiptFile(null);
            fetchExpenses();
        } catch (err) {
            console.error("Error creating expense:", err);
            toast.error("Error creating expense");
        }
    };

    const filteredExpenses = expenses.filter(expense =>
        (expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            expense.vendor?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (categoryFilter === '' || expense.category === categoryFilter)
    );

    const totalExpense = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    const inputClasses = "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-red-500 transition-colors";

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
        </div>
    );

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Expenses</h2>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Track business expenses and pending bills.</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-lg border border-red-200 dark:border-red-800">
                        <span className="text-red-600 dark:text-red-400 font-medium text-sm block">Total Expenses</span>
                        <span className="text-red-800 dark:text-red-300 font-bold text-lg">₹{totalExpense.toLocaleString()}</span>
                    </div>
                    <button onClick={() => setShowModal(true)} className="flex items-center px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-md transform hover:-translate-y-0.5">
                        <Plus className="w-5 h-5 mr-2" />
                        Add Expense
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                        placeholder="Search description or vendor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="sm:w-48">
                    <select
                        className="block w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                </div>
            </div>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            {['Date', 'Description', 'Category', 'Vendor', 'Amount', 'Bill', 'Actions'].map(h => (
                                <th key={h} className={`px-6 py-3 text-${h === 'Actions' ? 'right' : 'left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredExpenses.map((expense) => (
                            <tr key={expense._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(expense.date).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-gray-200">
                                    {expense.description}
                                    {expense.notes && <div className="text-xs text-gray-400 dark:text-gray-500 font-normal">{expense.notes}</div>}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                                        {expense.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {expense.vendor || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600 dark:text-red-400">
                                    ₹{expense.amount.toLocaleString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    {expense.receiptUrl ? (
                                        <a href={`${API_BASE}${expense.receiptUrl}`} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 flex items-center gap-1">
                                            <Paperclip className="w-4 h-4" />
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    ) : (
                                        <span className="text-gray-300 dark:text-gray-600">—</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleDeleteExpense(expense._id)} className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Add Expense</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"><X className="w-6 h-6" /></button>
                        </div>
                        <form onSubmit={handleCreateExpense} className="p-8 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description *</label>
                                <input type="text" className={inputClasses} value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Amount *</label>
                                    <input type="number" className={inputClasses} value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                                    <select className={inputClasses} value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
                                    <input type="date" className={inputClasses} value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Vendor</label>
                                    <input type="text" className={inputClasses} value={newExpense.vendor} onChange={(e) => setNewExpense({ ...newExpense, vendor: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Payment Mode</label>
                                <select className={inputClasses} value={newExpense.paymentMode} onChange={(e) => setNewExpense({ ...newExpense, paymentMode: e.target.value })}>
                                    <option value="CASH">Cash</option>
                                    <option value="UPI">UPI</option>
                                    <option value="BANK">Bank Transfer</option>
                                    <option value="CARD">Card</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Attach Bill</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <label className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors">
                                        <Paperclip className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                        <span className="text-sm text-gray-600 dark:text-gray-400">{receiptFile ? receiptFile.name : 'Choose file (PDF/Image)'}</span>
                                        <input type="file" className="hidden" accept="image/*,.pdf" onChange={(e) => setReceiptFile(e.target.files[0])} />
                                    </label>
                                    {receiptFile && (
                                        <button type="button" onClick={() => setReceiptFile(null)} className="text-red-500 hover:text-red-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Notes</label>
                                <textarea className={inputClasses} rows="2" value={newExpense.notes} onChange={(e) => setNewExpense({ ...newExpense, notes: e.target.value })}></textarea>
                            </div>
                            <div className="flex justify-end gap-3 pt-4">
                                <button type="button" onClick={() => { setShowModal(false); setReceiptFile(null); }} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                                <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-md">Save Expense</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ExpenseList;
