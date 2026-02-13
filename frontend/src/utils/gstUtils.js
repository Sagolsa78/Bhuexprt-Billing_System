/**
 * Simulates fetching GSTIN details from an external API
 * @param {string} gstin - 15 digit GSTIN
 * @returns {Promise<Object>} - Vendor details
 */
export const fetchGSTDetails = async (gstin) => {
    return new Promise((resolve, reject) => {
        if (!gstin || gstin.length < 15) {
            reject(new Error('Invalid GSTIN format. Must be 15 characters.'));
            return;
        }

        setTimeout(() => {
            // Simulate API Response
            // In a real app, this would be an axios.get call to a GST provider
            const mockData = {
                legalName: "BHU EXPERT SOLUTIONS PVT LTD",
                tradeName: "BHU EXPERT",
                address: "123, Tech Park, Pune, Maharashtra",
                state: "Maharashtra",
                gstin: gstin
            };
            resolve(mockData);
        }, 1500);
    });
};
