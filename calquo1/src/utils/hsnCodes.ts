// HSN (Harmonized System of Nomenclature) codes for apparel categories
// Based on Indian GST classification for textiles and garments

export interface HSNCode {
  code: string;
  description: string;
  category: string;
  gstRate?: string; // GST rate for reference
}

export const apparelHSNCodes: HSNCode[] = [
  // Knitted (Chapter 61)
  { code: '6101', description: "Men's/boys' overcoats, anoraks (knitted)", category: 'Knitted Garments' },
  { code: '6102', description: "Women's/girls' overcoats, anoraks (knitted)", category: 'Knitted Garments' },
  { code: '6103', description: "Men's/boys' suits, jackets, trousers (knitted)", category: 'Knitted Garments' },
  { code: '6104', description: "Women's/girls' suits, dresses, skirts, trousers (knitted)", category: 'Knitted Garments' },
  { code: '6105', description: "Men's/boys' shirts (knitted)", category: 'Knitted Garments' },
  { code: '6106', description: "Women's/girls' blouses/shirts (knitted)", category: 'Knitted Garments' },
  { code: '6107', description: "Men's/boys' underwear, pyjamas (knitted)", category: 'Knitted Garments' },
  { code: '6108', description: "Women's/girls' underwear, nightdresses (knitted)", category: 'Knitted Garments' },
  { code: '6109', description: "T-shirts, vests (knitted)", category: 'Knitted Garments' },
  { code: '6110', description: "Jerseys, pullovers, cardigans (knitted)", category: 'Knitted Garments' },
  { code: '6111', description: "Babies' garments (knitted)", category: 'Knitted Garments' },
  { code: '6112', description: "Track suits, swimwear (knitted)", category: 'Knitted Garments' },
  { code: '6113', description: "Special/coated garments (knitted)", category: 'Knitted Garments' },
  { code: '6114', description: "Other knitted garments", category: 'Knitted Garments' },
  { code: '6115', description: "Hosiery (socks, stockings)", category: 'Knitted Garments' },
  { code: '6116', description: "Gloves/mittens (knitted)", category: 'Knitted Garments' },
  { code: '6117', description: "Clothing accessories/parts (knitted)", category: 'Knitted Garments' },
  
  // Woven (Chapter 62)
  { code: '6201', description: "Men's/boys' overcoats, anoraks (woven)", category: 'Woven Garments' },
  { code: '6202', description: "Women's/girls' overcoats, anoraks (woven)", category: 'Woven Garments' },
  { code: '6203', description: "Men's/boys' suits, jackets, trousers (woven)", category: 'Woven Garments' },
  { code: '6204', description: "Women's/girls' suits, dresses, skirts, trousers (woven)", category: 'Woven Garments' },
  { code: '6205', description: "Men's/boys' shirts (woven)", category: 'Woven Garments' },
  { code: '6206', description: "Women's/girls' blouses/shirts (woven)", category: 'Woven Garments' },
  { code: '6207', description: "Men's/boys' underwear, pyjamas (woven)", category: 'Woven Garments' },
  { code: '6208', description: "Women's/girls' underwear, nightdresses (woven)", category: 'Woven Garments' },
  { code: '6209', description: "Babies' garments (woven)", category: 'Woven Garments' },
  { code: '6210', description: "Protective/coated garments (woven)", category: 'Woven Garments' },
  { code: '6211', description: "Track suits, swimwear, other (woven)", category: 'Woven Garments' },
  { code: '6212', description: "Brassieres, corsets, etc.", category: 'Woven Garments' },
  { code: '6213', description: "Handkerchiefs", category: 'Woven Garments' },
  { code: '6214', description: "Shawls, scarves, veils", category: 'Woven Garments' },
  { code: '6215', description: "Ties, bow ties", category: 'Woven Garments' },
  { code: '6216', description: "Gloves/mittens (woven)", category: 'Woven Garments' },
  { code: '6217', description: "Clothing accessories/parts (woven)", category: 'Woven Garments' }
];

// Helper functions to get HSN codes by category
export const getHSNCodesByCategory = (category: string): HSNCode[] => {
  return apparelHSNCodes.filter(hsn => 
    hsn.category.toLowerCase().includes(category.toLowerCase())
  );
};

// Get HSN codes that match a product category
export const getRelevantHSNCodes = (productCategory: string): HSNCode[] => {
    // Simplified matching since we now have broader categories
    // Matches description instead
    return apparelHSNCodes.filter(hsn => 
        hsn.description.toLowerCase().includes(productCategory.toLowerCase())
    );
};

// Get all unique categories
export const getAllHSNCategories = (): string[] => {
  const categories = new Set(apparelHSNCodes.map(hsn => hsn.category));
  return Array.from(categories).sort();
};

// Search HSN codes by description
export const searchHSNCodes = (searchTerm: string): HSNCode[] => {
  const term = searchTerm.toLowerCase();
  return apparelHSNCodes.filter(hsn => 
    hsn.description.toLowerCase().includes(term) ||
    hsn.code.includes(term) ||
    hsn.category.toLowerCase().includes(term)
  );
};

// Default/fallback HSN codes for common categories
export const getDefaultHSNCode = (category: string): string => {
   // Try to find a match in description
   const match = apparelHSNCodes.find(hsn => hsn.description.toLowerCase().includes(category.toLowerCase()));
   return match ? match.code : '6109'; // Default to T-shirts equivalent if found or 6109
};
