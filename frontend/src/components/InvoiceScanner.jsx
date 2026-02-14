import React, { useState } from 'react';
import { Upload, FileText, Loader, CheckCircle, Eye, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { ocrAPI } from '../api';

const InvoiceScanner = ({ onScanComplete }) => {
    const [scanning, setScanning] = useState(false);
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setFile(e.target.files[0]);
            setPreview(null);
        }
    };

    const handleScan = async () => {
        if (!file) return toast.error("Please select a PDF file first");

        setScanning(true);
        try {
            const formData = new FormData();
            formData.append('invoice', file);

            const res = await ocrAPI.scanInvoice(formData);
            const data = res.data;
            console.log(data);

            setPreview(data);
            toast.success("PDF scanned successfully!");
        } catch (error) {
            console.error("Scan error:", error);
            toast.error(error.response?.data?.message || "Failed to scan PDF");
        } finally {
            setScanning(false);
        }
    };

    const handleApply = () => {
        if (preview && onScanComplete) {
            onScanComplete(preview);
            setPreview(null);
            setFile(null);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-dashed border-indigo-300 dark:border-indigo-700">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-indigo-500" />
                AI Invoice Scanner
            </h3>

            <div className="flex flex-col items-center justify-center space-y-4">
                <div className="relative w-full">
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <div className="flex flex-col items-center justify-center p-6 border-2 border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30 rounded-lg hover:bg-gray-100 transition-colors">
                        {file ? (
                            <div className="flex items-center text-indigo-600 font-medium">
                                <CheckCircle className="w-5 h-5 mr-2" />
                                {file.name}
                            </div>
                        ) : (
                            <>
                                <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                <span className="text-sm text-gray-500">Click to upload Purchase Invoice PDF</span>
                            </>
                        )}
                    </div>
                </div>

                <button
                    onClick={handleScan}
                    disabled={!file || scanning}
                    className={`w-full py-2 rounded-lg font-medium flex items-center justify-center transition-all ${!file || scanning
                        ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                        }`}
                >
                    {scanning ? (
                        <>
                            <Loader className="w-5 h-5 mr-2 animate-spin" />
                            Scanning PDF...
                        </>
                    ) : (
                        "Scan & Extract Data"
                    )}
                </button>
            </div>

            {/* Extracted Data Preview */}
            {preview && (
                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
                    <h4 className="text-md font-semibold text-gray-800 dark:text-white mb-3 flex items-center">
                        <Eye className="w-4 h-4 mr-2 text-green-500" />
                        Extracted Data Preview
                    </h4>

                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Invoice #</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{preview.invoiceNumber || '—'}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Date</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{preview.invoiceDate || '—'}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">Vendor</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{preview.vendorName || '—'}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/30 p-3 rounded-lg">
                            <span className="text-xs text-gray-500 dark:text-gray-400 block">GSTIN</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{preview.gstin || '—'}</span>
                        </div>
                    </div>

                    {preview.items && preview.items.length > 0 && (
                        <div className="mb-4">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block mb-2">Line Items ({preview.items.length})</span>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-xs">
                                    <thead>
                                        <tr className="bg-gray-100 dark:bg-gray-700">
                                            <th className="px-3 py-2 text-left text-gray-600 dark:text-gray-300">Item</th>
                                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Qty</th>
                                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Price</th>
                                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Tax %</th>
                                            <th className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.items.map((item, i) => (
                                            <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                                                <td className="px-3 py-2 text-gray-800 dark:text-gray-200">{item.name}</td>
                                                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">₹{item.price?.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-300">{item.taxRate}%</td>
                                                <td className="px-3 py-2 text-right font-medium text-gray-800 dark:text-gray-200">
                                                    ₹{item.total?.toFixed(2)}
                                                    {Math.abs((item.quantity * item.price) - item.total) > 1 && (
                                                        <span className="ml-2 text-red-500 text-xs" title="Mismatch detected! Calculated: ₹{(item.quantity * item.price).toFixed(2)}">
                                                            ⚠️
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-2 mb-4 text-sm">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded text-center">
                            <span className="text-xs text-blue-600 dark:text-blue-400 block">Subtotal</span>
                            <span className="font-bold text-blue-800 dark:text-blue-300">₹{preview.financials?.subtotal?.toFixed(2) || '0.00'}</span>
                        </div>
                        {/* Tax Breakdown */}
                        <div className="bg-orange-50 dark:bg-orange-900/20 p-2 rounded text-center">
                            <span className="text-xs text-orange-600 dark:text-orange-400 block">
                                Tax
                                {(preview.financials?.cgst > 0 || preview.financials?.sgst > 0) &&
                                    <span className="text-[10px] block opacity-75">
                                        (C: {preview.financials?.cgst} + S: {preview.financials?.sgst})
                                    </span>
                                }
                            </span>
                            <span className="font-bold text-orange-800 dark:text-orange-300">₹{preview.financials?.tax?.toFixed(2) || '0.00'}</span>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded text-center">
                            <span className="text-xs text-green-600 dark:text-green-400 block">Total</span>
                            <span className="font-bold text-green-800 dark:text-green-300">₹{preview.financials?.total?.toFixed(2) || '0.00'}</span>
                        </div>
                    </div>

                    <button
                        onClick={handleApply}
                        className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center justify-center transition-all shadow-md"
                    >
                        Apply Extracted Data
                        <ArrowRight className="w-4 h-4 ml-2" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default InvoiceScanner;
