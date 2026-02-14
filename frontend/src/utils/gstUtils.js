import { vendorAPI } from "../api";

/**
 * Fetches GSTIN details from the backend (which calls Sandbox API)
 * @param {string} gstin - 15 digit GSTIN
 * @returns {Promise<Object>} - Vendor details
 */
export const fetchGSTDetails = async (gstin) => {
  return new Promise(async (resolve, reject) => {
    if (!gstin || gstin.length < 15) {
      reject(new Error("Invalid GSTIN format. Must be 15 characters."));
      return;
    }

    try {
      const response = await vendorAPI.verifyGST(gstin); // response.data is the payload from backend
      console.log("GST Verification Response:", response.data);

      // Backend returns:
      // {
      //   code: 200,
      //   data: { data: { ...vendorDetails... }, status_cd: "1" },
      //   ...
      // }
      // So we need response.data.data.data

      const rootData = response.data;
      const nestedData = rootData?.data?.data;

      if (!nestedData) {
        // Fallback if structure is different or error
        if (rootData?.message) throw new Error(rootData.message);
        if (rootData?.error) throw new Error("GST Verification failed");
        throw new Error("No data received from GST Provider");
      }

      const apiData = nestedData;

      // Map keys
      const mappedData = {
        legalName: apiData.lgnm,
        tradeName: apiData.tradeNam,
        address: apiData.pradr?.addr
          ? `${apiData.pradr.addr.bno}, ${apiData.pradr.addr.st}, ${apiData.pradr.addr.loc}, ${apiData.pradr.addr.dst}, ${apiData.pradr.addr.pncd}`
          : typeof apiData.address === "string"
            ? apiData.address
            : "",
        state: apiData.pradr?.addr?.stcd || apiData.state || "",
        gstin: apiData.gstin || gstin,
        status: apiData.sts,
        raw: apiData,
      };

      resolve(mappedData);
    } catch (error) {
      console.error("GST Fetch Error", error);
      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to fetch GST details";
      reject(new Error(msg));
    }
  });
};
