/**
 * dateUtils.js
 * Universal date utilities for SAHAYIKA frontline app.
 * Enforces DD-MM-YYYY format across all displays, forms, and cards.
 */

// Formats any date input (YYYY-MM-DD, ISO string, Date object, or timestamp) to "DD-MM-YYYY"
export const formatDate = (input, fallback = '') => {
  if (!input) return fallback;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    // Already in DD-MM-YYYY format?
    if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
      return trimmed;
    }
    // Is YYYY-MM-DD?
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
      const parts = trimmed.split('T')[0].split('-');
      if (parts.length === 3) {
        return `${parts[2]}-${parts[1]}-${parts[0]}`;
      }
    }
    // Attempt parse
    const parsed = new Date(trimmed);
    if (!isNaN(parsed.getTime())) {
      const d = String(parsed.getDate()).padStart(2, '0');
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const y = parsed.getFullYear();
      return `${d}-${m}-${y}`;
    }
    return trimmed;
  }

  if (input instanceof Date && !isNaN(input.getTime())) {
    const d = String(input.getDate()).padStart(2, '0');
    const m = String(input.getMonth() + 1).padStart(2, '0');
    const y = input.getFullYear();
    return `${d}-${m}-${y}`;
  }

  if (typeof input === 'number') {
    const dObj = new Date(input);
    if (!isNaN(dObj.getTime())) {
      const d = String(dObj.getDate()).padStart(2, '0');
      const m = String(dObj.getMonth() + 1).padStart(2, '0');
      const y = dObj.getFullYear();
      return `${d}-${m}-${y}`;
    }
  }

  return fallback;
};

// Converts user input (which can be DD-MM-YYYY or YYYY-MM-DD) into backend ISO format YYYY-MM-DD
export const toBackendDate = (input) => {
  if (!input) return '';
  const trimmed = String(input).trim();
  // If DD-MM-YYYY
  if (/^\d{2}-\d{2}-\d{4}$/.test(trimmed)) {
    const parts = trimmed.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return trimmed;
};

// Returns current date in DD-MM-YYYY format
export const getTodayDDMMYYYY = () => {
  return formatDate(new Date());
};
