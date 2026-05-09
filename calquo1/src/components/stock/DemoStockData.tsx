import { EnhancedStockItem } from './EnhancedStockTypes';

export const demoStockData: EnhancedStockItem[] = [
  {
    id: 'stock-001',
    name: 'Premium Cotton T-Shirts',
    category: 'T-Shirts',
    description: 'High-quality 100% cotton t-shirts with superior comfort and durability. Perfect for casual wear and everyday use.',
    supplier: 'Mumbai Fashion Hub',
    supplierType: 'manufacturer',
    location: 'Mumbai, Maharashtra',
    dateAdded: '2024-01-15',
    itemSetType: 'set_of_pattern',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBhcHBhcmVsfGVufDF8fHx8MTc1OTM1OTk0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-001',
        name: 'Classic White',
        colorCode: '#FFFFFF',
        images: ['https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBhcHBhcmVsfGVufDF8fHx8MTc1OTM1OTk0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-002',
        name: 'Navy Blue',
        colorCode: '#1E3A8A',
        images: ['https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBhcHBhcmVsfGVufDF8fHx8MTc1OTM1OTk0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-003',
        name: 'Forest Green',
        colorCode: '#15803D',
        images: ['https://images.unsplash.com/photo-1495121605193-b116b5b9c5fe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwY2xvdGhpbmclMjBhcHBhcmVsfGVufDF8fHx8MTc1OTM1OTk0NHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-001', name: 'S', displayName: 'Small' },
      { id: 'size-002', name: 'M', displayName: 'Medium' },
      { id: 'size-003', name: 'L', displayName: 'Large' },
      { id: 'size-004', name: 'XL', displayName: 'Extra Large' }
    ],
    combinations: [
      { id: 'combo-001', colorId: 'color-001', sizeId: 'size-001', quantity: 50, availableQuantity: 50, images: [] },
      { id: 'combo-002', colorId: 'color-001', sizeId: 'size-002', quantity: 75, availableQuantity: 75, images: [] },
      { id: 'combo-003', colorId: 'color-001', sizeId: 'size-003', quantity: 60, availableQuantity: 60, images: [] },
      { id: 'combo-004', colorId: 'color-001', sizeId: 'size-004', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-005', colorId: 'color-002', sizeId: 'size-001', quantity: 45, availableQuantity: 45, images: [] },
      { id: 'combo-006', colorId: 'color-002', sizeId: 'size-002', quantity: 70, availableQuantity: 70, images: [] },
      { id: 'combo-007', colorId: 'color-002', sizeId: 'size-003', quantity: 55, availableQuantity: 55, images: [] },
      { id: 'combo-008', colorId: 'color-002', sizeId: 'size-004', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-009', colorId: 'color-003', sizeId: 'size-001', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-010', colorId: 'color-003', sizeId: 'size-002', quantity: 65, availableQuantity: 65, images: [] },
      { id: 'combo-011', colorId: 'color-003', sizeId: 'size-003', quantity: 50, availableQuantity: 50, images: [] },
      { id: 'combo-012', colorId: 'color-003', sizeId: 'size-004', quantity: 30, availableQuantity: 30, images: [] }
    ],
    basePrice: 450,
    singleShopPrice: 480,
    multiShopPrice: 520,
    minOrderQuantity: 10,
    fabricType: '100% Cotton',
    fabricDescription: 'Premium ring-spun cotton with pre-shrunk treatment for lasting fit and comfort.',
    deliveryTime: '5-10 days'
  },
  {
    id: 'stock-002',
    name: 'Formal Business Shirts',
    category: 'Shirts',
    description: 'Professional business shirts made from premium cotton blend fabric. Perfect for office wear and formal occasions.',
    supplier: 'Bangalore Textiles Co.',
    supplierType: 'manufacturer',
    location: 'Bangalore, Karnataka',
    dateAdded: '2024-01-18',
    itemSetType: 'single_color',
    flexibleSelectionAllowed: false,
    mainImages: [
      'https://images.unsplash.com/photo-1523381294911-8d3cead13475?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjBzaGlydHxlbnwxfHx8fDE3NTk0MTUxNTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-004',
        name: 'Crisp White',
        colorCode: '#FFFFFF',
        images: ['https://images.unsplash.com/photo-1523381294911-8d3cead13475?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjBzaGlydHxlbnwxfHx8fDE3NTk0MTUxNTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-005', name: '38', displayName: '38 (S)' },
      { id: 'size-006', name: '40', displayName: '40 (M)' },
      { id: 'size-007', name: '42', displayName: '42 (L)' },
      { id: 'size-008', name: '44', displayName: '44 (XL)' },
      { id: 'size-009', name: '46', displayName: '46 (XXL)' }
    ],
    combinations: [
      { id: 'combo-013', colorId: 'color-004', sizeId: 'size-005', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-014', colorId: 'color-004', sizeId: 'size-006', quantity: 45, availableQuantity: 45, images: [] },
      { id: 'combo-015', colorId: 'color-004', sizeId: 'size-007', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-016', colorId: 'color-004', sizeId: 'size-008', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-017', colorId: 'color-004', sizeId: 'size-009', quantity: 25, availableQuantity: 25, images: [] }
    ],
    basePrice: 1200,
    singleShopPrice: 1350,
    multiShopPrice: 1450,
    minOrderQuantity: 5,
    fabricType: 'Cotton Blend',
    fabricDescription: '60% Cotton, 40% Polyester blend for wrinkle resistance and easy care.',
    deliveryTime: '10-20 days',
    offerPrice: 1100,
    offerType: 'time',
    offerTimeWeeks: 2,
    offerValidUntil: '2024-02-15',
    offerCreatedDate: '2024-01-18'
  },
  {
    id: 'stock-003',
    name: 'Premium Denim Jeans',
    category: 'Jeans',
    description: 'High-quality denim jeans with modern fit and superior comfort. Made from premium denim fabric with stretch for all-day comfort.',
    supplier: 'Tirupur Denim Works',
    supplierType: 'manufacturer',
    location: 'Tirupur, Tamil Nadu',
    dateAdded: '2024-01-20',
    itemSetType: 'set_of_pattern',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1658910453954-6ca847bb7470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zfGVufDF8fHx8MTc1OTM0NzA4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-005',
        name: 'Dark Blue',
        colorCode: '#1E3A8A',
        images: ['https://images.unsplash.com/photo-1658910453954-6ca847bb7470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zfGVufDF8fHx8MTc1OTM0NzA4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-006',
        name: 'Light Blue',
        colorCode: '#3B82F6',
        images: ['https://images.unsplash.com/photo-1658910453954-6ca847bb7470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zfGVufDF8fHx8MTc1OTM0NzA4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-007',
        name: 'Black',
        colorCode: '#000000',
        images: ['https://images.unsplash.com/photo-1658910453954-6ca847bb7470?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZW5pbSUyMGplYW5zfGVufDF8fHx8MTc1OTM0NzA4N3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-010', name: '28', displayName: '28' },
      { id: 'size-011', name: '30', displayName: '30' },
      { id: 'size-012', name: '32', displayName: '32' },
      { id: 'size-013', name: '34', displayName: '34' },
      { id: 'size-014', name: '36', displayName: '36' },
      { id: 'size-015', name: '38', displayName: '38' }
    ],
    combinations: [
      { id: 'combo-018', colorId: 'color-005', sizeId: 'size-010', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-019', colorId: 'color-005', sizeId: 'size-011', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-020', colorId: 'color-005', sizeId: 'size-012', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-021', colorId: 'color-005', sizeId: 'size-013', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-022', colorId: 'color-005', sizeId: 'size-014', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-023', colorId: 'color-005', sizeId: 'size-015', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-024', colorId: 'color-006', sizeId: 'size-010', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-025', colorId: 'color-006', sizeId: 'size-011', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-026', colorId: 'color-006', sizeId: 'size-012', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-027', colorId: 'color-006', sizeId: 'size-013', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-028', colorId: 'color-006', sizeId: 'size-014', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-029', colorId: 'color-006', sizeId: 'size-015', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'combo-030', colorId: 'color-007', sizeId: 'size-010', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'combo-031', colorId: 'color-007', sizeId: 'size-011', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-032', colorId: 'color-007', sizeId: 'size-012', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-033', colorId: 'color-007', sizeId: 'size-013', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-034', colorId: 'color-007', sizeId: 'size-014', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-035', colorId: 'color-007', sizeId: 'size-015', quantity: 10, availableQuantity: 10, images: [] }
    ],
    basePrice: 2200,
    singleShopPrice: 2400,
    multiShopPrice: 2600,
    minOrderQuantity: 3,
    fabricType: 'Stretch Denim',
    fabricDescription: '98% Cotton, 2% Elastane for comfort and flexibility. Pre-washed for shrink resistance.',
    deliveryTime: '10-20 days'
  },
  {
    id: 'stock-004',
    name: 'Elegant Evening Dresses',
    category: 'Dresses',
    description: 'Sophisticated evening dresses perfect for formal events and special occasions. Made from premium fabrics with attention to detail.',
    supplier: 'Delhi Fashion House',
    supplierType: 'trader',
    location: 'New Delhi',
    dateAdded: '2024-01-22',
    itemSetType: 'individual_flex',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1675489757010-e97edf0b8f3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBkcmVzc3xlbnwxfHx8fDE3NTk0MTUxNzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-008',
        name: 'Mixed Collection',
        colorCode: '#8B5CF6',
        images: ['https://images.unsplash.com/photo-1675489757010-e97edf0b8f3e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3JtYWwlMjBkcmVzc3xlbnwxfHx8fDE3NTk0MTUxNzR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-016', name: 'XS', displayName: 'Extra Small' },
      { id: 'size-017', name: 'S', displayName: 'Small' },
      { id: 'size-018', name: 'M', displayName: 'Medium' },
      { id: 'size-019', name: 'L', displayName: 'Large' },
      { id: 'size-020', name: 'XL', displayName: 'Extra Large' }
    ],
    combinations: [
      { id: 'combo-036', quantity: 50, availableQuantity: 50, images: [] }
    ],
    basePrice: 3500,
    singleShopPrice: 3800,
    multiShopPrice: 4200,
    minOrderQuantity: 2,
    fabricType: 'Premium Blend',
    fabricDescription: 'Luxurious fabric blend with satin finish for elegant drape and comfort.',
    deliveryTime: 'more than 1 month',
    tradersOnly: false
  },
  {
    id: 'stock-005',
    name: 'Casual Outdoor Jackets',
    category: 'Jackets',
    description: 'Versatile outdoor jackets perfect for casual wear and light outdoor activities. Water-resistant and wind-proof.',
    supplier: 'Pune Garments Ltd',
    supplierType: 'manufacturer',
    location: 'Pune, Maharashtra',
    dateAdded: '2024-01-25',
    itemSetType: 'set_of_pattern',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1557177040-e73d9591e999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBqYWNrZXR8ZW58MXx8fHwxNzU5NDE1MTgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-009',
        name: 'Olive Green',
        colorCode: '#6B7280',
        images: ['https://images.unsplash.com/photo-1557177040-e73d9591e999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBqYWNrZXR8ZW58MXx8fHwxNzU5NDE1MTgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-010',
        name: 'Charcoal Gray',
        colorCode: '#374151',
        images: ['https://images.unsplash.com/photo-1557177040-e73d9591e999?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjYXN1YWwlMjBqYWNrZXR8ZW58MXx8fHwxNzU5NDE1MTgwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-021', name: 'S', displayName: 'Small' },
      { id: 'size-022', name: 'M', displayName: 'Medium' },
      { id: 'size-023', name: 'L', displayName: 'Large' },
      { id: 'size-024', name: 'XL', displayName: 'Extra Large' }
    ],
    combinations: [
      { id: 'combo-037', colorId: 'color-009', sizeId: 'size-021', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-038', colorId: 'color-009', sizeId: 'size-022', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-039', colorId: 'color-009', sizeId: 'size-023', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-040', colorId: 'color-009', sizeId: 'size-024', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'combo-041', colorId: 'color-010', sizeId: 'size-021', quantity: 18, availableQuantity: 18, images: [] },
      { id: 'combo-042', colorId: 'color-010', sizeId: 'size-022', quantity: 28, availableQuantity: 28, images: [] },
      { id: 'combo-043', colorId: 'color-010', sizeId: 'size-023', quantity: 22, availableQuantity: 22, images: [] },
      { id: 'combo-044', colorId: 'color-010', sizeId: 'size-024', quantity: 12, availableQuantity: 12, images: [] }
    ],
    basePrice: 2800,
    singleShopPrice: 3000,
    multiShopPrice: 3300,
    minOrderQuantity: 2,
    fabricType: 'Weather-Resistant',
    fabricDescription: 'Polyester blend with water-resistant coating and breathable lining.',
    deliveryTime: '5-10 days',
    offerPrice: 2500,
    offerType: 'quantity',
    offerMinQuantity: 10,
    offerValidUntil: '2024-03-15',
    offerCreatedDate: '2024-01-25'
  },
  // Indian Traditional Products
  {
    id: 'stock-006',
    name: 'Premium Cotton Kurtas',
    category: 'Ethnic Wear',
    description: 'Traditional Indian kurtas made from premium cotton with intricate designs. Perfect for festivals, casual wear, and formal occasions.',
    supplier: 'Jaipur Handloom Crafts',
    supplierType: 'manufacturer',
    location: 'Jaipur, Rajasthan',
    dateAdded: '2024-01-28',
    itemSetType: 'set_of_pattern',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1603773590552-b8704c0767a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBrdXJ0YSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc1OTkyNjMwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-011',
        name: 'Cream White',
        colorCode: '#FDF5E6',
        images: ['https://images.unsplash.com/photo-1603773590552-b8704c0767a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBrdXJ0YSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc1OTkyNjMwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-012',
        name: 'Royal Blue',
        colorCode: '#002D72',
        images: ['https://images.unsplash.com/photo-1603773590552-b8704c0767a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBrdXJ0YSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc1OTkyNjMwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-013',
        name: 'Saffron Orange',
        colorCode: '#FF8C00',
        images: ['https://images.unsplash.com/photo-1603773590552-b8704c0767a1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBrdXJ0YSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc1OTkyNjMwM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-025', name: 'S', displayName: 'Small (36-38)' },
      { id: 'size-026', name: 'M', displayName: 'Medium (40-42)' },
      { id: 'size-027', name: 'L', displayName: 'Large (44-46)' },
      { id: 'size-028', name: 'XL', displayName: 'Extra Large (48-50)' },
      { id: 'size-029', name: 'XXL', displayName: 'XXL (52-54)' }
    ],
    combinations: [
      { id: 'combo-045', colorId: 'color-011', sizeId: 'size-025', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-046', colorId: 'color-011', sizeId: 'size-026', quantity: 60, availableQuantity: 60, images: [] },
      { id: 'combo-047', colorId: 'color-011', sizeId: 'size-027', quantity: 55, availableQuantity: 55, images: [] },
      { id: 'combo-048', colorId: 'color-011', sizeId: 'size-028', quantity: 45, availableQuantity: 45, images: [] },
      { id: 'combo-049', colorId: 'color-011', sizeId: 'size-029', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-050', colorId: 'color-012', sizeId: 'size-025', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-051', colorId: 'color-012', sizeId: 'size-026', quantity: 55, availableQuantity: 55, images: [] },
      { id: 'combo-052', colorId: 'color-012', sizeId: 'size-027', quantity: 50, availableQuantity: 50, images: [] },
      { id: 'combo-053', colorId: 'color-012', sizeId: 'size-028', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-054', colorId: 'color-012', sizeId: 'size-029', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-055', colorId: 'color-013', sizeId: 'size-025', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-056', colorId: 'color-013', sizeId: 'size-026', quantity: 50, availableQuantity: 50, images: [] },
      { id: 'combo-057', colorId: 'color-013', sizeId: 'size-027', quantity: 45, availableQuantity: 45, images: [] },
      { id: 'combo-058', colorId: 'color-013', sizeId: 'size-028', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-059', colorId: 'color-013', sizeId: 'size-029', quantity: 20, availableQuantity: 20, images: [] }
    ],
    basePrice: 850,
    singleShopPrice: 950,
    multiShopPrice: 1050,
    minOrderQuantity: 5,
    fabricType: '100% Cotton',
    fabricDescription: 'Premium cotton with traditional block print designs. Breathable and comfortable for all-day wear.',
    deliveryTime: '10-15 days'
  },
  {
    id: 'stock-007',
    name: 'Silk Sarees Collection',
    category: 'Sarees',
    description: 'Exquisite silk sarees with traditional motifs and contemporary designs. Perfect for weddings, festivals, and special occasions.',
    supplier: 'Kanchipuram Silk Weavers',
    supplierType: 'manufacturer',
    location: 'Kanchipuram, Tamil Nadu',
    dateAdded: '2024-01-30',
    itemSetType: 'individual_flex',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzYXJlZSUyMHNpbGt8ZW58MXx8fHwxNzU5OTI4NDk1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-014',
        name: 'Designer Collection',
        colorCode: '#B8860B',
        images: ['https://images.unsplash.com/photo-1742287721821-ddf522b3f37b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBzYXJlZSUyMHNpbGt8ZW58MXx8fHwxNzU5OTI4NDk1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-030', name: 'OneSize', displayName: 'One Size (5.5m)' }
    ],
    combinations: [
      { id: 'combo-060', quantity: 25, availableQuantity: 25, images: [] }
    ],
    basePrice: 8500,
    singleShopPrice: 9200,
    multiShopPrice: 10500,
    minOrderQuantity: 1,
    fabricType: 'Pure Silk',
    fabricDescription: 'Authentic Kanchipuram silk with gold zari work. Traditional craftsmanship with modern appeal.',
    deliveryTime: '15-25 days',
    tradersOnly: false,
    offerPrice: 7800,
    offerType: 'time',
    offerTimeWeeks: 3,
    offerValidUntil: '2024-03-01',
    offerCreatedDate: '2024-01-30'
  },
  {
    id: 'stock-008',
    name: 'Designer Lehenga Sets',
    category: 'Lehengas',
    description: 'Stunning bridal and party lehengas with intricate embroidery and beadwork. Complete sets with choli and dupatta.',
    supplier: 'Delhi Designer Collections',
    supplierType: 'trader',
    location: 'New Delhi',
    dateAdded: '2024-02-02',
    itemSetType: 'set_of_pattern',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1724856604253-b65f8ec7d48b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBsZWhlbmdhJTIwd2VkZGluZ3xlbnwxfHx8fDE3NTk5Mjg1MDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-015',
        name: 'Maroon Red',
        colorCode: '#800000',
        images: ['https://images.unsplash.com/photo-1724856604253-b65f8ec7d48b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBsZWhlbmdhJTIwd2VkZGluZ3xlbnwxfHx8fDE3NTk5Mjg1MDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-016',
        name: 'Royal Pink',
        colorCode: '#FF1493',
        images: ['https://images.unsplash.com/photo-1724856604253-b65f8ec7d48b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBsZWhlbmdhJTIwd2VkZGluZ3xlbnwxfHx8fDE3NTk5Mjg1MDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-017',
        name: 'Golden Yellow',
        colorCode: '#FFD700',
        images: ['https://images.unsplash.com/photo-1724856604253-b65f8ec7d48b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBsZWhlbmdhJTIwd2VkZGluZ3xlbnwxfHx8fDE3NTk5Mjg1MDB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-031', name: 'XS', displayName: 'Extra Small (32)' },
      { id: 'size-032', name: 'S', displayName: 'Small (34)' },
      { id: 'size-033', name: 'M', displayName: 'Medium (36)' },
      { id: 'size-034', name: 'L', displayName: 'Large (38)' },
      { id: 'size-035', name: 'XL', displayName: 'Extra Large (40)' },
      { id: 'size-036', name: 'XXL', displayName: 'XXL (42)' }
    ],
    combinations: [
      { id: 'combo-061', colorId: 'color-015', sizeId: 'size-031', quantity: 8, availableQuantity: 8, images: [] },
      { id: 'combo-062', colorId: 'color-015', sizeId: 'size-032', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'combo-063', colorId: 'color-015', sizeId: 'size-033', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-064', colorId: 'color-015', sizeId: 'size-034', quantity: 18, availableQuantity: 18, images: [] },
      { id: 'combo-065', colorId: 'color-015', sizeId: 'size-035', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'combo-066', colorId: 'color-015', sizeId: 'size-036', quantity: 7, availableQuantity: 7, images: [] },
      { id: 'combo-067', colorId: 'color-016', sizeId: 'size-031', quantity: 10, availableQuantity: 10, images: [] },
      { id: 'combo-068', colorId: 'color-016', sizeId: 'size-032', quantity: 18, availableQuantity: 18, images: [] },
      { id: 'combo-069', colorId: 'color-016', sizeId: 'size-033', quantity: 22, availableQuantity: 22, images: [] },
      { id: 'combo-070', colorId: 'color-016', sizeId: 'size-034', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-071', colorId: 'color-016', sizeId: 'size-035', quantity: 15, availableQuantity: 15, images: [] },
      { id: 'combo-072', colorId: 'color-016', sizeId: 'size-036', quantity: 8, availableQuantity: 8, images: [] },
      { id: 'combo-073', colorId: 'color-017', sizeId: 'size-031', quantity: 6, availableQuantity: 6, images: [] },
      { id: 'combo-074', colorId: 'color-017', sizeId: 'size-032', quantity: 12, availableQuantity: 12, images: [] },
      { id: 'combo-075', colorId: 'color-017', sizeId: 'size-033', quantity: 16, availableQuantity: 16, images: [] },
      { id: 'combo-076', colorId: 'color-017', sizeId: 'size-034', quantity: 14, availableQuantity: 14, images: [] },
      { id: 'combo-077', colorId: 'color-017', sizeId: 'size-035', quantity: 10, availableQuantity: 10, images: [] },
      { id: 'combo-078', colorId: 'color-017', sizeId: 'size-036', quantity: 5, availableQuantity: 5, images: [] }
    ],
    basePrice: 15000,
    singleShopPrice: 16500,
    multiShopPrice: 18500,
    minOrderQuantity: 1,
    fabricType: 'Heavy Georgette & Net',
    fabricDescription: 'Premium fabric with heavy embroidery, sequins, and stone work. Complete 3-piece set.',
    deliveryTime: '20-30 days',
    tradersOnly: false
  },
  {
    id: 'stock-009',
    name: 'Cotton Salwar Kameez Sets',
    category: 'Salwar Suits',
    description: 'Comfortable and stylish cotton salwar kameez sets perfect for daily wear and office use. Complete sets with matching dupatta.',
    supplier: 'Lucknow Chikan Crafts',
    supplierType: 'manufacturer',
    location: 'Lucknow, Uttar Pradesh',
    dateAdded: '2024-02-05',
    itemSetType: 'set_of_pattern',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1633052036653-699d4920a323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjBzYWx3YXIlMjBrYW1lZXp8ZW58MXx8fHwxNzU5OTI4NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-018',
        name: 'Mint Green',
        colorCode: '#98FB98',
        images: ['https://images.unsplash.com/photo-1633052036653-699d4920a323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjBzYWx3YXIlMjBrYW1lZXp8ZW58MXx8fHwxNzU5OTI4NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-019',
        name: 'Powder Blue',
        colorCode: '#B0E0E6',
        images: ['https://images.unsplash.com/photo-1633052036653-699d4920a323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjBzYWx3YXIlMjBrYW1lZXp8ZW58MXx8fHwxNzU5OTI4NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-020',
        name: 'Peach Pink',
        colorCode: '#FFCBA4',
        images: ['https://images.unsplash.com/photo-1633052036653-699d4920a323?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb3R0b24lMjBzYWx3YXIlMjBrYW1lZXp8ZW58MXx8fHwxNzU5OTI4NTA0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-037', name: 'S', displayName: 'Small (36)' },
      { id: 'size-038', name: 'M', displayName: 'Medium (38)' },
      { id: 'size-039', name: 'L', displayName: 'Large (40)' },
      { id: 'size-040', name: 'XL', displayName: 'Extra Large (42)' },
      { id: 'size-041', name: 'XXL', displayName: 'XXL (44)' }
    ],
    combinations: [
      { id: 'combo-079', colorId: 'color-018', sizeId: 'size-037', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-080', colorId: 'color-018', sizeId: 'size-038', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-081', colorId: 'color-018', sizeId: 'size-039', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-082', colorId: 'color-018', sizeId: 'size-040', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-083', colorId: 'color-018', sizeId: 'size-041', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-084', colorId: 'color-019', sizeId: 'size-037', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-085', colorId: 'color-019', sizeId: 'size-038', quantity: 45, availableQuantity: 45, images: [] },
      { id: 'combo-086', colorId: 'color-019', sizeId: 'size-039', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-087', colorId: 'color-019', sizeId: 'size-040', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-088', colorId: 'color-019', sizeId: 'size-041', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-089', colorId: 'color-020', sizeId: 'size-037', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-090', colorId: 'color-020', sizeId: 'size-038', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-091', colorId: 'color-020', sizeId: 'size-039', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-092', colorId: 'color-020', sizeId: 'size-040', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-093', colorId: 'color-020', sizeId: 'size-041', quantity: 15, availableQuantity: 15, images: [] }
    ],
    basePrice: 1200,
    singleShopPrice: 1350,
    multiShopPrice: 1500,
    minOrderQuantity: 3,
    fabricType: 'Cotton with Chikan Embroidery',
    fabricDescription: 'Premium cotton fabric with traditional Lucknowi chikan hand embroidery. Breathable and elegant.',
    deliveryTime: '10-15 days',
    offerPrice: 1050,
    offerType: 'quantity',
    offerMinQuantity: 10,
    offerValidUntil: '2024-03-20',
    offerCreatedDate: '2024-02-05'
  },
  {
    id: 'stock-010',
    name: 'Handloom Dupattas & Stoles',
    category: 'Accessories',
    description: 'Beautiful handwoven dupattas and stoles from various regions of India. Perfect accessories for ethnic and fusion wear.',
    supplier: 'Varanasi Handloom Cooperative',
    supplierType: 'manufacturer',
    location: 'Varanasi, Uttar Pradesh',
    dateAdded: '2024-02-08',
    itemSetType: 'individual_flex',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1723648722809-65f1e11e5060?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBiYW5kaGFuaSUyMGR1cGF0dGF8ZW58MXx8fHwxNzU5OTI4NTE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-021',
        name: 'Mixed Heritage Collection',
        colorCode: '#8B4513',
        images: ['https://images.unsplash.com/photo-1723648722809-65f1e11e5060?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBiYW5kaGFuaSUyMGR1cGF0dGF8ZW58MXx8fHwxNzU5OTI4NTE0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: false, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-042', name: 'Standard', displayName: 'Standard (2.25m)' }
    ],
    combinations: [
      { id: 'combo-094', quantity: 100, availableQuantity: 100, images: [] }
    ],
    basePrice: 450,
    singleShopPrice: 500,
    multiShopPrice: 580,
    minOrderQuantity: 5,
    fabricType: 'Handloom Cotton & Silk Blend',
    fabricDescription: 'Traditional handwoven fabric with bandhani, block print, and zari work from master artisans.',
    deliveryTime: '7-12 days'
  },
  {
    id: 'stock-011',
    name: 'Premium Dhoti Collection',
    category: 'Traditional Wear',
    description: 'High-quality traditional dhotis made from premium cotton and silk. Perfect for religious ceremonies, festivals, and cultural events.',
    supplier: 'Salem Cotton Mills',
    supplierType: 'manufacturer',
    location: 'Salem, Tamil Nadu',
    dateAdded: '2024-02-10',
    itemSetType: 'set_of_pattern',
    flexibleSelectionAllowed: true,
    mainImages: [
      'https://images.unsplash.com/photo-1604074867235-6829038ab657?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkaG90aSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc1OTkyODUwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'
    ],
    colors: [
      {
        id: 'color-022',
        name: 'Pure White',
        colorCode: '#FFFFFF',
        images: ['https://images.unsplash.com/photo-1604074867235-6829038ab657?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkaG90aSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc1OTkyODUwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-023',
        name: 'Off White',
        colorCode: '#FAF0E6',
        images: ['https://images.unsplash.com/photo-1604074867235-6829038ab657?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkaG90aSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc1OTkyODUwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      },
      {
        id: 'color-024',
        name: 'Golden Border',
        colorCode: '#F5DEB3',
        images: ['https://images.unsplash.com/photo-1604074867235-6829038ab657?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBkaG90aSUyMHRyYWRpdGlvbmFsfGVufDF8fHx8MTc1OTkyODUwOHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral'],
        definition: { hasColorPicker: true, hasImage: true, hasName: true }
      }
    ],
    sizes: [
      { id: 'size-043', name: '4m', displayName: '4 meters' },
      { id: 'size-044', name: '4.5m', displayName: '4.5 meters' },
      { id: 'size-045', name: '5m', displayName: '5 meters' }
    ],
    combinations: [
      { id: 'combo-095', colorId: 'color-022', sizeId: 'size-043', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-096', colorId: 'color-022', sizeId: 'size-044', quantity: 40, availableQuantity: 40, images: [] },
      { id: 'combo-097', colorId: 'color-022', sizeId: 'size-045', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-098', colorId: 'color-023', sizeId: 'size-043', quantity: 25, availableQuantity: 25, images: [] },
      { id: 'combo-099', colorId: 'color-023', sizeId: 'size-044', quantity: 35, availableQuantity: 35, images: [] },
      { id: 'combo-100', colorId: 'color-023', sizeId: 'size-045', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-101', colorId: 'color-024', sizeId: 'size-043', quantity: 20, availableQuantity: 20, images: [] },
      { id: 'combo-102', colorId: 'color-024', sizeId: 'size-044', quantity: 30, availableQuantity: 30, images: [] },
      { id: 'combo-103', colorId: 'color-024', sizeId: 'size-045', quantity: 25, availableQuantity: 25, images: [] }
    ],
    basePrice: 650,
    singleShopPrice: 720,
    multiShopPrice: 800,
    minOrderQuantity: 5,
    fabricType: 'Pure Cotton & Cotton-Silk Blend',
    fabricDescription: 'Traditional dhoti fabric with temple borders and traditional weaving techniques.',
    deliveryTime: '5-10 days'
  }
];

// Function to get demo stock data with optional filtering
export const getDemoStockData = (filters?: {
  category?: string;
  supplier?: string;
  minPrice?: number;
  maxPrice?: number;
}): EnhancedStockItem[] => {
  let filteredData = [...demoStockData];

  if (filters) {
    if (filters.category) {
      filteredData = filteredData.filter(item => 
        item.category.toLowerCase().includes(filters.category!.toLowerCase())
      );
    }
    
    if (filters.supplier) {
      filteredData = filteredData.filter(item => 
        item.supplier.toLowerCase().includes(filters.supplier!.toLowerCase())
      );
    }
    
    if (filters.minPrice !== undefined) {
      filteredData = filteredData.filter(item => item.basePrice >= filters.minPrice!);
    }
    
    if (filters.maxPrice !== undefined) {
      filteredData = filteredData.filter(item => item.basePrice <= filters.maxPrice!);
    }
  }

  return filteredData;
};

// Function to simulate API response format
export const getDemoStockResponse = (filters?: any) => {
  return {
    success: true,
    stocks: getDemoStockData(filters),
    total: getDemoStockData(filters).length,
    fromDemo: true
  };
};
