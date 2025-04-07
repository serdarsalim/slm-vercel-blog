/**
 * Converts category data from any format to a clean string array
 */
export const getCategoryArray = (categories: string | string[]): string[] => {
  // If it's already an array, return it directly
  if (Array.isArray(categories)) {
    return categories;
  }
  
  // String that looks like an array? Parse it
  if (typeof categories === 'string') {
    // If it looks like a JSON array
    if (categories.startsWith('[') && categories.endsWith(']')) {
      try {
        return JSON.parse(categories);
      } catch (e) {
        console.error("Failed to parse categories:", categories);
      }
    }
    
    // Handle comma or pipe separated strings
    if (categories.includes(",")) return categories.split(",").map(c => c.trim());
    if (categories.includes("|")) return categories.split("|").map(c => c.trim());
    
    // Single category
    if (categories.trim()) {
      return [categories.trim()];
    }
  }
  
  // Default case: no categories
  return [];
};