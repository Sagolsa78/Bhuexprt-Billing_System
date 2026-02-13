export const formatCurrency = (val) => {
    if (val === undefined || val === null) return '₹0';
    const numberVal = Number(val);
    if (isNaN(numberVal)) return '₹0';

    if (numberVal >= 10000000) return `₹${(numberVal / 10000000).toFixed(2)}Cr`;
    if (numberVal >= 100000) return `₹${(numberVal / 100000).toFixed(2)}L`;
    if (numberVal >= 1000) return `₹${(numberVal / 1000).toFixed(1)}k`;
    return `₹${numberVal.toFixed(0)}`;
};
