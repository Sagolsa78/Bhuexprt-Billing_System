import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './Layout';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import InvoiceList from './pages/InvoiceList';
import CreateInvoice from './pages/CreateInvoice';
import ProductList from './pages/ProductList';
import CustomerList from './pages/CustomerList';
import CustomerDetails from './pages/CustomerDetails';
import PaymentsList from './pages/PaymentsList';
import ExpenseList from './pages/ExpenseList';
import Reports from './pages/Reports';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import VendorList from './pages/VendorList';
import PurchaseList from './pages/PurchaseList';
import CreatePurchase from './pages/CreatePurchase';
import QuotationList from './pages/QuotationList';
import CreateQuotation from './pages/CreateQuotation';
import DebtorList from './pages/DebtorList';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '12px',
                padding: '14px 20px',
                fontSize: '14px',
                fontWeight: '500',
              },
              success: {
                style: {
                  background: '#065f46',
                  color: '#d1fae5',
                  border: '1px solid #10b981',
                },
                iconTheme: { primary: '#10b981', secondary: '#d1fae5' },
              },
              error: {
                style: {
                  background: '#7f1d1d',
                  color: '#fecaca',
                  border: '1px solid #ef4444',
                },
                iconTheme: { primary: '#ef4444', secondary: '#fecaca' },
              },
            }}
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Protected Routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<Layout><Dashboard /></Layout>} />
              <Route path="/invoices" element={<Layout><InvoiceList /></Layout>} />
              <Route path="/create-invoice" element={<Layout><CreateInvoice /></Layout>} />
              <Route path="/products" element={<Layout><ProductList /></Layout>} />
              <Route path="/customers" element={<Layout><CustomerList /></Layout>} />
              <Route path="/customers/:id" element={<Layout><CustomerDetails /></Layout>} />
              <Route path="/vendors" element={<Layout><VendorList /></Layout>} />
              <Route path="/purchases" element={<Layout><PurchaseList /></Layout>} />
              <Route path="/purchase/create-purchase" element={<Layout><CreatePurchase /></Layout>} />
              <Route path="/quotations" element={<Layout><QuotationList /></Layout>} />
              <Route path="/create-quotation" element={<Layout><CreateQuotation /></Layout>} />
              <Route path="/payments" element={<Layout><PaymentsList /></Layout>} />
              <Route path="/expenses" element={<Layout><ExpenseList /></Layout>} />
              <Route path="/reports" element={<Layout><Reports /></Layout>} />
              <Route path="/debtors" element={<Layout><DebtorList /></Layout>} />
              <Route path="/profile" element={<Layout><Profile /></Layout>} />
            </Route>
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
