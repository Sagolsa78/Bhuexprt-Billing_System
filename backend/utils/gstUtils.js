// GST State Codes Mapping
const STATE_CODES = {
    '01': 'Jammu & Kashmir',
    '02': 'Himachal Pradesh',
    '03': 'Punjab',
    '04': 'Chandigarh',
    '05': 'Uttarakhand',
    '06': 'Haryana',
    '07': 'Delhi',
    '08': 'Rajasthan',
    '09': 'Uttar Pradesh',
    '10': 'Bihar',
    '11': 'Sikkim',
    '12': 'Arunachal Pradesh',
    '13': 'Nagaland',
    '14': 'Manipur',
    '15': 'Mizoram',
    '16': 'Tripura',
    '17': 'Meghalaya',
    '18': 'Assam',
    '19': 'West Bengal',
    '20': 'Jharkhand',
    '21': 'Odisha',
    '22': 'Chhattisgarh',
    '23': 'Madhya Pradesh',
    '24': 'Gujarat',
    '25': 'Daman & Diu',
    '26': 'Dadra & Nagar Haveli',
    '27': 'Maharashtra',
    '29': 'Karnataka',
    '30': 'Goa',
    '31': 'Lakshadweep',
    '32': 'Kerala',
    '33': 'Tamil Nadu',
    '34': 'Puducherry',
    '35': 'Andaman & Nicobar Islands',
    '36': 'Telangana',
    '37': 'Andhra Pradesh',
    '38': 'Ladakh'
};

/**
 * Calculate Tax Split (CGST/SGST vs IGST)
 * @param {number} amount - Taxable amount
 * @param {number} rate - GST Rate (e.g., 18 for 18%)
 * @param {string} supplierStateCode - e.g., '27'
 * @param {string} placeOfSupplyCode - e.g., '27'
 * @returns {object} { cgst, sgst, igst, totalTax }
 */
const calculateGST = (amount, rate, supplierStateCode, placeOfSupplyCode) => {
    const totalTax = (amount * rate) / 100;

    // Intra-state (Same State) -> CGST + SGST
    if (supplierStateCode === placeOfSupplyCode) {
        return {
            cgst: totalTax / 2,
            sgst: totalTax / 2,
            igst: 0,
            totalTax
        };
    }
    // Inter-state (Different State) -> IGST
    else {
        return {
            cgst: 0,
            sgst: 0,
            igst: totalTax,
            totalTax
        };
    }
};

module.exports = {
    STATE_CODES,
    calculateGST
};
