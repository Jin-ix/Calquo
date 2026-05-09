import React, { useEffect, useState } from 'react';
import { suppliersAPI } from '../../utils/api';
import { toast } from 'sonner';

interface SuppliersInitializerProps {
  onInitialized?: (count: number) => void;
}

export function SuppliersInitializer({ onInitialized }: SuppliersInitializerProps) {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeSuppliers = async () => {
      if (initialized) return;

      try {
        // Silent check - no logging for expected "backend not deployed" scenario
        const response = await suppliersAPI.getSuppliers();
        
        if (response.success && response.suppliers && response.suppliers.length > 0) {
          // Backend is working and has suppliers
          onInitialized?.(response.suppliers.length);
          setInitialized(true);
          return;
        }

        // If backend is deployed but no suppliers, try migration (silent)
        if (response.success && (!response.suppliers || response.suppliers.length === 0)) {
          const migrationResponse = await suppliersAPI.migrateSuppliers();
          
          if (migrationResponse.success) {
            onInitialized?.(migrationResponse.count);
          }
        }
        
        // If backend is not deployed, fallback data is already being used by components
        // No need to log errors - this is expected until backend is deployed
        setInitialized(true);
      } catch (error) {
        // Silently handle - backend not deployed is expected, components use fallback data
        setInitialized(true);
      }
    };

    // Run initialization after a short delay to avoid blocking the UI
    const timer = setTimeout(initializeSuppliers, 2000);
    
    return () => clearTimeout(timer);
  }, [initialized, onInitialized]);

  // This component doesn't render anything visible
  return null;
}
