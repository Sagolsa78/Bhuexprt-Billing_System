import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sun,
  Moon,
  Bell,
  User,
  LogOut,
  ChevronDown,
  Plus,
  FileText,
  ShoppingCart,
  ClipboardList,
  Package,
  Building2,
  Receipt,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false); // 'create' | 'profile' | false
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 h-16 flex items-center justify-between px-6 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700/50">
      {/* Left: Page title / breadcrumb space */}
      <div className="flex items-center">
        {/* <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                    BhuExpert ERP
                </h1> */}
      </div>

      {/* Right: Controls */}
      <div ref={dropdownRef} className="flex items-center gap-3">
        {/* Create New Dropdown */}
        <div className="relative">
          <button
            onClick={() =>
              setDropdownOpen(dropdownOpen === "create" ? false : "create")
            }
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span>Create</span>
            <ChevronDown
              className={`w-3 h-3 transition-transform duration-200 ${dropdownOpen === "create" ? "rotate-180" : ""}`}
            />
          </button>

          {dropdownOpen === "create" && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Documents
              </div>
              <Link
                to="/create-invoice"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <FileText className="w-4 h-4 text-blue-500" /> Create Invoice
              </Link>
              <Link
                to="/purchase/create-purchase"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <ShoppingCart className="w-4 h-4 text-purple-500" /> Create
                Purchase
              </Link>
              <Link
                to="/create-quotation"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <ClipboardList className="w-4 h-4 text-amber-500" /> Create
                Quotation
              </Link>
              <Link
                to="/purchase/create-purchase"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <ClipboardList className="w-4 h-4 text-amber-500" /> Scan
                Invoice
              </Link>

              <div className="my-1 border-t border-gray-100 dark:border-gray-700"></div>

              <div className="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Add New
              </div>
              <div className="grid grid-cols-2 gap-1 px-2">
                <Link
                  to="/products"
                  onClick={() => setDropdownOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-center"
                >
                  <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-1">
                    <Package className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Product
                  </span>
                </Link>
                <Link
                  to="/customers"
                  onClick={() => setDropdownOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-center"
                >
                  <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg mb-1">
                    <User className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Customer
                  </span>
                </Link>
                <Link
                  to="/vendors"
                  onClick={() => setDropdownOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-center"
                >
                  <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg mb-1">
                    <Building2 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Vendor
                  </span>
                </Link>
                <Link
                  to="/expenses"
                  onClick={() => setDropdownOpen(false)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 text-center"
                >
                  <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg mb-1">
                    <Receipt className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    Expense
                  </span>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200"
          title={
            theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"
          }
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        {/* Notification Bell */}
        <button className="relative p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all duration-200">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-900"></span>
        </button>

        {/* Divider */}
        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 mx-1"></div>

        {/* User Profile Dropdown */}
        <div className="relative">
          <button
            onClick={() =>
              setDropdownOpen(dropdownOpen === "profile" ? false : "profile")
            }
            className="flex items-center gap-3 px-3 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-indigo-500/20">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-tight">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight">
                {user?.isAdmin ? "Super Admin" : "User"}
              </p>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownOpen === "profile" ? "rotate-180" : ""}`}
            />
          </button>

          {/* Dropdown Menu */}
          {dropdownOpen === "profile" && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email}
                </p>
              </div>
              <Link
                to="/profile"
                onClick={() => (text = setDropdownOpen(false))}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <User className="w-4 h-4" />
                View Profile
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
