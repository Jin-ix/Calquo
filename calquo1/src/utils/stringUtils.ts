/**
 * Safely converts a value to a string, handling objects with {id, name} structure
 * commonly found in category, supplier, and location fields.
 */
export const getSafeString = (value: any): string => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') {
    return value.name || value.id || 'N/A';
  }
  return String(value);
};
