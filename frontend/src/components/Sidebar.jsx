import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FileText, PlusCircle, Package, User, LogOut, DollarSign, Receipt, BarChart3, ShoppingCart, Truck, ClipboardList, Building2, AlertTriangle, IndianRupee, ReceiptIndianRupee } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
    const location = useLocation();
    const { logout } = useAuth();

    const navigation = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'Invoices', href: '/invoices', icon: FileText },
        { name: 'Create Invoice', href: '/create-invoice', icon: PlusCircle },
        { name: 'Products', href: '/products', icon: Package },
        { name: 'Customers', href: '/customers', icon: User },
        { name: 'Quotations', href: '/quotations', icon: ClipboardList },
        { divider: true },

        { name: 'Purchases', href: '/purchases', icon: ShoppingCart }, // NEW
        { name: 'Vendors', href: '/vendors', icon: Building2 }, // NEW
        { name: 'Payments', href: '/payments', icon: IndianRupee },
        { name: 'Expenses', href: '/expenses', icon: ReceiptIndianRupee },
        {divider:true},
        { name: 'Reports', href: '/reports', icon: BarChart3 },
        { name: 'Debtors', href: '/debtors', icon: AlertTriangle }, // NEW
    ];

    return (
        <div className="flex flex-col w-64 bg-gray-900 dark:bg-gray-900 border-r border-gray-800 min-h-screen fixed left-0 top-0 z-50">
            <div className="flex items-center justify-center h-16 border-b border-gray-800">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold text-white tracking-wider">BhuExpert</span>
                </div>
            </div>
            <div className="flex-1 flex flex-col overflow-y-auto">
                <nav className="flex-1 px-4 py-6 space-y-1">
                    {navigation.map((item) => {
                        if (item.divider) {
                            return <div key={Math.random()} className="my-3 border-t border-gray-700"></div>;
                        }
                        const isActive = location.pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${isActive
                                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
                <div className="border-t border-gray-800 p-4">
                    <button
                        onClick={logout}
                        className="flex items-center w-full px-4 py-2.5 text-sm font-medium text-red-400 rounded-lg hover:bg-gray-800 hover:text-red-300 transition-colors"
                    >
                        <LogOut className="mr-3 h-5 w-5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
