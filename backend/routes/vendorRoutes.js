const express = require("express");
const router = express.Router();
const {
  getVendors,
  getVendorById,
  createVendor,
  verifyGSTIN,
} = require("../controllers/vendorController");

router.route("/").get(getVendors).post(createVendor);
router.route("/verify-gst").post(verifyGSTIN);
router.route("/:id").get(getVendorById);

module.exports = router;
