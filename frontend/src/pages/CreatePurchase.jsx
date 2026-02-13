import { useState, useEffect } from 'react';
import { vendorAPI, productAPI, purchaseAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, ArrowLeft, ScanLine, X, UserPlus, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceScanner from '../components/InvoiceScanner';

const CreatePurchase = () => {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showScanner, setShowScanner] = useState(false);

    // Vendor Confirmation Modal
    const [showVendorModal, setShowVendorModal] = useState(false);

    const [vendorModalData, setVendorModalData] = useState({ name: '', gstin: '', address: '', state: '', email: '', phone: '' });

    // Product Confirmation Modal
    const [showProductModal, setShowProductModal] = useState(false);
    const [productModalData, setProductModalData] = useState({ name: '', price: 0, taxRate: 0, hsnCode: '', sku: '' });
    const [pendingProducts, setPendingProducts] = useState([]);
    const [currentPendingIndex, setCurrentPendingIndex] = useState(0);

    const [formData, setFormData] = useState({
        vendorId: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        items: [],
        notes: ''
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [vendorRes, productRes] = await Promise.all([
                    vendorAPI.getAll(),
                    productAPI.getAll()
                ]);
                setVendors(vendorRes.data);
                setProducts(productRes.data);
                setLoading(false);
            } catch (error) {
                toast.error('Failed to load data');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: '', quantity: 1, purchasePrice: 0, taxRate: 0, total: 0, _scannedName: '' }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        const qty = Number(newItems[index].quantity) || 0;
        const price = Number(newItems[index].purchasePrice) || 0;
        const tax = Number(newItems[index].taxRate) || 0;

        const baseTotal = qty * price;
        const taxAmount = (baseTotal * tax) / 100;
        newItems[index].total = baseTotal + taxAmount;
        newItems[index].taxAmount = taxAmount;

        setFormData({ ...formData, items: newItems });
    };

    const calculateTotals = () => {
        const totalAmount = formData.items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0);
        const taxAmount = formData.items.reduce((acc, item) => acc + (item.taxAmount || 0), 0);
        return { totalAmount, taxAmount, grandTotal: totalAmount + taxAmount };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.vendorId) return toast.error('Please select a vendor');
        if (formData.items.length === 0) return toast.error('Please add at least one item');
        if (formData.items.some(i => !i.productId || i.quantity <= 0)) return toast.error('All items must have a product selected');

        try {
            const totals = calculateTotals();
            const payload = { ...formData, ...totals };
            // Clean up internal fields
            payload.items = payload.items.map(({ _scannedName, ...rest }) => rest);

            await purchaseAPI.create(payload);
            toast.success('Purchase recorded successfully');
            navigate('/purchases');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create purchase');
        }
    };

    // ─── Scan Complete Handler ─────────────────────────────────────

    const handleScanComplete = (data) => {
        // Fill invoice metadata
        setFormData(prev => ({
            ...prev,
            invoiceNumber: data.invoiceNumber || prev.invoiceNumber,
            invoiceDate: data.invoiceDate || prev.invoiceDate,
        }));

        // ── VENDOR MATCHING ──
        if (data.gstin) {
            const existingVendor = vendors.find(v => v.gstin === data.gstin);
            if (existingVendor) {
                setFormData(prev => ({ ...prev, vendorId: existingVendor._id }));
                toast.success(`Vendor identified: ${existingVendor.name}`);
            } else {
                // Show confirmation modal
                setVendorModalData({
                    name: data.vendorName || '',
                    gstin: data.gstin,
                    address: '',
                    state: '',
                    email: '',
                    phone: ''
                });
                setShowVendorModal(true);
            }
        } else if (data.vendorName) {
            // Try matching by name
            const existingVendor = vendors.find(v => v.name.toLowerCase().includes(data.vendorName.toLowerCase()));
            if (existingVendor) {
                setFormData(prev => ({ ...prev, vendorId: existingVendor._id }));
                toast.success(`Vendor identified: ${existingVendor.name}`);
            } else {
                setVendorModalData({
                    name: data.vendorName,
                    gstin: '',
                    address: '',
                    state: '',
                    email: '',
                    phone: ''
                });
                setShowVendorModal(true);
            }
        }

        // ── PRODUCT MATCHING ──
        if (data.items && data.items.length > 0) {
            const newItems = [];
            const unmatched = [];

            data.items.forEach((scannedItem, idx) => {
                const product = products.find(p =>
                    p.name.toLowerCase().includes(scannedItem.name.toLowerCase()) ||
                    scannedItem.name.toLowerCase().includes(p.name.toLowerCase())
                );

                const qty = scannedItem.quantity || 1;
                const price = scannedItem.price || 0;
                const taxRate = scannedItem.taxRate || 0;
                const baseTotal = qty * price;
                const taxAmount = (baseTotal * taxRate) / 100;

                newItems.push({
                    productId: product ? product._id : '',
                    quantity: qty,
                    purchasePrice: price,
                    taxRate: taxRate,
                    total: baseTotal + taxAmount,
                    taxAmount: taxAmount,
                    _scannedName: scannedItem.name
                });

                if (!product) {
                    unmatched.push({
                        itemIndex: idx,
                        name: scannedItem.name,
                        price: price,
                        taxRate: taxRate,
                        hsnCode: scannedItem.hsnCode || ''
                    });
                }
            });

            setFormData(prev => ({ ...prev, items: newItems }));

            // If there are unmatched products, start the modal flow
            if (unmatched.length > 0) {
                setPendingProducts(unmatched);
                setCurrentPendingIndex(0);
                setProductModalData({
                    name: unmatched[0].name,
                    price: unmatched[0].price,
                    taxRate: unmatched[0].taxRate,
                    hsnCode: unmatched[0].hsnCode
                });
                // Delay to let vendor modal close first if it's open
                setTimeout(() => setShowProductModal(true), showVendorModal ? 500 : 0);
            }
        }

        setShowScanner(false);
    };

    // ─── VENDOR MODAL HANDLERS ─────────────────────────────────────

    const handleCreateVendor = async () => {
        try {
            const res = await vendorAPI.create(vendorModalData);
            const newVendor = res.data;
            setVendors(prev => [...prev, newVendor]);
            setFormData(prev => ({ ...prev, vendorId: newVendor._id }));
            toast.success(`Vendor "${newVendor.name}" created and selected!`);
            setShowVendorModal(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create vendor');
        }
    };

    const handleSkipVendor = () => {
        setShowVendorModal(false);
        toast('Vendor not added. Please select manually.', { icon: 'ℹ️' });
    };

    // ─── PRODUCT MODAL HANDLERS ────────────────────────────────────

    const handleCreateProduct = async () => {
        try {
            const res = await productAPI.create({
                name: productModalData.name,
                price: Number(productModalData.price),
                taxRate: Number(productModalData.taxRate) / 100, // Store as decimal
                hsnCode: productModalData.hsnCode,
                sku: productModalData.sku // Optional, backend will auto-generate if empty
            });
            const newProduct = res.data;
            setProducts(prev => [...prev, newProduct]);

            // Map this product to the form item
            const pending = pendingProducts[currentPendingIndex];
            setFormData(prev => {
                const newItems = [...prev.items];
                newItems[pending.itemIndex] = { ...newItems[pending.itemIndex], productId: newProduct._id };
                return { ...prev, items: newItems };
            });

            toast.success(`Product "${newProduct.name}" created!`);
            moveToNextProduct();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to create product');
        }
    };

    const handleMapToExisting = (productId) => {
        const pending = pendingProducts[currentPendingIndex];
        setFormData(prev => {
            const newItems = [...prev.items];
            newItems[pending.itemIndex] = { ...newItems[pending.itemIndex], productId };
            return { ...prev, items: newItems };
        });
        toast.success('Product mapped!');
        moveToNextProduct();
    };

    const handleSkipProduct = () => {
        toast('Product skipped. Select manually from dropdown.', { icon: 'ℹ️' });
        moveToNextProduct();
    };

    const moveToNextProduct = () => {
        const nextIdx = currentPendingIndex + 1;
        if (nextIdx < pendingProducts.length) {
            setCurrentPendingIndex(nextIdx);
            setProductModalData({
                name: pendingProducts[nextIdx].name,
                price: pendingProducts[nextIdx].price,
                taxRate: pendingProducts[nextIdx].taxRate,
                hsnCode: pendingProducts[nextIdx].hsnCode,
                sku: ''
            });
        } else {
            setShowProductModal(false);
            setPendingProducts([]);
            setCurrentPendingIndex(0);
        }
    };

    const { totalAmount, taxAmount, grandTotal } = calculateTotals();

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/purchases')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Record Purchase</h1>
                </div>
                <button
                    type="button"
                    onClick={() => setShowScanner(!showScanner)}
                    className="flex items-center px-4 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
                >
                    <ScanLine className="w-4 h-4 mr-2" />
                    {showScanner ? 'Hide Scanner' : 'Scan Invoice PDF'}
                </button>
            </div>

            {showScanner && (
                <div className="mb-8">
                    <InvoiceScanner onScanComplete={handleScanComplete} />
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Vendor & Invoice Details */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Vendor Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Vendor</label>
                            <select
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.vendorId}
                                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
                                required
                            >
                                <option value="">-- Select Vendor --</option>
                                {vendors.map(v => (
                                    <option key={v._id} value={v._id}>{v.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Number</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.invoiceNumber}
                                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice Date</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.invoiceDate}
                                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Items Received</h2>
                        <button type="button" onClick={addItem} className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">
                                        Product {item._scannedName && !item.productId && <span className="text-orange-500 ml-1">(Scanned: {item._scannedName})</span>}
                                    </label>
                                    <select
                                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={item.productId}
                                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>{p.name} (Stk: {p.currentStock})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                                    <input type="number" min="1"
                                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Unit Cost (₹)</label>
                                    <input type="number" min="0" step="0.01"
                                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={item.purchasePrice}
                                        onChange={(e) => handleItemChange(index, 'purchasePrice', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Tax (%)</label>
                                    <input type="number" min="0" step="0.01"
                                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={item.taxRate}
                                        onChange={(e) => handleItemChange(index, 'taxRate', e.target.value)}
                                    />
                                </div>
                                <div className="w-32 text-right pb-2">
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">₹{item.total.toFixed(2)}</span>
                                </div>
                                <button type="button" onClick={() => removeItem(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg pb-2">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Summary */}
                <div className="flex justify-end">
                    <div className="w-full md:w-1/3 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 space-y-3">
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Subtotal</span>
                            <span>₹{totalAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Tax</span>
                            <span>₹{taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                            <span>Grand Total</span>
                            <span>₹{grandTotal.toFixed(2)}</span>
                        </div>
                        <button type="submit" className="w-full mt-4 flex justify-center items-center py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-500/30 transition-all">
                            <Save className="w-5 h-5 mr-2" /> Save Purchase
                        </button>
                    </div>
                </div>
            </form>

            {/* ─── VENDOR CONFIRMATION MODAL ─────────────────────────── */}
            {showVendorModal && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <UserPlus className="w-5 h-5 mr-2 text-indigo-500" />
                                New Vendor Detected
                            </h3>
                            <button onClick={handleSkipVendor} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500 dark:text-gray-400">This vendor was not found in your database. Would you like to add it?</p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vendor Name *</label>
                                <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={vendorModalData.name} onChange={(e) => setVendorModalData({ ...vendorModalData, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">GSTIN</label>
                                <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white bg-gray-50"
                                    value={vendorModalData.gstin} onChange={(e) => setVendorModalData({ ...vendorModalData, gstin: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                                    <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={vendorModalData.phone} onChange={(e) => setVendorModalData({ ...vendorModalData, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                    <input type="email" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={vendorModalData.email} onChange={(e) => setVendorModalData({ ...vendorModalData, email: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    value={vendorModalData.address} onChange={(e) => setVendorModalData({ ...vendorModalData, address: e.target.value })} />
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button onClick={handleSkipVendor} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                    Skip
                                </button>
                                <button onClick={handleCreateVendor} disabled={!vendorModalData.name.trim()}
                                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md">
                                    Add Vendor
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── PRODUCT CONFIRMATION MODAL ─────────────────────────── */}
            {showProductModal && pendingProducts.length > 0 && (
                <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                <Package className="w-5 h-5 mr-2 text-orange-500" />
                                Unknown Product ({currentPendingIndex + 1}/{pendingProducts.length})
                            </h3>
                            <button onClick={handleSkipProduct} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-100 dark:border-orange-900/30">
                                <p className="text-sm text-orange-700 dark:text-orange-300">
                                    <strong>Scanned name:</strong> "{pendingProducts[currentPendingIndex]?.name}"
                                </p>
                                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">This product was not found in your database. You can add it as new or map it to an existing product.</p>
                            </div>

                            {/* Map to existing */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Map to Existing Product</label>
                                <select className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    onChange={(e) => { if (e.target.value) handleMapToExisting(e.target.value); }}
                                    defaultValue=""
                                >
                                    <option value="">-- Select existing product --</option>
                                    {products.map(p => (
                                        <option key={p._id} value={p._id}>{p.name} (₹{p.price})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-3">
                                <hr className="flex-1 border-gray-200 dark:border-gray-700" />
                                <span className="text-xs text-gray-400">OR ADD NEW</span>
                                <hr className="flex-1 border-gray-200 dark:border-gray-700" />
                            </div>

                            {/* Create new */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                                    <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={productModalData.name} onChange={(e) => setProductModalData({ ...productModalData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU (Optional)</label>
                                    <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        placeholder="Auto-generated if empty"
                                        value={productModalData.sku || ''} onChange={(e) => setProductModalData({ ...productModalData, sku: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price (₹)</label>
                                    <input type="number" min="0" step="0.01" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={productModalData.price} onChange={(e) => setProductModalData({ ...productModalData, price: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tax Rate (%)</label>
                                    <input type="number" min="0" step="0.01" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={productModalData.taxRate} onChange={(e) => setProductModalData({ ...productModalData, taxRate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">HSN Code</label>
                                    <input type="text" className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={productModalData.hsnCode} onChange={(e) => setProductModalData({ ...productModalData, hsnCode: e.target.value })} />
                                </div>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <button onClick={handleSkipProduct} className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700">
                                    Skip
                                </button>
                                <button onClick={handleCreateProduct} disabled={!productModalData.name.trim()}
                                    className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md">
                                    Add Product
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CreatePurchase;
