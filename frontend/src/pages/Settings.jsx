import React, { useState, useEffect } from "react";
import { settingsAPI } from "../api";
import toast from "react-hot-toast";
import { Save, Building, Phone, Mail, FileText } from "lucide-react";

const Settings = () => {
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    companyEmail: "",
    companyPhone: "",
    gstNumber: "",
    logoUrl: "",
    invoiceFooter: "",
    defaultTaxRate: 0.18,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await settingsAPI.get();
      if (res.data) {
        setFormData(res.data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await settingsAPI.update(formData);
      toast.success("Settings updated successfully!");
    } catch (error) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    }
  };

  const inputClasses =
    "w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-200 focus:ring-2 focus:ring-indigo-500 transition-colors";

  if (loading)
    return <div className="p-8 text-center text-gray-500">Loading...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
        System Settings
      </h2>

      <div className="bg-white dark:bg-gray-800 shadow-sm rounded-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
            <Building className="w-5 h-5 mr-2 text-indigo-500" />
            Company Details (for Invoices)
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Company Name
              </label>
              <input
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className={inputClasses}
                required
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Address
              </label>
              <textarea
                name="companyAddress"
                value={formData.companyAddress}
                onChange={handleChange}
                rows="3"
                className={inputClasses}
                required
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Mail className="w-4 h-4 inline mr-1" /> Email
              </label>
              <input
                type="email"
                name="companyEmail"
                value={formData.companyEmail}
                onChange={handleChange}
                className={inputClasses}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Phone className="w-4 h-4 inline mr-1" /> Phone
              </label>
              <input
                type="text"
                name="companyPhone"
                value={formData.companyPhone}
                onChange={handleChange}
                className={inputClasses}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                GST Number
              </label>
              <input
                type="text"
                name="gstNumber"
                value={formData.gstNumber}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Tax Rate (e.g. 0.18)
              </label>
              <input
                type="number"
                step="0.01"
                name="defaultTaxRate"
                value={formData.defaultTaxRate}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <FileText className="w-4 h-4 inline mr-1" /> Invoice Footer Note
              </label>
              <input
                type="text"
                name="invoiceFooter"
                value={formData.invoiceFooter}
                onChange={handleChange}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md"
            >
              <Save className="w-5 h-5 mr-2" />
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
