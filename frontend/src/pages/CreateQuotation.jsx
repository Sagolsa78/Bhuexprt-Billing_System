import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { productAPI, customerAPI, quotationAPI } from '../api';
import { Plus, Trash2, Save, ArrowLeft, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const CreateQuotation = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        customerId: '',
        customerName: '',
        customerEmail: '',
        customerAddress: '',
        customerMobile: '',
        items: [],
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days validity
        placeOfSupply: '27' // Default Maharashtra
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [prodRes, custRes] = await Promise.all([
                    productAPI.getAll(),
                    customerAPI.getAll()
                ]);
                setProducts(prodRes.data);
                setCustomers(custRes.data);
                setLoading(false);
            } catch (error) {
                toast.error('Failed to load data');
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleCustomerSelect = (e) => {
        const custId = e.target.value;
        if (custId) {
            const customer = customers.find(c => c._id === custId);
            setFormData({
                ...formData,
                customerId: custId,
                customerName: customer.name,
                customerEmail: customer.email,
                customerAddress: customer.address,
                customerMobile: customer.mobile
            });
        } else {
            setFormData({
                ...formData,
                customerId: '',
                customerName: '',
                customerEmail: '',
                customerAddress: '',
                customerMobile: ''
            });
        }
    };

    const addItem = () => {
        setFormData({
            ...formData,
            items: [...formData.items, { productId: '', quantity: 1, price: 0, taxRate: 18, total: 0 }]
        });
    };

    const removeItem = (index) => {
        const newItems = formData.items.filter((_, i) => i !== index);
        setFormData({ ...formData, items: newItems });
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index][field] = value;

        if (field === 'productId') {
            const product = products.find(p => p._id === value);
            if (product) {
                newItems[index].price = product.price;
                newItems[index].taxRate = product.taxRate || 18;
            }
        }

        // Recalculate
        const qty = Number(newItems[index].quantity) || 0;
        const price = Number(newItems[index].price) || 0;
        newItems[index].total = qty * price;

        setFormData({ ...formData, items: newItems });
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((acc, item) => acc + (item.quantity * item.price), 0);
        // Simple client-side estimation, backend does precise tax calc
        const estimatedTax = formData.items.reduce((acc, item) => acc + ((item.quantity * item.price) * (item.taxRate / 100)), 0);
        return { subtotal, estimatedTax, total: subtotal + estimatedTax };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await quotationAPI.create(formData);
            toast.success('Quotation created successfully');
            navigate('/quotations');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create quotation');
        }
    };

    const { subtotal, estimatedTax, total } = calculateTotals();

    if (loading) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/quotations')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                    </button>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">New Quotation</h1>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Customer Info */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">Customer Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Existing Customer (Optional)</label>
                            <select
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                onChange={handleCustomerSelect}
                                value={formData.customerId}
                            >
                                <option value="">-- Manual Entry --</option>
                                {customers.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valid Until</label>
                            <input
                                type="date"
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.validUntil}
                                onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Customer Name</label>
                            <input
                                type="text"
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.customerName}
                                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Place of Supply (State Code)</label>
                            <input
                                type="text" placeholder="e.g. 27"
                                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={formData.placeOfSupply}
                                onChange={(e) => setFormData({ ...formData, placeOfSupply: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Items */}
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Items</h2>
                        <button type="button" onClick={addItem} className="flex items-center text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                            <Plus className="w-4 h-4 mr-1" /> Add Item
                        </button>
                    </div>

                    <div className="space-y-4">
                        {formData.items.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-4 items-end bg-gray-50 dark:bg-gray-700/30 p-4 rounded-lg">
                                <div className="flex-1 min-w-[200px]">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Product</label>
                                    <select
                                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={item.productId}
                                        onChange={(e) => handleItemChange(index, 'productId', e.target.value)}
                                        required
                                    >
                                        <option value="">Select Product</option>
                                        {products.map(p => (
                                            <option key={p._id} value={p._id}>{p.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="w-24">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Quantity</label>
                                    <input
                                        type="number" min="1"
                                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={item.quantity}
                                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Price (₹)</label>
                                    <input
                                        type="number" min="0" step="0.01"
                                        className="w-full p-2 text-sm border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        value={item.price}
                                        onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                                        required
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
                            <span>₹{subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600 dark:text-gray-400">
                            <span>Est. Tax</span>
                            <span>₹{estimatedTax.toFixed(2)}</span>
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between text-xl font-bold text-gray-900 dark:text-white">
                            <span>Total</span>
                            <span>₹{total.toFixed(2)}</span>
                        </div>
                        <button type="submit" className="w-full mt-4 flex justify-center items-center py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-500/30 transition-all">
                            <Save className="w-5 h-5 mr-2" /> Generate Quotation
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CreateQuotation;
