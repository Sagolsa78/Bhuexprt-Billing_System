const Vendor = require("../models/Vendor");
const axios = require("axios");

// @desc    Get all vendors
// @route   GET /api/vendors
// @access  Private
const getVendors = async (req, res, next) => {
  try {
    const vendors = await Vendor.find({}).sort({ name: 1 });
    res.json(vendors);
  } catch (error) {
    next(error);
  }
};

// @desc    Get vendor by ID
// @route   GET /api/vendors/:id
// @access  Private
const getVendorById = async (req, res, next) => {
  try {
    const vendor = await Vendor.findById(req.params.id);
    if (vendor) {
      res.json(vendor);
    } else {
      res.status(404);
      throw new Error("Vendor not found");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Create a vendor
// @route   POST /api/vendors
// @access  Private
const createVendor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      phone,
      address,
      gstin,
      pan,
      state,
      stateCode,
      openingBalance,
    } = req.body;

    const vendorExists = await Vendor.findOne({ name });
    if (vendorExists) {
      res.status(400);
      throw new Error("Vendor already exists");
    }

    const vendor = await Vendor.create({
      name,
      email,
      phone,
      address,
      gstin,
      pan,
      state,
      stateCode,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
    });

    if (vendor) {
      res.status(201).json(vendor);
    } else {
      res.status(400);
      throw new Error("Invalid vendor data");
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify GSTIN via Sandbox API
// @route   POST /api/vendors/verify-gst
// @access  Private
const verifyGSTIN = async (req, res, next) => {
  try {
    const { gstin } = req.body;
    if (!gstin) {
      res.status(400);
      throw new Error("GSTIN is required");
    }

    // 1. Authenticate to get Access Token
    const authUrl = "https://api.sandbox.co.in/authenticate";

    // Ensure keys are present
    if (!process.env.SANDBOX_API_KEY || !process.env.SANDBOX_API_SECRET) {
      console.error("Missing Sandbox API Keys");
      res.status(500);
      throw new Error("Server configuration error: Missing API Keys");
    }

    const authResponse = await axios.post(
      authUrl,
      {},
      {
        headers: {
          "x-api-key": process.env.SANDBOX_API_KEY,
          "x-api-secret": process.env.SANDBOX_API_SECRET,
          "x-api-version": "1.0",
          "Content-Type": "application/json",
        },
      },
    );

    if (!authResponse.data || !authResponse.data.access_token) {
      res.status(500);
      throw new Error("Failed to authenticate with GST Provider");
    }

    const accessToken = authResponse.data.access_token;

    // 2. Search GSTIN
    const searchUrl =
      "https://api.sandbox.co.in/gst/compliance/public/gstin/search";
    // Using GET as per documentation usually, but users code showed POST body { gstin: ... }
    // Standard Sandbox API doc usually says GET /gstin/search?gstin=... but some endpoints use POST.
    // Let's try GET first as it's safer for "search", but if user insists on body...
    // Actually user snippet showed: method: "POST", body: JSON.stringify({ gstin: vendorGSTIN })
    // So I will follow user instruction strictly.

    const searchResponse = await axios.post(
      searchUrl,
      { gstin },
      {
        headers: {
          Authorization: accessToken,
          "x-api-key": process.env.SANDBOX_API_KEY,
          "x-api-version": "1.0",
          "Content-Type": "application/json",
        },
      },
    );

    res.json(searchResponse.data);
    console.log("Search Response", searchResponse.data);
  } catch (error) {
    console.error(
      "GST Verification Error:",
      error.response?.data || error.message,
    );
    const msg = error.response?.data?.message || error.message;
    res.status(error.response?.status || 500);
    // Ensure we don't double-send response if res.status() didn't end it (it doesn't).
    // Using next(error) is safer but we want custom message.
    res.json({ message: msg, error: true });
  }
};

module.exports = {
  getVendors,
  getVendorById,
  createVendor,
  verifyGSTIN,
};
