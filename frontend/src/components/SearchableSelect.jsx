import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, X, Plus } from "lucide-react";

const SearchableSelect = ({
  options = [],
  value,
  onChange,
  onCreate,
  placeholder = "Select...",
  label,
  displayKey = "name",
  valueKey = "_id",
  renderOption,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  const selectedOption = options.find((opt) => opt[valueKey] === value);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    String(opt[displayKey] || "")
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  const handleSelect = (opt) => {
    onChange(opt[valueKey]);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleCreate = () => {
    if (onCreate && searchTerm.trim()) {
      onCreate(searchTerm.trim());
      setIsOpen(false);
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative ${className}`} ref={wrapperRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}

      <div
        className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white flex justify-between items-center cursor-pointer bg-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span
          className={!selectedOption ? "text-gray-500 dark:text-gray-400" : ""}
        >
          {selectedOption
            ? renderOption
              ? renderOption(selectedOption)
              : selectedOption[displayKey]
            : placeholder}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
          <div className="p-2 sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
            <input
              type="text"
              className="w-full p-2 text-sm border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Search or type to create..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="py-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <div
                  key={opt[valueKey]}
                  className={`px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer text-sm ${opt[valueKey] === value ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300" : "text-gray-800 dark:text-gray-200"}`}
                  onClick={() => handleSelect(opt)}
                >
                  {renderOption ? renderOption(opt) : opt[displayKey]}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 text-center">
                No matches found
              </div>
            )}

            {searchTerm &&
              !filteredOptions.some(
                (opt) =>
                  opt[displayKey].toLowerCase() === searchTerm.toLowerCase(),
              ) &&
              onCreate && (
                <div
                  className="px-4 py-2 border-t border-gray-100 dark:border-gray-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer text-sm text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-2"
                  onClick={handleCreate}
                >
                  <Plus className="w-4 h-4" />
                  Create "{searchTerm}"
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchableSelect;
