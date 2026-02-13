import React, { useState, useEffect } from 'react';
import { reportAPI } from '../api';
import {
    AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, Legend, LineChart, Line
} from 'recharts';
import {
    TrendingUp, TrendingDown, DollarSign, CreditCard, Package,
    Users, AlertTriangle, FileText, Calendar, Download
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const TABS = [
    { key: 'sales', label: 'Sales Report', icon: TrendingUp },
    { key: 'gst', label: 'GST Report', icon: FileText },
    { key: 'pnl', label: 'Profit & Loss', icon: DollarSign },
    { key: 'productSales', label: 'Product Sales', icon: Package },
    { key: 'lowStock', label: 'Low Stock', icon: AlertTriangle },
    { key: 'outstanding', label: 'Customer Outstanding', icon: Users },
];

const Reports = () => {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [activeTab, setActiveTab] = useState('sales');
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [pnlData, setPnLData] = useState([]);
    const [gstData, setGSTData] = useState([]);
    const [productSalesData, setProductSalesData] = useState([]);
    const [lowStockData, setLowStockData] = useState([]);
    const [outstandingData, setOutstandingData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const chartTextColor = isDark ? '#9ca3af' : '#6b7280';
    const chartGridColor = isDark ? '#374151' : '#e5e7eb';

    useEffect(() => { fetchDashboard(); fetchSalesData(); fetchPnLData(); }, []);

    const fetchDashboard = async () => {
        try { const res = await reportAPI.getDashboardStats(); setStats(res.data); } catch (err) { console.error("Error fetching dashboard stats:", err); }
        setLoading(false);
    };
    const fetchSalesData = async (start, end) => {
        try { const res = await reportAPI.getSalesReport(start, end); setSalesData(res.data); } catch (err) { console.error("Error fetching sales:", err); }
    };
    const fetchPnLData = async () => {
        try { const res = await reportAPI.getPnLReport(); setPnLData(res.data); } catch (err) { console.error("Error fetching PnL:", err); }
    };
    const fetchGSTData = async (start, end) => {
        try { const res = await reportAPI.getGSTReport(start, end); setGSTData(res.data); } catch (err) { console.error("Error fetching GST:", err); }
    };
    const fetchProductSales = async () => {
        try { const res = await reportAPI.getProductSalesReport(); setProductSalesData(res.data); } catch (err) { console.error("Error fetching product sales:", err); }
    };
    const fetchLowStock = async () => {
        try { const res = await reportAPI.getLowStockReport(); setLowStockData(res.data); } catch (err) { console.error("Error fetching low stock:", err); }
    };
    const fetchOutstanding = async () => {
        try { const res = await reportAPI.getCustomerOutstandingReport(); setOutstandingData(res.data); } catch (err) { console.error("Error fetching outstanding:", err); }
    };

    useEffect(() => {
        if (activeTab === 'gst' && gstData.length === 0) fetchGSTData();
        if (activeTab === 'productSales' && productSalesData.length === 0) fetchProductSales();
        if (activeTab === 'lowStock' && lowStockData.length === 0) fetchLowStock();
        if (activeTab === 'outstanding' && outstandingData.length === 0) fetchOutstanding();
    }, [activeTab]);

    const handleDateFilter = () => {
        if (activeTab === 'sales') fetchSalesData(startDate, endDate);
        if (activeTab === 'gst') fetchGSTData(startDate, endDate);
    };
    const clearDateFilter = () => {
        setStartDate(''); setEndDate('');
        if (activeTab === 'sales') fetchSalesData();
        if (activeTab === 'gst') fetchGSTData();
    };

    const thClasses = "px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase";
    const thRightClasses = "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase";
    const tdClasses = "px-6 py-3 text-sm text-gray-900 dark:text-gray-200";
    const tdRightClasses = "px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400";

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
    );

    const summaryCards = [
        { label: 'Total Sales', value: stats?.totalSales || 0, icon: TrendingUp, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-50 dark:bg-indigo-900/30' },
        { label: 'Total Expenses', value: stats?.totalExpenses || 0, icon: TrendingDown, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/30', valueColor: 'text-red-600 dark:text-red-400' },
        { label: 'Net Profit', value: (stats?.monthlyRevenue || 0) - (stats?.monthlyExpense || 0), icon: DollarSign, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/30', subtitle: 'Current Month' },
        { label: 'Receivables', value: stats?.totalReceivables || 0, icon: CreditCard, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30', valueColor: 'text-amber-600 dark:text-amber-400' },
    ];

    return (
        <div>
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Reports & Analytics</h2>
                <p className="text-gray-500 dark:text-gray-400 mt-1">Deep insights into your business performance.</p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {summaryCards.map((card, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.label}</p>
                                <h3 className={`text-2xl font-bold mt-1 ${card.valueColor || (card.value >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400')}`}>
                                    ₹{card.value.toLocaleString()}
                                </h3>
                                {card.subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{card.subtitle}</p>}
                            </div>
                            <div className={`p-2 ${card.bg} rounded-lg`}>
                                <card.icon className={`w-6 h-6 ${card.color}`} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-8">
                <div className="border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
                    <nav className="flex -mb-px" aria-label="Tabs">
                        {TABS.map((tab) => (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key)}
                                className={`flex items-center gap-2 whitespace-nowrap py-4 px-6 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.key
                                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="p-6">
                    {/* Date Filter */}
                    {(activeTab === 'sales' || activeTab === 'gst') && (
                        <div className="flex flex-wrap items-end gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Start Date</label>
                                <input type="date" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">End Date</label>
                                <input type="date" className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                            </div>
                            <button onClick={handleDateFilter} className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors">Apply</button>
                            {(startDate || endDate) && (
                                <button onClick={clearDateFilter} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Clear</button>
                            )}
                        </div>
                    )}

                    {/* Sales Report Tab */}
                    {activeTab === 'sales' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Sales Overview</h3>
                            <div className="h-80 mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={salesData}>
                                        <defs>
                                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                                        <XAxis dataKey="name" stroke={chartTextColor} />
                                        <YAxis stroke={chartTextColor} />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, borderRadius: '12px', color: isDark ? '#e5e7eb' : '#1f2937' }} />
                                        <Legend wrapperStyle={{ color: chartTextColor }} />
                                        <Area type="monotone" dataKey="Sales" stroke="#6366f1" fillOpacity={1} fill="url(#colorSales)" strokeWidth={2.5} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            <th className={thClasses}>Month</th>
                                            <th className={thRightClasses}>Sales</th>
                                            <th className={thRightClasses}>Tax Collected</th>
                                            <th className={thRightClasses}>Orders</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {salesData.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className={`${tdClasses} font-medium`}>{row.name}</td>
                                                <td className="px-6 py-3 text-sm text-right text-green-600 dark:text-green-400 font-bold">₹{row.Sales?.toLocaleString()}</td>
                                                <td className={tdRightClasses}>₹{(row.Tax || 0).toLocaleString()}</td>
                                                <td className={tdRightClasses}>{row.Orders}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* GST Report Tab */}
                    {activeTab === 'gst' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">GST Report</h3>
                            {gstData.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No GST data found for the selected period.</p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                {['Month', 'Taxable Amount', 'CGST', 'SGST', 'Total Tax', 'Total', 'Invoices'].map((h, i) => (
                                                    <th key={h} className={i === 0 ? thClasses : thRightClasses}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {gstData.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className={`${tdClasses} font-medium`}>{row.month}</td>
                                                    <td className={tdRightClasses}>₹{row.taxableAmount?.toLocaleString()}</td>
                                                    <td className="px-6 py-3 text-sm text-right text-blue-600 dark:text-blue-400">₹{row.cgst?.toLocaleString()}</td>
                                                    <td className="px-6 py-3 text-sm text-right text-blue-600 dark:text-blue-400">₹{row.sgst?.toLocaleString()}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-bold text-indigo-600 dark:text-indigo-400">₹{row.totalTax?.toLocaleString()}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-bold text-gray-900 dark:text-white">₹{row.totalWithTax?.toLocaleString()}</td>
                                                    <td className={tdRightClasses}>{row.invoiceCount}</td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                                <td className={tdClasses}>Total</td>
                                                <td className={tdRightClasses}>₹{gstData.reduce((s, r) => s + (r.taxableAmount || 0), 0).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-sm text-right text-blue-600 dark:text-blue-400">₹{gstData.reduce((s, r) => s + (r.cgst || 0), 0).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-sm text-right text-blue-600 dark:text-blue-400">₹{gstData.reduce((s, r) => s + (r.sgst || 0), 0).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-sm text-right text-indigo-600 dark:text-indigo-400">₹{gstData.reduce((s, r) => s + (r.totalTax || 0), 0).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white">₹{gstData.reduce((s, r) => s + (r.totalWithTax || 0), 0).toLocaleString()}</td>
                                                <td className={tdRightClasses}>{gstData.reduce((s, r) => s + (r.invoiceCount || 0), 0)}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* P&L Report Tab */}
                    {activeTab === 'pnl' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Profit & Loss Analysis (Last 6 Months)</h3>
                            <div className="h-80 mb-8">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={pnlData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                                        <XAxis dataKey="name" stroke={chartTextColor} />
                                        <YAxis stroke={chartTextColor} />
                                        <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, borderRadius: '12px', color: isDark ? '#e5e7eb' : '#1f2937' }} />
                                        <Legend wrapperStyle={{ color: chartTextColor }} />
                                        <Bar dataKey="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                                        <tr>
                                            {['Month', 'Revenue', 'Expense', 'Profit', 'Margin'].map((h, i) => (
                                                <th key={h} className={i === 0 ? thClasses : thRightClasses}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {pnlData.map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                <td className={`${tdClasses} font-medium`}>{row.name}</td>
                                                <td className="px-6 py-3 text-sm text-right text-indigo-600 dark:text-indigo-400 font-bold">₹{row.Revenue?.toLocaleString()}</td>
                                                <td className="px-6 py-3 text-sm text-right text-red-600 dark:text-red-400">₹{row.Expense?.toLocaleString()}</td>
                                                <td className={`px-6 py-3 text-sm text-right font-bold ${row.Profit >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>₹{row.Profit?.toLocaleString()}</td>
                                                <td className={tdRightClasses}>{row.Revenue > 0 ? `${((row.Profit / row.Revenue) * 100).toFixed(1)}%` : '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Product Sales Tab */}
                    {activeTab === 'productSales' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Product Sales Report</h3>
                            {productSalesData.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No product sales data found.</p>
                            ) : (
                                <>
                                    <div className="h-80 mb-8">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={productSalesData.slice(0, 10)} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} />
                                                <XAxis type="number" stroke={chartTextColor} />
                                                <YAxis dataKey="productName" type="category" width={120} tick={{ fontSize: 12, fill: chartTextColor }} />
                                                <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, borderRadius: '12px', color: isDark ? '#e5e7eb' : '#1f2937' }} />
                                                <Bar dataKey="totalRevenue" fill="#6366f1" radius={[0, 4, 4, 0]} name="Revenue" />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                                <tr>
                                                    {['Product', 'SKU'].map(h => <th key={h} className={thClasses}>{h}</th>)}
                                                    {['Qty Sold', 'Revenue', 'Tax', 'Orders', 'Current Stock'].map(h => <th key={h} className={thRightClasses}>{h}</th>)}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                                {productSalesData.map((row, i) => (
                                                    <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                        <td className={`${tdClasses} font-medium`}>{row.productName}</td>
                                                        <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{row.sku || '-'}</td>
                                                        <td className={tdRightClasses}>{row.totalQty}</td>
                                                        <td className="px-6 py-3 text-sm text-right font-bold text-green-600 dark:text-green-400">₹{row.totalRevenue?.toLocaleString()}</td>
                                                        <td className={tdRightClasses}>₹{row.totalTax?.toLocaleString()}</td>
                                                        <td className={tdRightClasses}>{row.orderCount}</td>
                                                        <td className="px-6 py-3 text-sm text-right">
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${(row.currentStock || 0) <= 5 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                                                                {row.currentStock ?? 'N/A'}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* Low Stock Tab */}
                    {activeTab === 'lowStock' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                                Low Stock Alert
                                {lowStockData.length > 0 && (
                                    <span className="ml-3 px-3 py-1 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-semibold">{lowStockData.length} items</span>
                                )}
                            </h3>
                            {lowStockData.length === 0 ? (
                                <div className="text-center py-12">
                                    <Package className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">All products are well-stocked!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                {['Product', 'SKU', 'Category'].map(h => <th key={h} className={thClasses}>{h}</th>)}
                                                {['Current Stock', 'Min Level', 'Max Level', 'Status'].map(h => <th key={h} className={thRightClasses}>{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {lowStockData.map((item) => (
                                                <tr key={item._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className={`${tdClasses} font-medium`}>{item.name}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{item.sku || '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{item.category || '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-bold text-red-600 dark:text-red-400">{item.currentStock}</td>
                                                    <td className={tdRightClasses}>{item.minStockLevel}</td>
                                                    <td className={tdRightClasses}>{item.maxStockLevel || '-'}</td>
                                                    <td className="px-6 py-3 text-sm text-right">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${item.currentStock === 0 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'}`}>
                                                            {item.currentStock === 0 ? 'Out of Stock' : 'Low Stock'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Customer Outstanding Tab */}
                    {activeTab === 'outstanding' && (
                        <div>
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                                Customer Outstanding Report
                                {outstandingData.length > 0 && (
                                    <span className="ml-3 text-base font-normal text-gray-500 dark:text-gray-400">
                                        Total Due: ₹{outstandingData.reduce((s, r) => s + (r.totalDue || 0), 0).toLocaleString()}
                                    </span>
                                )}
                            </h3>
                            {outstandingData.length === 0 ? (
                                <div className="text-center py-12">
                                    <Users className="w-16 h-16 text-green-400 mx-auto mb-4" />
                                    <p className="text-gray-500 dark:text-gray-400 text-lg">No outstanding payments!</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                                            <tr>
                                                {['Customer', 'Contact'].map(h => <th key={h} className={thClasses}>{h}</th>)}
                                                {['Invoices', 'Total Invoice', 'Amount Due', 'Aging (Days)'].map(h => <th key={h} className={thRightClasses}>{h}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                            {outstandingData.map((row, i) => (
                                                <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                                    <td className={`${tdClasses} font-medium`}>{row.customerName}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-500 dark:text-gray-400">{row.phone || row.email || '-'}</td>
                                                    <td className={tdRightClasses}>{row.invoiceCount}</td>
                                                    <td className={tdRightClasses}>₹{row.totalInvoiceAmount?.toLocaleString()}</td>
                                                    <td className="px-6 py-3 text-sm text-right font-bold text-red-600 dark:text-red-400">₹{row.totalDue?.toLocaleString()}</td>
                                                    <td className="px-6 py-3 text-sm text-right">
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${Math.round(row.daysPending || 0) > 30 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' : Math.round(row.daysPending || 0) > 15 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'}`}>
                                                            {Math.round(row.daysPending || 0)} days
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            <tr className="bg-gray-100 dark:bg-gray-700 font-bold">
                                                <td className={tdClasses} colSpan="2">Total</td>
                                                <td className={tdRightClasses}>{outstandingData.reduce((s, r) => s + (r.invoiceCount || 0), 0)}</td>
                                                <td className={tdRightClasses}>₹{outstandingData.reduce((s, r) => s + (r.totalInvoiceAmount || 0), 0).toLocaleString()}</td>
                                                <td className="px-6 py-3 text-sm text-right text-red-600 dark:text-red-400">₹{outstandingData.reduce((s, r) => s + (r.totalDue || 0), 0).toLocaleString()}</td>
                                                <td className={tdRightClasses}>-</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Monthly Comparison Chart */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Monthly Revenue vs Expense Comparison</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pnlData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                            <XAxis dataKey="name" stroke={chartTextColor} />
                            <YAxis stroke={chartTextColor} />
                            <Tooltip formatter={(value) => `₹${value.toLocaleString()}`} contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#fff', border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`, borderRadius: '12px', color: isDark ? '#e5e7eb' : '#1f2937' }} />
                            <Legend wrapperStyle={{ color: chartTextColor }} />
                            <Line type="monotone" dataKey="Revenue" stroke="#6366f1" strokeWidth={3} dot={{ r: 5 }} />
                            <Line type="monotone" dataKey="Expense" stroke="#ef4444" strokeWidth={3} dot={{ r: 5 }} />
                            <Line type="monotone" dataKey="Profit" stroke="#10b981" strokeWidth={3} dot={{ r: 5 }} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Reports;
