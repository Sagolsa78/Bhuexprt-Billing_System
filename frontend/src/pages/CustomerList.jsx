import React, { useState, useEffect } from "react";
import { customerAPI } from "../api";
import { Plus, Trash2, Edit, Search, X, User, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const CustomerList = () => {
  const [customers, setCustomers] = useState([]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [currentCustomerId, setCurrentCustomerId] = useState(null);

  const initialCustomerState = {
    name: "",
    email: "",
    phone: "",
    gstNumber: "",
    address: "",
    state: "Maharashtra",
    stateCode: "27",
    creditLimit: "",
    outstandingBalance: "",
    notes: "",
  };

  const [newCustomer, setNewCustomer] = useState(initialCustomerState);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await customerAPI.getAll();
      setCustomers(res.data);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching customers:", err);
      setLoading(false);
    }
  };

  const openEditModal = (customer) => {
    setIsEditing(true);
    setCurrentCustomerId(customer._id);
    setNewCustomer({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      gstNumber: customer.gstNumber || "",
      address: customer.address || "",
      state: customer.state || "Maharashtra",
      stateCode: customer.stateCode || "27",
      creditLimit: customer.creditLimit || "",
      outstandingBalance: customer.outstandingBalance || "",
      notes: customer.notes || "",
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    setIsEditing(false);
    setCurrentCustomerId(null);
    setNewCustomer(initialCustomerState);
    setShowModal(true);
  };

  const handleUpdateCustomer = async (e) => {
    e.preventDefault();
    try {
      await customerAPI.update(currentCustomerId, newCustomer);
      toast.success("Customer updated successfully!");
      fetchCustomers();
      setShowModal(false);
    } catch (error) {
      console.error("Failed to update customer:", error);
      toast.error(
        "Update failed: " + (error.response?.data?.message || error.message),
      );
    }
  };

  const handleDeleteCustomer = async (id) => {
    if (!window.confirm("Are you sure you want to delete this customer?"))
      return;
    try {
      await customerAPI.delete(id);
      toast.success("Customer deleted successfully!");
      fetchCustomers();
    } catch (error) {
      console.error("Delete Customer Error:", error);
      toast.error(error.response?.data?.message || "Failed to delete customer");
    }
  };

  const handleCreateCustomer = async (e) => {
    e.preventDefault();
    try {
      await customerAPI.create(newCustomer);
      toast.success("Customer created successfully!");
      setShowModal(false);
      setNewCustomer(initialCustomerState);
      fetchCustomers();
    } catch (err) {
      console.error("Error creating customer:", err);
      toast.error(
        "Error creating customer: " +
          (err.response?.data?.message || err.message),
      );
    }
  };

  const handleGstinFetch = () => {
    if (!newCustomer.gstNumber || newCustomer.gstNumber.length < 15)
      return toast.error("Enter valid 15-digit GSTIN");

    toast.promise(
      new Promise((resolve) =>
        setTimeout(() => {
          // Simulate Fetch
          const mockData = {
            legalName: "BHU EXPERT SOLUTIONS PVT LTD",
            tradeName: "BHU EXPERT CLIENT",
            address: "456, Client Park, Mumbai, Maharashtra",
            state: "Maharashtra",
            stateCode: "27",
          };
          resolve(mockData);
        }, 1000),
      ),
      {
        loading: "Fetching GSTIN details...",
        success: (data) => {
          setNewCustomer((prev) => ({
            ...prev,
            name: data.tradeName || prev.name,
            address: data.address,
            state: data.state,
            stateCode: data.stateCode,
          }));
          return "Details fetched successfully!";
        },
        error: "Failed to fetch details",
      },
    );
  };

  const filteredCustomers = customers.filter(
    (customer) =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm),
  );

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );

  const inputClasses =
    "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors";

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
            Customers
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your customer database and details.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Customer
        </button>
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
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredCustomers.map((customer) => (
                <tr
                  key={customer._id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      410
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 dark:text-gray-200">
                          {customer.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          ID: {customer._id.slice(-6).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {customer.email}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {customer.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900 dark:text-gray-200">
                      {customer.gstNumber || "N/A"}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                      {customer.address || "N/A"}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => navigate(`/customers/${customer._id}`)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors mr-1"
                      title="View Details"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(customer)}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 p-2 rounded-full hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCustomer(customer._id)}
                      className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 ml-2 p-2 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center text-gray-500 dark:text-gray-400"
                  >
                    <div className="flex flex-col items-center justify-center">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-4 mb-3">
                        <User className="h-6 w-6 text-gray-400" />
                      </div>
                      <p className="text-lg font-medium text-gray-900 dark:text-gray-200">
                        No customers found
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Try adjusting your search or add a new customer.
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
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isEditing ? "Edit Customer" : "Add New Customer"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form
              onSubmit={isEditing ? handleUpdateCustomer : handleCreateCustomer}
              className="p-8 space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  className={inputClasses}
                  value={newCustomer.name}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, name: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  className={inputClasses}
                  value={newCustomer.email}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone *
                </label>

                <input
                  type="tel"
                  maxLength={10}
                  pattern="[0-9]{10}"
                  className={inputClasses}
                  value={newCustomer.phone}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, ""); // remove non-digits
                    if (value.length <= 10) {
                      setNewCustomer({ ...newCustomer, phone: value });
                    }
                  }}
                  required
                />

                {newCustomer.phone && newCustomer.phone.length !== 10 && (
                  <p className="text-red-500 text-xs mt-1">
                    Mobile number must be exactly 10 digits
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    GST Number
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={inputClasses}
                      value={newCustomer.gstNumber}
                      onChange={(e) =>
                        setNewCustomer({
                          ...newCustomer,
                          gstNumber: e.target.value,
                        })
                      }
                      placeholder="27ABCDE1234F1Z5"
                    />
                    <button
                      type="button"
                      onClick={handleGstinFetch}
                      className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium hover:bg-blue-200 whitespace-nowrap"
                    >
                      Fetch
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    State
                  </label>
                  <select
                    className={inputClasses}
                    value={newCustomer.state}
                    onChange={(e) => {
                      const selectedState = e.target.value;
                      // Simple mapping for demo
                      const codeMap = {
                        Maharashtra: "27",
                        Gujarat: "24",
                        Karnataka: "29",
                        Delhi: "07",
                      };
                      setNewCustomer({
                        ...newCustomer,
                        state: selectedState,
                        stateCode: codeMap[selectedState] || "",
                      });
                    }}
                  >
                    <option value="Maharashtra">Maharashtra</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Delhi">Delhi</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Credit Limit
                  </label>
                  <input
                    type="number"
                    className={inputClasses}
                    value={newCustomer.creditLimit}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        creditLimit: e.target.value,
                      })
                    }
                    placeholder="0 for no limit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Opening Balance
                  </label>
                  <input
                    type="number"
                    className={inputClasses}
                    value={newCustomer.outstandingBalance}
                    onChange={(e) =>
                      setNewCustomer({
                        ...newCustomer,
                        outstandingBalance: e.target.value,
                      })
                    }
                    placeholder="Positive = Due"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  className={inputClasses}
                  rows="2"
                  value={newCustomer.notes}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, notes: e.target.value })
                  }
                ></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  className={inputClasses}
                  rows="3"
                  value={newCustomer.address}
                  onChange={(e) =>
                    setNewCustomer({ ...newCustomer, address: e.target.value })
                  }
                ></textarea>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
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
                  {isEditing ? "Save Changes" : "Add Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerList;
