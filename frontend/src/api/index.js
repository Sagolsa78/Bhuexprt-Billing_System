import api from './axios';

// Auth API
export const authAPI = {
    login: (email, password) => api.post('/users/login', { email, password }),
    register: (name, email, password) => api.post('/users', { name, email, password }),
    getProfile: () => api.get('/users/profile'),
};

// Invoice API
export const invoiceAPI = {
    getAll: () => api.get('/invoices'),
    getById: (id) => api.get(`/invoices/${id}`),
    create: (data) => api.post('/invoices', data),
    update: (id, data) => api.put(`/invoices/${id}`, data),
    delete: (id) => api.delete(`/invoices/${id}`),
    markAsPaid: (id) => api.put(`/invoices/${id}/pay`),
};

// Product API
export const productAPI = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    create: (data) => api.post('/products', data),
    update: (id, data) => api.put(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`),
    bulkCreate: (data) => api.post('/products/bulk', data),
};

// Customer API
export const customerAPI = {
    getAll: () => api.get('/customers'),
    getById: (id) => api.get(`/customers/${id}`),
    create: (data) => api.post('/customers', data),
    update: (id, data) => api.put(`/customers/${id}`, data),
    delete: (id) => api.delete(`/customers/${id}`),
    getLedger: (id) => api.get(`/customers/${id}/ledger`),
};

// Payment API
export const paymentAPI = {
    getAll: () => api.get('/payments'),
    getById: (id) => api.get(`/payments/${id}`),
    create: (data) => api.post('/payments', data),
    getByInvoiceId: (invoiceId) => api.get(`/payments/invoice/${invoiceId}`),
};

// Expense API
export const expenseAPI = {
    getAll: () => api.get('/expenses'),
    create: (data) => api.post('/expenses', data, {
        headers: data instanceof FormData ? { 'Content-Type': 'multipart/form-data' } : {}
    }),
    delete: (id) => api.delete(`/expenses/${id}`),
    getStats: () => api.get('/expenses/stats'),
};

// Report API
export const reportAPI = {
    sendReminder: (data) => api.post(`/reports/send-reminder/${data._id || data.id}`, data),
    getDashboardStats: () => api.get('/reports/dashboard'),
    getSalesReport: (startDate, endDate) => {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return api.get('/reports/sales', { params });
    },
    getPnLReport: () => api.get('/reports/pnl'),
    getGSTReport: (startDate, endDate) => {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return api.get('/reports/gst', { params });
    },
    getProductSalesReport: () => api.get('/reports/product-sales'),
    getLowStockReport: () => api.get('/reports/low-stock'),
    getCustomerOutstandingReport: () => api.get('/reports/customer-outstanding'),
};

// Quotation API
export const quotationAPI = {
    getAll: () => api.get('/quotations'),
    getById: (id) => api.get(`/quotations/${id}`),
    create: (data) => api.post('/quotations', data),
    convert: (id) => api.post(`/quotations/${id}/convert`),
};

// Purchase API
export const purchaseAPI = {
    getAll: () => api.get('/purchases'),
    create: (data) => api.post('/purchases', data),
};

// Vendor API
export const vendorAPI = {
    getAll: () => api.get('/vendors'),
    getById: (id) => api.get(`/vendors/${id}`),
    create: (data) => api.post('/vendors', data),
};

// OCR API
export const ocrAPI = {
    scanInvoice: (formData) => api.post('/ocr/scan', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
};

export default api;
