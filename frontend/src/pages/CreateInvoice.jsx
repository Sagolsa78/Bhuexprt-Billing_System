import React, { useState, useEffect } from 'react';
import { invoiceAPI, productAPI, customerAPI } from '../api';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, User, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';
import InvoiceDropzone from '../components/InvoiceDropzone';

const CreateInvoice = () => {
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [customerAddress, setCustomerAddress] = useState('');
    const [customerMobile, setCustomerMobile] = useState('');
    const [countryCode, setCountryCode] = useState('+91');
    const [items, setItems] = useState([]);
    const [subtotal, setSubtotal] = useState(0);
    const [tax, setTax] = useState(0);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [errors, setErrors] = useState({});
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, custRes] = await Promise.all([
                    productAPI.getAll(),
                    customerAPI.getAll()
                ]);
                setProducts(prodRes.data);
                setCustomers(custRes.data);
            } catch (err) {
                console.error("Error fetching data:", err);
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    const handleOCRSuccess = (data) => {
        console.log("OCR Data:", data);

        // 1. Populate Customer Details
        if (data.vendorName) setCustomerName(data.billingAddress || data.vendorName); // Fallback logic
        // invoiceNumber and Date could be stored if we had fields for them

        // 2. Populate Items
        if (data.items && data.items.length > 0) {
            const newItems = data.items.map(item => {
                // Try to find matching product by name
                const matchedProduct = products.find(p =>
                    p.name.toLowerCase() === item.name.toLowerCase() ||
                    item.name.toLowerCase().includes(p.name.toLowerCase())
                );

                return {
                    productId: matchedProduct ? matchedProduct._id : '',
                    quantity: item.quantity || 1,
                    price: item.price || 0,
                    taxRate: matchedProduct ? matchedProduct.taxRate : 0
                };
            });
            setItems(newItems);
            toast.success(`Auto-filled ${newItems.length} items from invoice!`);
        }
    };

    const handleCustomerSelect = (customerId) => {
        setSelectedCustomerId(customerId);

        if (!customerId) {
            // Walk-in customer
            setCustomerName('');
            setCustomerEmail('');
            setCustomerAddress('');
            setCustomerMobile('');
            return;
        }

        const customer = customers.find(c => c._id === customerId);
        if (customer) {
            setCustomerName(customer.name || '');
            setCustomerEmail(customer.email || '');
            setCustomerAddress(customer.address || '');
            const phone = customer.phone || '';
            const stripped = phone.replace(/^\+\d{1,3}/, '');
            setCustomerMobile(stripped.slice(0, 10));
        }
    };

    useEffect(() => {
        const newSubtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const newTax = items.reduce((acc, item) => acc + (item.price * item.quantity * item.taxRate), 0);
        setSubtotal(newSubtotal);
        setTax(newTax);
        setTotal(newSubtotal + newTax);
    }, [items]);

    const handleAddItem = () => {
        setItems([...items, { productId: '', quantity: 1, price: 0, taxRate: 0 }]);
    };

    const handleRemoveItem = (index) => {
        const updated = [...items];
        updated.splice(index, 1);
        setItems(updated);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;

        if (field === 'productId') {
            const product = products.find(p => p._id === value);
            if (product) {
                newItems[index].price = product.price;
                newItems[index].taxRate = product.taxRate;
            }
        }

        setItems(newItems);
    };

    const validateForm = () => {
        let newErrors = {};
        const isWalkInCustomer = !selectedCustomerId;

        if (!isWalkInCustomer) {
            if (!customerName.trim()) {
                newErrors.customerName = "Customer name is required";
            }

            if (customerMobile.length !== 10) {
                newErrors.customerMobile = "Mobile number must be exactly 10 digits";
            }

            if (!customerAddress.trim()) {
                newErrors.customerAddress = "Billing address is required";
            }
        }

        if (items.length === 0) {
            newErrors.items = "At least one item is required";
        }

        items.forEach((item, index) => {
            if (!item.productId) {
                newErrors[`product_${index}`] = "Select a product";
            }
            if (!item.quantity || item.quantity < 1) {
                newErrors[`quantity_${index}`] = "Quantity must be at least 1";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        const isWalkInCustomer = !selectedCustomerId;

        const fullMobile = customerMobile
            ? `${countryCode}${customerMobile}`
            : undefined;

        try {
            await invoiceAPI.create({
                customerId: selectedCustomerId || undefined,
                customerName: isWalkInCustomer ? "Walk-in Customer" : customerName,
                customerEmail: isWalkInCustomer ? undefined : customerEmail,
                customerAddress: isWalkInCustomer ? undefined : customerAddress,
                customerMobile: isWalkInCustomer ? undefined : fullMobile,
                items,
                subtotal,
                tax,
                total
            });

            toast.success("Invoice created successfully!");
            navigate('/invoices');
        } catch (err) {
            console.error("Error creating invoice:", err);
            toast.error("Failed to create invoice");
        }
    };

    const isFormIncomplete =
        items.length === 0 ||
        items.some(item => !item.productId || item.quantity < 1);

    const inputClasses =
        "mt-1 block w-full border border-gray-300 dark:border-gray-600 rounded-lg py-2 px-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors";

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Create New Invoice
            </h2>

            <form onSubmit={handleSubmit} className="space-y-8">

                
                {/* Customer Section */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                        Customer Details
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Select Existing Customer (Optional)
                            </label>
                            <select
                                className={inputClasses}
                                value={selectedCustomerId}
                                onChange={(e) => handleCustomerSelect(e.target.value)}
                            >
                                <option value="">-- Walk-in / New Customer --</option>
                                {customers.map((c) => (
                                    <option key={c._id} value={c._id}>
                                        {c.name} ({c.phone})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Customer Name
                            </label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={customerName}
                                onChange={(e) => setCustomerName(e.target.value)}
                            />
                            {errors.customerName &&
                                <p className="text-red-500 text-xs mt-1">{errors.customerName}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Mobile Number
                            </label>
                            <div className="flex">
                                <select
                                    className="rounded-l-lg border border-r-0 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-sm p-2.5"
                                    value={countryCode}
                                    onChange={(e) => setCountryCode(e.target.value)}
                                >
                                    <option value="+91">+91</option>
                                    <option value="+1">+1</option>
                                    <option value="+44">+44</option>
                                </select>

                                <input
                                    type="text"
                                    maxLength={10}
                                    inputMode="numeric"
                                    className={`rounded-r-lg ${inputClasses} mt-0 flex-1`}
                                    value={customerMobile}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, "");
                                        if (value.length <= 10) {
                                            setCustomerMobile(value);
                                        }
                                    }}
                                />
                            </div>
                            {errors.customerMobile &&
                                <p className="text-red-500 text-xs mt-1">{errors.customerMobile}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Email Address
                            </label>
                            <input
                                type="email"
                                className={inputClasses}
                                value={customerEmail}
                                onChange={(e) => setCustomerEmail(e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Billing Address
                            </label>
                            <input
                                type="text"
                                className={inputClasses}
                                value={customerAddress}
                                onChange={(e) => setCustomerAddress(e.target.value)}
                            />
                            {errors.customerAddress &&
                                <p className="text-red-500 text-xs mt-1">{errors.customerAddress}</p>}
                        </div>

                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Items</h3>
                        <button type="button" onClick={handleAddItem} className="inline-flex items-center px-3 py-1.5 text-sm rounded-md text-white bg-indigo-600 hover:bg-indigo-700">
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                        </button>
                    </div>

                    {errors.items && <p className="text-red-500 dark:text-red-400 text-sm mb-3">{errors.items}</p>}

                    {items.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-600">
                            <p className="text-gray-500 dark:text-gray-400">No items added.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item, index) => (
                                <div key={index} className="flex flex-col sm:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg border border-gray-100 dark:border-gray-600">
                                    <div className="flex-1 w-full">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Product</label>
                                        <select className={inputClasses} value={item.productId} onChange={(e) => handleItemChange(index, 'productId', e.target.value)}>
                                            <option value="">Select Product</option>
                                            {products.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                                        </select>
                                        {errors[`product_${index}`] && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors[`product_${index}`]}</p>}
                                    </div>
                                    <div className="w-24">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Qty</label>
                                        <input type="number" min="1" className={inputClasses} value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)} />
                                        {errors[`quantity_${index}`] && <p className="text-red-500 dark:text-red-400 text-xs mt-1">{errors[`quantity_${index}`]}</p>}
                                    </div>
                                    <div className="w-32">
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Price</label>
                                        <div className="py-2 px-3 bg-white dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-md text-sm text-gray-900 dark:text-gray-200">
                                            ₹{(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveItem(index)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Totals & Submit */}
                <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex justify-end">
                    <div className="w-full sm:w-1/2 md:w-1/3 space-y-2">
                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                            <span>Subtotal</span>
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                            <span>Tax</span>
                            <span>₹{tax.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-600 pt-2 flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                            <span>Total</span>
                            <span className="text-indigo-600 dark:text-indigo-400">₹{total.toFixed(2)}</span>
                        </div>
                        <button
                            type="submit"
                            disabled={isFormIncomplete}
                            className={`w-full mt-4 py-2 px-4 rounded-lg transition-colors ${isFormIncomplete ? "bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500 dark:text-gray-400" : "bg-indigo-600 text-white hover:bg-indigo-700"}`}
                        >
                            Create Invoice
                        </button>
                    </div>
                </div>

            </form>
        </div>
    );
};


export default CreateInvoice;
