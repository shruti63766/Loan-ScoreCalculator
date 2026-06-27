export const formatINR = (value: number): string => `Rs. ${Math.round(value).toLocaleString('en-IN')}`
