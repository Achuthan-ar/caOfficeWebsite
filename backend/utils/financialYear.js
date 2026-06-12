/**
 * Computes the current Indian Financial Year (FY) in "YYYY-YY" format.
 * Financial Year starts on April 1st.
 * E.g., June 2026 -> "2026-27", February 2026 -> "2025-26"
 * 
 * @returns {string} Financial Year in YYYY-YY format
 */
export const getCurrentFinancialYear = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed: 0 = January, 3 = April
  if (month >= 3) {
    return `${year}-${(year + 1).toString().slice(-2)}`;
  } else {
    return `${year - 1}-${year.toString().slice(-2)}`;
  }
};
