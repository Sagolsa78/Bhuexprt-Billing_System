const Settings = require("../models/Settings");

// @desc    Get Settings
// @route   GET /api/settings
// @access  Public (or Private based on needs)
const getSettings = async (req, res, next) => {
  try {
    // There should only be one settings document. Find the first one.
    let settings = await Settings.findOne();

    // If no settings exist, create default
    if (!settings) {
      settings = await Settings.create({});
    }

    res.json(settings);
  } catch (error) {
    next(error);
  }
};

// @desc    Update Settings
// @route   PUT /api/settings
// @access  Private
const updateSettings = async (req, res, next) => {
  try {
    let settings = await Settings.findOne();

    if (!settings) {
      // Should not happen if getSettings is called first, but handle it
      settings = new Settings();
    }

    settings.companyName = req.body.companyName || settings.companyName;
    settings.companyAddress =
      req.body.companyAddress || settings.companyAddress;
    settings.companyEmail = req.body.companyEmail || settings.companyEmail;
    settings.companyPhone = req.body.companyPhone || settings.companyPhone;
    settings.gstNumber = req.body.gstNumber || settings.gstNumber;
    settings.logoUrl = req.body.logoUrl || settings.logoUrl;
    settings.invoiceFooter = req.body.invoiceFooter || settings.invoiceFooter;
    settings.defaultTaxRate =
      req.body.defaultTaxRate !== undefined
        ? req.body.defaultTaxRate
        : settings.defaultTaxRate;

    const updatedSettings = await settings.save();
    res.json(updatedSettings);
  } catch (error) {
    next(error);
  }
};

module.exports = { getSettings, updateSettings };
