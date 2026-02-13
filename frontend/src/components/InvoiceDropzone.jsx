import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const InvoiceDropzone = ({ onOCRSuccess }) => {
    const [file, setFile] = useState(null);
    const [preview, setPreview] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles) => {
        const selectedFile = acceptedFiles[0];
        if (!selectedFile) return;

        setFile(selectedFile);

        // Create preview
        if (selectedFile.type.startsWith('image/')) {
            const objectUrl = URL.createObjectURL(selectedFile);
            setPreview(objectUrl);
        } else if (selectedFile.type === 'application/pdf') {
            setPreview(null); // PDF preview logic could be added here
        }
    }, []);

    const removeFile = (e) => {
        e.stopPropagation();
        setFile(null);
        setPreview(null);
        setProgress(0);
    };

    const handleUpload = async (e) => {
        e.stopPropagation();
        if (!file) return;

        setUploading(true);
        setProgress(0);

        const formData = new FormData();
        formData.append('invoice', file);

        try {
            // Adjust URL based on your backend configuration
            const response = await axios.post('http://localhost:5000/api/ocr/scan', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                onUploadProgress: (progressEvent) => {
                    const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setProgress(percentCompleted);
                },
            });

            toast.success('Invoice processed successfully!');
            if (onOCRSuccess) {
                onOCRSuccess(response.data);
            }
            // Optional: clear file after success or keep it to show "Done" state
            // setFile(null);
            // setPreview(null);

        } catch (error) {
            console.error('Upload Error:', error);
            const msg = error.response?.data?.message || 'Failed to process invoice';
            toast.error(msg);
        } finally {
            setUploading(false);
        }
    };

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'image/jpeg': [],
            'image/png': [],
            'application/pdf': []
        },
        maxFiles: 1,
        disabled: uploading
    });

    return (
        <div className="w-full mb-8">
            <div
                {...getRootProps()}
                className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ease-in-out cursor-pointer group
                    ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/10' : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-gray-50 dark:hover:bg-gray-800'}
                    ${file ? 'bg-gray-50 dark:bg-gray-800' : ''}
                `}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="flex flex-col items-center">
                        <div className="relative mb-4">
                            {preview ? (
                                <img
                                    src={preview}
                                    alt="Preview"
                                    className="h-48 object-contain rounded-lg shadow-md border border-gray-200 dark:border-gray-700"
                                />
                            ) : (
                                <div className="h-32 w-32 bg-red-100 dark:bg-red-900/20 rounded-lg flex items-center justify-center">
                                    <FileText className="w-16 h-16 text-red-500" />
                                </div>
                            )}

                            {!uploading && (
                                <button
                                    onClick={removeFile}
                                    className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-lg transition-transform hover:scale-110"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <p className="text-sm font-medium text-gray-900 dark:text-gray-200 mb-4">
                            {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </p>

                        {!uploading ? (
                            <button
                                onClick={handleUpload}
                                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium shadow-sm transition-all flex items-center gap-2"
                            >
                                <Upload className="w-4 h-4" />
                                Process Invoice
                            </button>
                        ) : (
                            <div className="w-full max-w-xs">
                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                    <span>Processing...</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                                    <div
                                        className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                {progress === 100 && (
                                    <p className="text-xs text-center text-green-600 mt-2 flex items-center justify-center gap-1 animate-pulse">
                                        <CheckCircle className="w-3 h-3" />
                                        Finalizing OCR results...
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-center">
                        <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-4 group-hover:scale-110 transition-transform duration-200">
                            <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {isDragActive ? "Drop the invoice here" : "Upload Invoice"}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm">
                            Drag & drop your invoice (PDF or Image) here, or click to browse.
                        </p>
                        <div className="mt-4 flex gap-2 text-xs text-gray-400">
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">JPG</span>
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">PNG</span>
                            <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">PDF</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InvoiceDropzone;
