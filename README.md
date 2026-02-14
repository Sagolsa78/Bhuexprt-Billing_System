# Bhuexprt Billing System - System Documentation

**Version:** 1.0.0
**Date:** 2026-02-14

## 1. Executive Summary

The **Bhuexprt Billing System** is a comprehensive, full-stack web application designed to streamline business operations including invoicing, inventory management, expense tracking, and vendor management. Built on the MERN stack (MongoDB, Express.js, React, Node.js), it features advanced capabilities such as OCR (Optical Character Recognition) for automated invoice entry and real-time GST verification via Sandbox API integration.

This document serves as the master technical reference for production teams, covering architecture, API specifications, and deployment guides.

---

## 2. Technology Stack

### Backend
-   **Runtime:** Node.js
-   **Framework:** Express.js
-   **Database:** MongoDB (via Mongoose ODM)
-   **Authentication:** JWT (JSON Web Tokens)
-   **PDF Generation:** `pdf-parse`, `html-pdf` (or similar library usage inferred)
-   **OCR Engine:** Tesseract.js (for images), Python/PaddleOCR (integrated service)
-   **CORS:** Enabled for cross-origin requests
-   **File Uploads:** Multer

### Frontend
-   **Framework:** React (Vite)
-   **Styling:** Tailwind CSS (Responsive Design)
-   **HTTP Client:** Axios
-   **State Management:** React Hooks / Context
-   **Routing:** React Router DOM

### External Services
-   **DST/GST API:** Sandbox API (for GSTIN verification)

---

## 3. System Architecture

The application follows a standard Client-Server architecture:

1.  **Client (Frontend):** A React SPA (Single Page Application) that consumes RESTful APIs. It handles user interactions, form inputs (Invoices, Purchases), and displays dashboards/reports.
2.  **Server (Backend):** An Express.js REST API that handles business logic, authentication, and database interactions.
3.  **Database:** MongoDB stores all persistent data (Users, Invoices, Products, etc.).
4.  **OCR Service:** A specialized module for processing uploaded invoice files (PDF/Images) and extracting structured data.

---

## 4. Key Features & Modules

### 4.1. Authentication & User Management
-   **Routes:** `/api/users`
-   **Features:** User Registration, Login, Profile Management.
-   **Security:** Passwords hashed using `bcryptjs`. Endpoints protected via `authMiddleware`.

### 4.2. Invoice Management
-   **Routes:** `/api/invoices`
-   **Features:** Create, Read, Update, Delete (CRUD) invoices.
-   **Logic:** auto-calculates totals, taxes (CGST/SGST/IGST), and updates inventory stock upon invoice creation.
-   **PDF:** Generates downloadable PDF invoices.

### 4.3. Inventory & Product Management
-   **Routes:** `/api/products` & `/api/inventory`
-   **Features:** detailed product tracking, stock levels, low-stock alerts.
-   **Batch Operations:** Bulk product creation supported.

### 4.4. OCR Invoice Scanning
-   **Routes:** `/api/ocr`
-   **Features:** Upload PDF or Image invoices.
-   **Logic:** Extracts Vendor Name, Invoice Date, Line Items, and Totals automatically to populate the Purchase/Invoice forms.
-   **Tech:** Tesseract.js for images, PDF parsing for text-based PDFs.

### 4.5. Vendor Management & GST Verification
-   **Routes:** `/api/vendors`
-   **Features:** Vendor CRUD, Ledger methods.
-   **Integration:** **Sandbox API** integration to verify Vendor GSTINs in real-time.
    -   Endpoint: `/api/vendors/verify-gst`
    -   Verifies Legal Name, Trade Name, Address, and Active Status.

### 4.6. Financial Reports
-   **Routes:** `/api/reports`
-   **Features:**
    -   Sales Report (Date Range)
    -   GST Report (Input/Output Tax)
    -   Profit & Loss (PnL) Statement
    -   Low Stock Report
    -   Customer Outstanding Report

---

## 5. Database Schema (Models)

| Model | Description | Key Fields |
| :--- | :--- | :--- |
| **User** | System administrators | [name](file:///mnt/Drive_01/bhuexpert_test/Real_App/Bhuexprt-Billing_System/backend/controllers/ocrController.js#16-19), `email`, `password`, `isAdmin` |
| **Customer** | Billable entities | [name](file:///mnt/Drive_01/bhuexpert_test/Real_App/Bhuexprt-Billing_System/backend/controllers/ocrController.js#16-19), `email`, `phone`, `address`, `gstin` |
| **Vendor** | Suppliers | [name](file:///mnt/Drive_01/bhuexpert_test/Real_App/Bhuexprt-Billing_System/backend/controllers/ocrController.js#16-19), `gstin`, `pan`, `balance` |
| **Product** | Inventory items | [name](file:///mnt/Drive_01/bhuexpert_test/Real_App/Bhuexprt-Billing_System/backend/controllers/ocrController.js#16-19), `sku`, `price`, `stock`, `hsn` |
| **Invoice** | Sales records | `customer`, `items` (Array), `total`, `tax`, `status` |
| **Purchase** | Stock intake records | `vendor`, `items`, `total`, `invoiceDate` |
| **Expense** | Operational costs | `category`, `amount`, [date](file:///mnt/Drive_01/bhuexpert_test/Real_App/Bhuexprt-Billing_System/frontend/src/api/index.js#26-27), `description` |
| **Payment** | Validated transactions | `invoiceId`, `amount`, `method`, [date](file:///mnt/Drive_01/bhuexpert_test/Real_App/Bhuexprt-Billing_System/frontend/src/api/index.js#26-27) |
| **Quotation** | Estimates | `customer`, `items`, `validUntil` |

---

## 6. API References (Key Endpoints)

### **Auth**
-   `POST /api/users/login` - Authenticate user & get JWT.
-   `POST /api/users` - Register new user.

### **Invoices**
-   `GET /api/invoices` - List all invoices.
-   `POST /api/invoices` - Create new invoice.
-   `GET /api/invoices/:id` - Get invoice details.

### **OCR**
-   `POST /api/ocr/scan` - Upload file (`multipart/form-data`) -> Returns JSON data.

### **Vendors**
-   `POST /api/vendors/verify-gst` - Payload: `{ gstin: "..." }`. Returns verification data.

---

## 7. Setup & Deployment

### Prerequisites
-   Node.js v16+
-   MongoDB Instance (Local or Atlas)
-   Sandbox API Credentials

### Environment Variables (.env)
Create a `.env` file in the `backend/` directory:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/bhuexpert
JWT_SECRET=your_jwt_secret
SANDBOX_API_KEY=your_sandbox_key
SANDBOX_API_SECRET=your_sandbox_secret
```

### Installation

1.  **Backend:**
    ```bash
    cd backend
    npm install
    npm start
    ```

2.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm run dev
    ```

### Production Build
1.  Build frontend: `cd frontend && npm run build`
2.  Serve static files via Express or Nginx pointing to `frontend/dist`.

---

## 8. Workflow Use Cases

### Scenario A: Creating a Sales Invoice
1.  User logs in.
2.  Navigates to "Create Invoice".
3.  Selects "Customer" (or creates new).
4.  Adds "Products" from inventory.
5.  System calculates Subtotal + GST.
6.  User clicks "Save". Inventory is deducted. Invoice PDF is generated.

### Scenario B: Recording a Purchase (OCR)
1.  User navigates to "Purchases".
2.  Uploads a Vendor Invoice PDF.
3.  **OCR System** parses the file, auto-filling Vendor Name and Line Items.
4.  User verifies the data.
5.  User clicks "Save". Inventory stock is increased.

### Scenario C: Verifying a New Vendor
1.  User navigates to "Vendors" -> "Add Vendor".
2.  Enters GSTIN.
3.  System calls `/verify-gst`.
4.  Legal Name and Address are auto-populated from GST portal data.
5.  User saves the verified vendor.
