/**
 * Tier-based color utilities for user roles and badges
 */

export type TierColor = 
  | 'bronze'
  | 'silver' 
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'premium'
  | 'default';

export type UserRole = 
  | 'retailer'
  | 'manufacturer'
  | 'trader'
  | 'financial_agent'
  | 'logistics_agent'
  | 'admin'
  | 'user';

/**
 * Get tier badge color classes based on user role or tier level
 */
export function getTierBadgeColor(role: UserRole | TierColor): string {
  const colorMap: Record<UserRole | TierColor, string> = {
    // User roles
    admin: 'bg-red-100 text-red-800 border-red-200',
    manufacturer: 'bg-blue-100 text-blue-800 border-blue-200',
    retailer: 'bg-green-100 text-green-800 border-green-200',
    trader: 'bg-purple-100 text-purple-800 border-purple-200',
    financial_agent: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    logistics_agent: 'bg-orange-100 text-orange-800 border-orange-200',
    user: 'bg-gray-100 text-gray-800 border-gray-200',
    
    // Tier colors
    bronze: 'bg-amber-100 text-amber-800 border-amber-200',
    silver: 'bg-gray-100 text-gray-800 border-gray-200',
    gold: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    platinum: 'bg-slate-100 text-slate-800 border-slate-200',
    diamond: 'bg-cyan-100 text-cyan-800 border-cyan-200',
    premium: 'bg-violet-100 text-violet-800 border-violet-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  return colorMap[role] || colorMap.default;
}

/**
 * Get tier gradient background for premium displays
 */
export function getTierGradient(tier: TierColor): string {
  const gradientMap: Record<TierColor, string> = {
    bronze: 'bg-gradient-to-r from-amber-400 to-orange-500',
    silver: 'bg-gradient-to-r from-gray-400 to-gray-600',
    gold: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
    platinum: 'bg-gradient-to-r from-slate-400 to-slate-600',
    diamond: 'bg-gradient-to-r from-cyan-400 to-blue-500',
    premium: 'bg-gradient-to-r from-violet-400 to-purple-600',
    default: 'bg-gradient-to-r from-gray-400 to-gray-600',
  };

  return gradientMap[tier] || gradientMap.default;
}

/**
 * Get user role display name
 */
export function getRoleDisplayName(role: UserRole): string {
  const displayNames: Record<UserRole, string> = {
    admin: 'Admin',
    manufacturer: 'Manufacturer',
    retailer: 'Retailer',
    trader: 'Trader',
    financial_agent: 'Financial Agent',
    logistics_agent: 'Logistics Agent',
    user: 'User',
  };

  return displayNames[role] || 'User';
}

/**
 * Get role icon emoji
 */
export function getRoleIcon(role: UserRole): string {
  const iconMap: Record<UserRole, string> = {
    admin: '👑',
    manufacturer: '🏭',
    retailer: '🏪',
    trader: '💼',
    financial_agent: '💰',
    logistics_agent: '🚛',
    user: '👤',
  };

  return iconMap[role] || '👤';
}

/**
 * Get tier level from role (for progression systems)
 */
export function getTierLevel(role: UserRole): number {
  const tierLevels: Record<UserRole, number> = {
    user: 1,
    retailer: 2,
    trader: 3,
    manufacturer: 4,
    financial_agent: 5,
    logistics_agent: 5,
    admin: 10,
  };

  return tierLevels[role] || 1;
}

/**
 * Check if user has premium access based on role
 */
export function hasPremiumAccess(role: UserRole): boolean {
  return ['admin', 'manufacturer', 'financial_agent', 'logistics_agent'].includes(role);
}

/**
 * Get role-based pricing tier
 */
export function getPricingTier(role: UserRole): 'standard' | 'wholesale' | 'premium' {
  if (role === 'retailer') return 'wholesale';
  if (['manufacturer', 'financial_agent', 'logistics_agent', 'admin'].includes(role)) return 'premium';
  return 'standard';
}

/**
 * Get role priority for UI ordering
 */
export function getRolePriority(role: UserRole): number {
  const priorities: Record<UserRole, number> = {
    admin: 1,
    manufacturer: 2,
    financial_agent: 3,
    logistics_agent: 4,
    trader: 5,
    retailer: 6,
    user: 7,
  };

  return priorities[role] || 999;
}