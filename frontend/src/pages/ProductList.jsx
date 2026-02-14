import React, { useState, useEffect } from "react";
import { productAPI } from "../api";
import { Plus, Trash2, Edit, Search, X, Upload } from "lucide-react";
import toast from "react-hot-toast";

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const initialProductState = {
    name: "",
    sku: "",
    hsnCode: "",
    price: "",
    taxRate: 0.18,
    uom: "PCS",
    category: "",
    description: "",
    currentStock: 0,
    minStockLevel: 0,
    maxStockLevel: 100,
    dimensions: { length: 0, width: 0, height: 0, weight: 0 },
  };

  const [newProduct, setNewProduct] = useState(initialProductState);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await productAPI.getAll();
      setProducts(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching products:", err);
      setLoading(false);
    }
  };

  const openEditModal = (product) => {
    setIsEditing(true);
    setCurrentProductId(product._id);
    setNewProduct({
      ...initialProductState,
      ...product,
      currentStock: product.currentStock ?? 0,
      minStockLevel: product.minStockLevel ?? 0,
      maxStockLevel: product.maxStockLevel ?? 100,
      hsnCode: product.hsnCode ?? "",
      category: product.category ?? "",
      description: product.description ?? "",
      dimensions: {
        ...initialProductState.dimensions,
        ...(product.dimensions || {}),
      },
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentProductId(null);
    setNewProduct(initialProductState);
    setShowModal(true);
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    try {
      await productAPI.update(currentProductId, newProduct);
      toast.success("Product updated successfully!");
      fetchProducts();
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update product:", error);
      toast.error(
        "Update failed: " + (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      await productAPI.delete(id);
      toast.success("Product deleted successfully!");
      fetchProducts();
    } catch (error) {
      console.error("Delete Product Error:", error);
      toast.error(error.response?.data?.message || "Failed to delete product");
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      const text = evt.target.result;
      // Simple CSV Parser
      const rows = text.split("\n");
      const headers = rows[0].split(",").map((h) => h.trim());
      const productsToImport = [];

      for (let i = 1; i < rows.length; i++) {
        const row = rows[i].split(",");
        if (row.length === headers.length) {
          const product = {};
          headers.forEach((header, index) => {
            product[header] = row[index]?.trim();
          });

          // Convert types
          if (product.price) product.price = parseFloat(product.price);
          if (product.taxRate) product.taxRate = parseFloat(product.taxRate);
          if (product.currentStock)
            product.currentStock = parseInt(product.currentStock);

          if (product.name && product.sku) {
            productsToImport.push(product);
          }
        }
      }

      if (productsToImport.length > 0) {
        try {
          const res = await productAPI.bulkCreate(productsToImport);
          toast.success(res.data.message);
          fetchProducts();
        } catch (error) {
          toast.error("Import failed");
        }
      } else {
        toast.error("No valid products found in CSV");
      }
    };
    reader.readAsText(file);
  };

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    try {
      await productAPI.create({
        ...newProduct,
        price: parseFloat(newProduct.price),
        taxRate: parseFloat(newProduct.taxRate),
        minStockLevel: parseInt(newProduct.minStockLevel),
        maxStockLevel: parseInt(newProduct.maxStockLevel),
        dimensions: {
          length: parseFloat(newProduct.dimensions.length),
          width: parseFloat(newProduct.dimensions.width),
          height: parseFloat(newProduct.dimensions.height),
          weight: parseFloat(newProduct.dimensions.weight),
        },
      });
      toast.success("Product created successfully!");
      setShowModal(false);
      setNewProduct(initialProductState);
      fetchProducts();
    } catch (err) {
      console.error("Error creating product:", err);
      toast.error(
        "Error creating product. Please check console or ensure you are logged in as admin.",
      );
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (product.sku &&
        product.sku.toLowerCase().includes(searchTerm.toLowerCase())),
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Product Inventory
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your products, stock levels, and details.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Product
        </button>
        <div className="relative">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <button className="flex items-center px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5">
            <Upload className="w-5 h-5 mr-2" />
            Import CSV
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg leading-5 bg-gray-50 dark:bg-gray-700 placeholder-gray-400 text-gray-900 dark:text-gray-200 focus:outline-none focus:bg-white dark:focus:bg-gray-600 focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors"
            placeholder="Search by product name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Product Details
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  SKU / HSN
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Price (Excl. Tax)
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Stock
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredProducts.map((product) => (
                <tr
                  key={product._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        {product.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {product.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {product.description || "No description"}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {product.sku || "-"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      HSN: {product.hsnCode || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400">
                      {product.category || "General"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                      ₹{product.price.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Tax: {(product.taxRate * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {product.currentStock || 0} {product.uom}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEditModal(product)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-2 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 mb-3">
                        <Search className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-200">
                        No products found
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Try adjusting your search or add a new product.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-60 backdrop-blur-sm overflow-y-auto h-full w-full flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Product" : "Add New Product"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={isEditing ? handleUpdateProduct : handleCreateProduct}
              className="p-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Basic Info */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Basic Information
                  </h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Product Name *
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                      value={newProduct.name}
                      onChange={(e) =>
                        setNewProduct({ ...newProduct, name: e.target.value })
                      }
                      required
                      placeholder="e.g. Wireless Mouse"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        SKU *
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                        value={newProduct.sku}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, sku: e.target.value })
                        }
                        required
                        placeholder="Unique ID"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        HSN Code
                      </label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                        value={newProduct.hsnCode}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            hsnCode: e.target.value,
                          })
                        }
                        placeholder="Harmonized System"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                      value={newProduct.category}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          category: e.target.value,
                        })
                      }
                      placeholder="e.g. Electronics"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Description
                    </label>
                    <textarea
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                      rows="3"
                      value={newProduct.description}
                      onChange={(e) =>
                        setNewProduct({
                          ...newProduct,
                          description: e.target.value,
                        })
                      }
                      placeholder="Product details..."
                    ></textarea>
                  </div>
                </div>

                {/* Pricing & Inventory */}
                <div className="space-y-6">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                    Pricing & Inventory
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Price (₹) *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                        value={newProduct.price}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            price: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Tax Rate *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                        value={newProduct.taxRate}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            taxRate: e.target.value,
                          })
                        }
                        required
                        placeholder="0.18"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        UOM
                      </label>
                      <select
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                        value={newProduct.uom}
                        onChange={(e) =>
                          setNewProduct({ ...newProduct, uom: e.target.value })
                        }
                      >
                        <option value="PCS">PCS</option>
                        <option value="KG">KG</option>
                        <option value="MTR">MTR</option>
                        <option value="BOX">BOX</option>
                        <option value="LTR">LTR</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Min Stock Alert
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                        value={newProduct.minStockLevel}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            minStockLevel: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Current Stock
                      </label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                        value={newProduct.currentStock}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            currentStock: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2 pt-4">
                    Dimensions
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      ["length", "Len (cm)"],
                      ["width", "Wid (cm)"],
                      ["height", "Hgt (cm)"],
                      ["weight", "Wgt (kg)"],
                    ].map(([key, label]) => (
                      <div key={key}>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                          {label}
                        </label>
                        <input
                          type="number"
                          className="w-full px-2 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors"
                          value={newProduct.dimensions[key]}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              dimensions: {
                                ...newProduct.dimensions,
                                [key]: e.target.value,
                              },
                            })
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-600 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-6 py-3 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all ${isEditing ? "bg-amber-600 hover:bg-amber-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
                >
                  {isEditing ? "Save Changes" : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;
