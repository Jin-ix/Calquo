import { CompanyUser } from '../components/admin/UserManagement';
import { Supplier } from '../components/suppliers/SuppliersDirectory';

// Default specialties based on business role for demo purposes
const DEFAULT_SPECIALTIES: Record<string, string[]> = {
  manufacturer: ['Cotton Apparel', 'Synthetic Fabrics', 'Traditional Wear', 'Bulk Production'],
  trader: ['Wholesale Trading', 'Import/Export', 'Market Distribution', 'Bulk Supply'],
  financial: ['Payment Processing', 'Trade Finance', 'Credit Solutions', 'Transaction Support'],
  'logistics-agent': ['Transportation', 'Warehousing', 'Last Mile Delivery', 'Supply Chain'],
  retailer: ['Retail Sales', 'Customer Service', 'Brand Management', 'Market Reach']
};

// Default product counts for demo purposes
const DEFAULT_PRODUCT_COUNTS: Record<string, number> = {
  manufacturer: 150,
  trader: 85,
  financial: 1, // Financial agents don't have products
  'logistics-agent': 1, // Logistics agents don't have products
  retailer: 45
};

/**
 * Converts a CompanyUser from user management to a Supplier for the directory
 */
export function convertUserToSupplier(user: CompanyUser): Supplier {
  // Generate a rating based on verification status and role
  const generateRating = (user: CompanyUser): number => {
    let baseRating = 3.5;
    
    if (user.is_verified) baseRating += 1.0;
    if (user.joining_fee_paid) baseRating += 0.3;
    if (user.status === 'active') baseRating += 0.2;
    
    // Add some randomness for demo but keep it consistent per user
    const userSeed = user.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    const variance = ((userSeed % 10) - 5) * 0.1;
    
    const finalRating = Math.min(5.0, Math.max(1.0, baseRating + variance));
    return Math.round(finalRating * 10) / 10; // Round to 1 decimal place
  };

  // Create full address location string
  const location = [user.city, user.state].filter(Boolean).join(', ');

  return {
    id: user.id,
    name: user.company_name,
    type: user.business_role as 'manufacturer' | 'trader' | 'financial' | 'logistics-agent',
    location: location || 'Location not specified',
    rating: generateRating(user),
    totalProducts: DEFAULT_PRODUCT_COUNTS[user.business_role] || 50,
    description: `${user.company_name} is a trusted ${user.business_role} based in ${user.city || 'India'}. ${
      user.is_verified ? 'Verified business' : 'Pending verification'
    } with GST registration ${user.gst_number}.`,
    specialties: DEFAULT_SPECIALTIES[user.business_role] || ['General Services'],
    joinedDate: user.createdAt || new Date().toISOString(),
    verified: user.is_verified || false,
    contactEmail: user.email,
    contactPhone: user.mobile
  };
}

/**
 * Filters users to only those that can be suppliers (manufacturers, traders, financial agents)
 */
export function filterSuppliersFromUsers(users: CompanyUser[]): CompanyUser[] {
  return users.filter(user => 
    user.business_role === 'manufacturer' || 
    user.business_role === 'trader' || 
    user.business_role === 'financial'
  );
}

/**
 * Converts an array of CompanyUsers to Suppliers
 */
export function convertUsersToSuppliers(users: CompanyUser[]): Supplier[] {
  const supplierUsers = filterSuppliersFromUsers(users);
  return supplierUsers.map(convertUserToSupplier);
}

/**
 * Gets supplier statistics from user data
 */
export function getSupplierStats(users: CompanyUser[]) {
  const suppliers = filterSuppliersFromUsers(users);
  
  return {
    total: suppliers.length,
    manufacturers: suppliers.filter(u => u.business_role === 'manufacturer').length,
    traders: suppliers.filter(u => u.business_role === 'trader').length,
    financial: suppliers.filter(u => u.business_role === 'financial').length,
    verified: suppliers.filter(u => u.is_verified).length,
    active: suppliers.filter(u => u.status === 'active').length
  };
}