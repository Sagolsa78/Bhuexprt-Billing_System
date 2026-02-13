import React, { useState, useEffect } from 'react';
import { invoiceAPI, customerAPI, reportAPI, productAPI } from '../api';
import { DollarSign, FileText, Users, TrendingDown, TrendingUp, Package, AlertTriangle } from 'lucide-react';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart
} from 'recharts';
import { useTheme } from '../context/ThemeContext';
import { formatCurrency } from '../utils/formatCurrency';

const colorSystem = {
  success: {
    gradient: 'from-emerald-500 to-green-600',
    bgLight: 'bg-emerald-50',
    text: 'text-emerald-600',
    ring: 'ring-emerald-200'
  },
  danger: {
    gradient: 'from-rose-500 to-red-600',
    bgLight: 'bg-rose-50',
    text: 'text-rose-600',
    ring: 'ring-rose-200'
  },
  warning: {
    gradient: 'from-amber-500 to-orange-600',
    bgLight: 'bg-amber-50',
    text: 'text-amber-600',
    ring: 'ring-amber-200'
  },
  info: {
    gradient: 'from-indigo-500 to-blue-600',
    bgLight: 'bg-indigo-50',
    text: 'text-indigo-600',
    ring: 'ring-indigo-200'
  },
  secondary: {
    gradient: 'from-purple-500 to-violet-600',
    bgLight: 'bg-purple-50',
    text: 'text-purple-600',
    ring: 'ring-purple-200'
  }
};
const Dashboard = () => {
    const { theme } = useTheme();
    const [invoices, setInvoices] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [stats, setStats] = useState(null);
    const [salesData, setSalesData] = useState([]);
    const [pnlData, setPnlData] = useState([]);
    const [lowStockData, setLowStockData] = useState([]);
    const [loading, setLoading] = useState(true);

    const isDark = theme === 'dark';

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [invoiceRes, customerRes, statsRes, salesRes, pnlRes, lowStockRes] = await Promise.all([
                    invoiceAPI.getAll(),
                    customerAPI.getAll(),
                    reportAPI.getDashboardStats().catch(() => ({ data: {} })),
                    reportAPI.getSalesReport().catch(() => ({ data: [] })),
                    reportAPI.getPnLReport().catch(() => ({ data: [] })),
                    reportAPI.getLowStockReport().catch(() => ({ data: [] })),
                ]);
                setInvoices(invoiceRes.data);
                setCustomers(customerRes.data);
                setStats(statsRes.data);
                setSalesData(salesRes.data || []);
                setPnlData(pnlRes.data || []);
                setLowStockData(lowStockRes.data || []);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching dashboard data:", err);
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const totalRevenue = stats?.totalSales || invoices.reduce((acc, inv) => acc + (inv.status === 'PAID' ? inv.total : 0), 0);
    const pendingAmount = stats?.totalReceivables || invoices.reduce((acc, inv) => acc + (inv.status === 'UNPAID' ? inv.total : 0), 0);
    const totalExpenses = stats?.totalExpenses || 0;
    const netProfit = (stats?.monthlyRevenue || 0) - (stats?.monthlyExpense || 0);
    const totalInvoices = invoices.length;

    // Invoice status distribution for pie chart
    const paidCount = invoices.filter(i => i.status === 'PAID').length;
    const partialCount = invoices.filter(i => i.status === 'PARTIAL').length;
    const unpaidCount = invoices.filter(i => i.status === 'UNPAID' || i.status === 'PENDING').length;
    const pieData = [
        { name: 'Paid', value: paidCount, color: '#10b981' },
        { name: 'Partial', value: partialCount, color: '#f59e0b' },
        { name: 'Unpaid', value: unpaidCount, color: '#ef4444' },
    ].filter(d => d.value > 0);

    // Recent 5 invoices
    const recentInvoices = [...invoices].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);

    const chartTextColor = isDark ? '#9ca3af' : '#6b7280';
    const chartGridColor = isDark ? '#374151' : '#e5e7eb';

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-xl z-50">
                    <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1">{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm" style={{ color: entry.color }}>
                            {entry.name}: ₹{Number(entry.value).toLocaleString()}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
    );

    const statCards = [
        {
            title: 'Total Revenue',
            value: totalRevenue,
            icon: DollarSign,
            theme: 'success'
        },
        {
            title: 'Total Expenses',
            value: totalExpenses,
            icon: TrendingDown,
            theme: 'danger'
        },
        {
            title: 'Net Profit',
            value: netProfit,
            icon: TrendingUp,
            theme: netProfit >= 0 ? 'success' : 'warning',
            subtitle: 'This Month'
        },
        {
            title: 'Receivables',
            value: pendingAmount,
            icon: DollarSign,
            theme: 'warning'
        },
        {
            title: 'Total Invoices',
            value: totalInvoices,
            icon: FileText,
            theme: 'info',
            isCount: true
        },
        {
            title: 'Total Customers',
            value: customers.length,
            icon: Users,
            theme: 'secondary',
            isCount: true
        }
    ];
    return (
        <div className="p-2 sm:p-4">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-6 sm:mb-8">Dashboard Overview</h2>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 mb-8">
                {statCards.map((card, index) => {
                    const themeColors = colorSystem[card.theme];

                    return (
                        <div
                            key={index}
                            className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 
      shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 
      relative overflow-hidden group`}
                        >
                            {/* Top Accent Line */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${themeColors.gradient}`} />

                            <div className="p-5 flex items-center">
                                <div className={`flex-shrink-0 ${themeColors.bgLight} dark:bg-gray-700 rounded-xl p-3`}>
                                    <card.icon className={`h-5 w-5 ${themeColors.text}`} />
                                </div>

                                <div className="ml-4 w-0 flex-1">
                                    <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                                        {card.title}
                                    </p>

                                    <p className={`text-xl font-bold ${themeColors.text} mt-1`}>
                                        {card.isCount ? card.value : formatCurrency(card.value)}
                                    </p>

                                    {card.subtitle && (
                                        <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Sales Trend Area Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Sales Trend</h3>
                    <div className="h-[280px] w-full">
                        {salesData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                    <XAxis dataKey="name" stroke={chartTextColor} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke={chartTextColor} fontSize={12} tickFormatter={formatCurrency} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area type="monotone" dataKey="Sales" stroke="#6366f1" fill="url(#salesGradient)" strokeWidth={2.5} />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <p>No sales data available yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Revenue vs Expense Bar Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue vs Expenses</h3>
                    <div className="h-[280px] w-full">
                        {pnlData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={pnlData} barGap={4} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke={chartGridColor} vertical={false} />
                                    <XAxis dataKey="name" stroke={chartTextColor} fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke={chartTextColor} fontSize={12} tickFormatter={formatCurrency} tickLine={false} axisLine={false} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend wrapperStyle={{ color: chartTextColor, fontSize: 12, paddingTop: '10px' }} />
                                    <Bar dataKey="Revenue" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                    <Bar dataKey="Profit" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <p>No P&L data available yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Invoice Status Pie Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Status</h3>
                    <div className="h-[280px] w-full">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={90}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={index} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value, name) => [`${value} invoices`, name]}
                                        contentStyle={{
                                            backgroundColor: isDark ? '#1f2937' : '#fff',
                                            border: `1px solid ${isDark ? '#374151' : '#e5e7eb'}`,
                                            borderRadius: '12px',
                                            color: isDark ? '#e5e7eb' : '#1f2937'
                                        }}
                                    />
                                    <Legend
                                        wrapperStyle={{ color: chartTextColor, fontSize: 13 }}
                                        formatter={(value) => <span className="text-gray-600 dark:text-gray-400">{value}</span>}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                                <p>No invoice data available yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 p-6 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Low Stock Alerts</h3>
                        {lowStockData.length > 0 && (
                            <span className="ml-auto text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2.5 py-1 rounded-full">
                                {lowStockData.length} items
                            </span>
                        )}
                    </div>
                    {lowStockData.length > 0 ? (
                        <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                            {lowStockData.map((product) => (
                                <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                                            <Package className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-200">{product.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{product.sku || 'No SKU'}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-red-600 dark:text-red-400">{product.currentStock || 0}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Min: {product.minStockLevel}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-[250px] flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                            <Package className="w-12 h-12 mb-3 opacity-30" />
                            <p className="text-sm">All products are well stocked! 🎉</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Recent Invoices Table */}
            <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                    <h3 className="text-lg leading-6 font-semibold text-gray-900 dark:text-white">Recent Invoices</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {recentInvoices.map((invoice) => (
                                <tr key={invoice._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                                        {invoice.customerName || invoice.customerId?.name || 'Unknown'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(invoice.createdAt).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-200">
                                        ₹{invoice.total.toFixed(2)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === 'PAID' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                                            invoice.status === 'PARTIAL' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'}`}>
                                            {invoice.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {recentInvoices.length === 0 && (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">No invoices found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
