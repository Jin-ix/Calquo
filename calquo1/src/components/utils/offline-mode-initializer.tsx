// Offline Mode Initializer for CALICO
// Enables full functionality without backend dependencies

export class OfflineModeInitializer {
  private static instance: OfflineModeInitializer;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): OfflineModeInitializer {
    if (!OfflineModeInitializer.instance) {
      OfflineModeInitializer.instance = new OfflineModeInitializer();
    }
    return OfflineModeInitializer.instance;
  }

  public initialize() {
    if (this.isInitialized) return;

    // DISABLE OFFLINE MODE / DEMO MODE BY DEFAULT
    // The user explicitly requested "actual things happening, no demo"
    // We will only enable offline mode if strictly necessary (e.g., no network)
    // or if specific flags are set.
    
    const forceOffline = localStorage.getItem('calico_force_offline') === 'true';
    if (!forceOffline) {
        console.log('🔄 CALICO Offline Mode skipped (Real Mode Active)');
        return;
    }

    console.log('🔄 Initializing CALICO in Offline Mode...');

    // Set up network request interceptor
    this.setupNetworkInterceptor();
    
    // Initialize demo data
    this.initializeDemoData();
    
    // Setup error suppression
    this.setupErrorSuppression();
    
    this.isInitialized = true;
    console.log('✅ CALICO Offline Mode initialized successfully');
  }

  private setupNetworkInterceptor() {
    const originalFetch = window.fetch;
    
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      
      // Intercept Firebase and API calls
      if (url.includes('firebaseio.com') || url.includes('googleapis.com') || url.includes('/api/') || url.includes('edge-functions')) {
        console.log('🔄 Network request intercepted, returning offline response');
        
        return new Response(JSON.stringify({
          success: true,
          message: 'Offline mode active',
          data: this.getMockData(url)
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Let other requests (images, etc.) proceed normally
      try {
        return await originalFetch(input, init);
      } catch (error) {
        // Return empty success response for failed requests
        return new Response(JSON.stringify({ success: false, offline: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    };
  }

  private setupErrorSuppression() {
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;
    const originalConsoleLog = console.log;

    // Suppress backend-related errors
    console.error = (...args: any[]) => {
      const message = args.join(' ');
      if (this.shouldSuppressError(message)) {
        return; // Silently suppress
      }
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const message = args.join(' ');
      if (this.shouldSuppressError(message)) {
        return; // Silently suppress
      }
      originalConsoleWarn.apply(console, args);
    };

    console.log = (...args: any[]) => {
      const message = args.join(' ');
      // Suppress specific log messages about suppliers and migrations
      if (message.includes('⚠️ No suppliers found') || 
          message.includes('❌ Failed to load suppliers') ||
          message.includes('Using fallback suppliers') ||
          message.includes('Error while deploying')) {
        return; // Silently suppress
      }
      originalConsoleLog.apply(console, args);
    };
  }

  private shouldSuppressError(message: string): boolean {
    const suppressPatterns = [
      'failed with status 403',
      'edge_functions',
      'make-server',
      'deploy',
      'Network error',
      'Failed to fetch',
      'AbortError',
      'TypeError: Failed to fetch',
      'No suppliers found in database',
      'running migration',
      'Failed to load suppliers even after migration',
      'Using fallback suppliers data',
      'Suppliers migration',
      'Migration failed',
      'Error while deploying',
      'Message getPage',
      'response timed out',
      'timed out after',
      'getPage timeout',
      'getPage (id:',
      '30000ms',
      'timeout after 30000ms',
      'Failed to obtain primary lease',
      'Backfill Indexes',
      'Firestore listener',
      'taking longer than expected',
      'Working in offline mode'
    ];

    return suppressPatterns.some(pattern => 
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  private initializeDemoData() {
    // Store comprehensive demo data in localStorage
    const demoData = {
      users: this.getDemoUsers(),
      suppliers: this.getDemoSuppliers(),
      stock: this.getDemoStock(),
      orders: [],
      initialized: true,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('calico_offline_data', JSON.stringify(demoData));
    localStorage.setItem('calico_offline_mode', 'true');
  }

  private getMockData(url: string): any {
    if (url.includes('gstLogin') || url.includes('auth')) {
      return {
        success: true,
        company_name: 'Demo Textile Company',
        owner_name: 'Demo User',
        email: 'demo@calico.com',
        mobile: '9876543210',
        business_role: 'retailer',
        is_verified: true
      };
    }

    if (url.includes('suppliers')) {
      return { 
        success: true,
        suppliers: this.getDemoSuppliers(),
        count: this.getDemoSuppliers().length
      };
    }

    if (url.includes('migrate-suppliers')) {
      return {
        success: true,
        count: this.getDemoSuppliers().length,
        message: 'Migration completed in offline mode'
      };
    }

    if (url.includes('stock')) {
      return { stock: this.getDemoStock() };
    }

    return { success: true, data: [] };
  }

  private getDemoUsers() {
    return [
      {
        id: '1',
        email: 'retailer@calico.com',
        gstNumber: '27AAAAA0000A1Z5',
        role: 'retailer',
        company: 'Fashion Hub Mumbai',
        profile: {
          name: 'Priya Sharma',
          company: 'Fashion Hub Mumbai',
          phone: '+91 98765 43210',
          address: 'Mumbai, Maharashtra'
        }
      },
      {
        id: '2',
        email: 'manufacturer@calico.com', 
        gstNumber: '24BBBBB1111B2Z6',
        role: 'manufacturer',
        company: 'Arvind Limited',
        profile: {
          name: 'Rajesh Kumar',
          company: 'Arvind Limited',
          phone: '+91 79 6620 3000',
          address: 'Ahmedabad, Gujarat'
        }
      },
      {
        id: '3',
        email: 'trader@calico.com',
        gstNumber: '29CCCCC2222C3Z7', 
        role: 'trader',
        company: 'Global Textiles',
        profile: {
          name: 'Amit Patel',
          company: 'Global Textiles',
          phone: '+91 80 4155 5000',
          address: 'Bangalore, Karnataka'
        }
      },
      {
        id: '4',
        email: 'agent@calico.com',
        gstNumber: '27XXXXX0000X1Z9',
        role: 'financial_agent',
        company: 'FastPay Finance',
        profile: {
            name: 'Vikram Singh',
            company: 'FastPay Finance',
            phone: '+91 98765 99999',
            address: 'Mumbai, Maharashtra'
        }
      },
      {
        id: 'admin',
        email: 'admin@calico.com',
        gstNumber: 'ADMINSOGOMOTECH',
        role: 'admin',
        company: 'CALICO Administration',
        profile: {
          name: 'System Administrator',
          company: 'CALICO Administration', 
          phone: '+91 98765 43200',
          address: 'Mumbai, Maharashtra'
        }
      }
    ];
  }

  private getDemoSuppliers() {
    return [
      {
        id: '2', // Matches User ID '2'
        name: 'Arvind Limited',
        type: 'manufacturer',
        location: 'Ahmedabad, Gujarat',
        rating: 4.8,
        totalProducts: 850,
        description: 'Leading textile manufacturer specializing in denim and cotton fabrics',
        verified: true
      },
      {
        id: 'SUP002', 
        name: 'Welspun India Ltd',
        type: 'manufacturer',
        location: 'Mumbai, Maharashtra',
        rating: 4.7,
        totalProducts: 750,
        description: 'Global leader in home textiles and terry towels',
        verified: true
      },
      {
        id: '3', // Matches User ID '3'
        name: 'Global Textiles',
        type: 'trader',
        location: 'Bangalore, Karnataka', 
        rating: 4.5,
        totalProducts: 500,
        description: 'Wholesale textile trading with pan-India distribution',
        verified: true
      }
    ];
  }

  private getDemoStock() {
    return [
      {
        id: 'STK001',
        name: 'Premium Cotton T-Shirt',
        category: 'Apparel',
        price: 299,
        quantity: 500,
        supplier: 'Arvind Limited',
        supplierId: '2', // Matches User ID '2'
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop'],
        description: 'High-quality cotton t-shirt perfect for retail'
      },
      {
        id: 'STK002',
        name: 'Formal Cotton Shirt',
        category: 'Apparel', 
        price: 899,
        quantity: 200,
        supplier: 'Welspun India Ltd',
        supplierId: 'SUP002',
        images: ['https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=300&fit=crop'],
        description: 'Professional formal shirt for business wear'
      },
      {
        id: 'STK003',
        name: 'Silk Saree Collection',
        category: 'Apparel', 
        price: 2499,
        quantity: 100,
        supplier: 'Global Textiles',
        supplierId: '3', // Matches User ID '3'
        images: ['https://images.unsplash.com/photo-1610189012906-4783fdae2b2b?w=400&h=300&fit=crop'],
        description: 'Elegant silk sarees for special occasions'
      }
    ];
  }

  public isOfflineMode(): boolean {
    return localStorage.getItem('calico_offline_mode') === 'true';
  }

  public getDemoCredentials() {
    return [
      { email: 'retailer@calico.com', password: 'demo123', role: 'Retailer' },
      { email: 'manufacturer@calico.com', password: 'demo123', role: 'Manufacturer' },
      { email: 'trader@calico.com', password: 'demo123', role: 'Trader' },
      { email: 'agent@calico.com', password: 'demo123', role: 'Financial Agent' },
      { email: 'admin@calico.com', password: 'admin123', role: 'Admin' }
    ];
  }
}

// Export singleton but DO NOT auto-initialize
// This allows manual initialization only when needed
export const offlineModeInitializer = OfflineModeInitializer.getInstance();

// Enable offline mode initialization to suppress spurious backend errors
// DISABLED BY DEFAULT based on user request for "actual things"
if (typeof window !== 'undefined') {
  // offlineModeInitializer.initialize(); 
}
