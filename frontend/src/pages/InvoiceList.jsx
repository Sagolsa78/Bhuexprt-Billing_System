import React, { useState, useEffect } from "react";
import { invoiceAPI, paymentAPI } from "../api";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Printer, DollarSign, X } from "lucide-react";
import toast from "react-hot-toast";
import { Eye } from "lucide-react";

const InvoiceList = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    paymentMode: "CASH",
    reference: "",
    notes: "",
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await invoiceAPI.getAll();
      setInvoices(res.data);
      setLoading(false);

      console.log(res.data);
    } catch (err) {
      console.error("Error fetching invoices:", err);
      setLoading(false);
    }
  };

  const openPaymentModal = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentForm({
      amount: invoice.balanceDue || invoice.total,
      paymentMode: "CASH",
      reference: "",
      notes: "",
    });
    setShowPaymentModal(true);
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    if (!selectedInvoice?._id) {
      toast.error("Invalid invoice selected");
      return;
    }

    const amount = parseFloat(paymentForm.amount);

    if (!amount || isNaN(amount) || amount <= 0) {
      toast.error("Please enter a valid payment amount");
      return;
    }

    const maxAmount = selectedInvoice.balanceDue ?? selectedInvoice.total;

    if (amount > maxAmount) {
      toast.error("Payment amount cannot exceed balance due");
      return;
    }

    try {
      console.log("Sending payment:", {
        invoiceId: selectedInvoice._id,
        amount,
        paymentMode: paymentForm.paymentMode,
      });

      await paymentAPI.create({
        invoiceId: selectedInvoice._id,
        amount: Number(amount),
        paymentMode: paymentForm.paymentMode,
        reference: paymentForm.reference || "",
        notes: paymentForm.notes || "",
        date: new Date(),
      });

      setShowPaymentModal(false);
      fetchInvoices();
      toast.success("Payment recorded successfully!");
    } catch (error) {
      console.error("Payment Error Full:", error.response?.data || error);
      toast.error(error.response?.data?.message || "Failed to record payment");
    }
  };

  const numberToWords = (amount) => `${Math.floor(amount)} Rupees Only`;

  const generatePDF = (invoice, action = "download") => {
    const doc = new jsPDF();
    doc.setFontSize(10);
    doc.setFont(undefined, "bold");
    doc.text("TAX INVOICE", 14, 15);
    doc.setDrawColor(200);
    doc.rect(40, 11, 45, 6);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("ORIGINAL FOR RECIPIENT", 42, 15);
    doc.setTextColor(0);
    doc.setFontSize(10);
    doc.text("One place for any type of plantation tree", 130, 15);
    doc.setFontSize(18);
    doc.setTextColor(147, 51, 234);
    doc.text("GrowUp myTree", 60, 25);
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text("Trees", 14, 30);
    doc.setFontSize(9);
    doc.setFont(undefined, "normal");
    doc.setTextColor(50);
    doc.text(
      "Gopal Nagar, 743262, West Bengal, North 24 Parganas, West Bengal, 743262",
      60,
      31,
    );
    doc.text(
      "Mobile: 7465456366    GSTIN: 12GTTHF8763G4SW    PAN Number: YDFDF7435R",
      60,
      36,
    );
    doc.text("Email: growupmytree@gmail.com", 60, 41);
    doc.setFillColor(240, 240, 240);
    doc.rect(14, 46, 182, 10, "F");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text(`Invoice No.:   ${invoice._id.slice(-4)}`, 18, 52);
    doc.text(
      `Invoice Date:   ${new Date(invoice.createdAt).toLocaleDateString()}`,
      85,
      52,
    );
    doc.text("Due Date:", 150, 52);
    doc.setFont(undefined, "normal");
    doc.text(`${new Date(invoice.createdAt).toLocaleDateString()}`, 168, 52);
    let yPos = 65;
    doc.setFont(undefined, "bold");
    doc.text("BILL TO", 14, yPos);
    doc.text("SHIP TO", 105, yPos);
    yPos += 5;
    const clientName =
      invoice.customerName || invoice.customerId?.name || "Unknown";
    doc.text(clientName, 14, yPos);
    doc.text(clientName, 105, yPos);
    yPos += 5;
    const clientAddress =
      invoice.customerAddress || "Kolkata, West Bengal, Kolkata, 700005";
    const clientMobile = invoice.customerMobile || "9999999937";
    doc.setFont(undefined, "normal");
    doc.setFontSize(8);
    doc.text(clientAddress, 14, yPos);
    doc.text(clientAddress, 105, yPos);
    yPos += 4;
    doc.text(`Mobile: ${clientMobile}`, 14, yPos);
    yPos += 4;
    doc.text("State: West Bengal", 14, yPos);
    const tableColumn = ["ITEMS", "HSN", "QTY.", "RATE", "TAX", "AMOUNT"];
    const tableRows = [];
    invoice.items.forEach((item) => {
      tableRows.push([
        item.productId?.name || "Item",
        "85171300",
        `${item.quantity} PCS`,
        item.price.toLocaleString(undefined, { minimumFractionDigits: 2 }),
        (item.price * item.quantity * item.taxRate).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        }) + `\n(${item.taxRate * 100}%)`,
        (item.price * item.quantity * (1 + item.taxRate)).toLocaleString(
          undefined,
          { minimumFractionDigits: 0 },
        ),
      ]);
    });
    autoTable(doc, {
      startY: yPos + 10,
      head: [tableColumn],
      body: tableRows,
      theme: "plain",
      styles: { fontSize: 8, cellPadding: 3, valign: "middle" },
      headStyles: {
        fillColor: [245, 245, 245],
        textColor: 0,
        fontStyle: "bold",
        lineColor: [200, 200, 200],
        lineWidth: { bottom: 0.1, top: 0.1 },
      },
      columnStyles: {
        0: { cellWidth: 70 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 20, halign: "center" },
        3: { cellWidth: 25, halign: "right" },
        4: { cellWidth: 25, halign: "right" },
        5: { cellWidth: 20, halign: "right", fontStyle: "bold" },
      },
      didDrawPage: (data) => {
        yPos = data.cursor.y;
      },
    });
    yPos = doc.lastAutoTable.finalY + 5;
    doc.setDrawColor(147, 51, 234);
    doc.setLineWidth(0.5);
    doc.line(14, yPos, 196, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("SUBTOTAL", 14, yPos);
    doc.text(invoice.items.length.toString(), 105, yPos, { align: "center" });
    doc.text(
      "Rs. " +
        (invoice.subtotal + invoice.tax).toLocaleString(undefined, {
          minimumFractionDigits: 2,
        }),
      196,
      yPos,
      { align: "right" },
    );
    yPos += 3;
    doc.line(14, yPos, 196, yPos);
    yPos += 10;
    doc.text("BANK DETAILS", 14, yPos);
    yPos += 6;
    doc.setFontSize(8);
    doc.setFont(undefined, "normal");
    doc.text("Name:", 14, yPos);
    doc.text("Growupmytree", 40, yPos);
    doc.text("TAXABLE AMOUNT", 130, yPos);
    doc.text(
      "Rs. " +
        invoice.subtotal.toLocaleString(undefined, {
          minimumFractionDigits: 2,
        }),
      196,
      yPos,
      { align: "right" },
    );
    yPos += 5;
    doc.text("IFSC Code:", 14, yPos);
    doc.text("HDFC0008359", 40, yPos);
    doc.text("IGST @18%", 130, yPos);
    doc.text(
      "Rs. " +
        invoice.tax.toLocaleString(undefined, { minimumFractionDigits: 2 }),
      196,
      yPos,
      { align: "right" },
    );
    yPos += 5;
    doc.text("Account No:", 14, yPos);
    doc.text("65354554553663663", 40, yPos);
    doc.setFont(undefined, "bold");
    doc.text("TOTAL AMOUNT", 130, yPos);
    doc.text("Rs. " + Math.round(invoice.total).toLocaleString(), 196, yPos, {
      align: "right",
    });
    doc.setFont(undefined, "normal");
    yPos += 5;
    doc.text("Bank:", 14, yPos);
    doc.text("HDFC Bank, BONGAON", 40, yPos);
    doc.text("Received Amount", 130, yPos);
    doc.text("Rs. " + (invoice.amountPaid || 0).toFixed(2), 196, yPos, {
      align: "right",
    });
    yPos += 12;
    doc.setFontSize(8);
    doc.setFont(undefined, "bold");
    doc.text("PAYMENT QR CODE", 14, yPos);
    yPos += 5;
    doc.setFont(undefined, "normal");
    doc.text("UPI ID:", 14, yPos);
    yPos += 5;
    doc.text("7465456366@ybl", 14, yPos);
    doc.setDrawColor(147, 51, 234);
    doc.rect(45, yPos - 8, 20, 20);
    doc.setFontSize(9);
    doc.setFont(undefined, "bold");
    doc.text("Total Amount (in words)", 196, yPos + 12, { align: "right" });
    doc.setFont(undefined, "normal");
    doc.text(numberToWords(invoice.total) + " Only", 196, yPos + 17, {
      align: "right",
    });
    doc.setFontSize(7);
    doc.setFont(undefined, "bold");
    doc.text("TERMS AND CONDITIONS", 14, 260);
    doc.setFont(undefined, "normal");
    doc.text("1. Goods once sold will not be taken back or exchanged", 14, 265);
    doc.text(
      "2. All disputes are subject to North 24 Parganas jurisdiction only",
      14,
      270,
    );
    if (action === "view") {
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
    } else {
      doc.save(`invoice_${invoice._id}.pdf`);
      toast.success("Invoice PDF downloaded!");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );

  return (
    <div className="container mx-auto">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Invoices
          </h2>
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-400">
            A list of all the invoices including their client, date, amount, and
            payment status.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              {[
                "Customer",
                "Invoice ID",
                "Date",
                "Amount",
                "Paid / Due",
                "Status",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {[...invoices]
              .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
              .map((invoice) => {
                const clientName =
                  invoice.customerName || invoice.customerId?.name || "Unknown";
                const clientEmail =
                  invoice.customerEmail || invoice.customerId?.email || "";

                return (
                  <tr
                    key={invoice._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-bold">
                          {clientName.charAt(0)}
                        </span>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                            {clientName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {clientEmail}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      #{invoice._id.slice(-6).toUpperCase()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {new Date(invoice.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-200">
                      ₹{invoice.total.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-green-600 dark:text-green-400">
                        Paid: ₹{(invoice.amountPaid || 0).toFixed(2)}
                      </div>
                      <div className="text-red-500 dark:text-red-400 font-medium">
                        Due: ₹
                        {(invoice.balanceDue !== undefined
                          ? invoice.balanceDue
                          : invoice.total
                        ).toFixed(2)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${invoice.status === "PAID" ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400" : invoice.status === "PARTIAL" ? "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400" : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400"}`}
                      >
                        {invoice.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-3">
                        {/* View PDF */}
                        <button
                          onClick={() => generatePDF(invoice, "view")}
                          className="text-indigo-500 hover:text-indigo-700 transition-colors"
                          title="View PDF"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        {/* Download PDF */}
                        <button
                          onClick={() => generatePDF(invoice, "download")}
                          className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          title="Download PDF"
                        >
                          <Printer className="w-5 h-5" />
                        </button>

                        {invoice.status !== "PAID" && (
                          <button
                            onClick={() => openPaymentModal(invoice)}
                            className="text-white flex items-center px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors text-xs"
                            title="Record Payment"
                          >
                            Pay <DollarSign className="w-3 h-3 ml-1" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                Record Payment
              </h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Invoice #{selectedInvoice._id.slice(-6).toUpperCase()}
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                  Total Due: ₹
                  {selectedInvoice.balanceDue?.toFixed(2) ||
                    selectedInvoice.total.toFixed(2)}
                </p>
              </div>
              <form onSubmit={handlePaymentSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    max={selectedInvoice.balanceDue || selectedInvoice.total}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                    value={paymentForm.amount}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Payment Mode *
                  </label>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                    value={paymentForm.paymentMode}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        paymentMode: e.target.value,
                      })
                    }
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="BANK">Bank Transfer</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Reference ID
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g. UPI Transaction ID"
                    value={paymentForm.reference}
                    onChange={(e) =>
                      setPaymentForm({
                        ...paymentForm,
                        reference: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500"
                    rows="2"
                    value={paymentForm.notes}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, notes: e.target.value })
                    }
                  ></textarea>
                </div>
                <div className="flex justify-end gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPaymentModal(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-md"
                  >
                    Confirm Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceList;
