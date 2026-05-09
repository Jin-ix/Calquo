import React from 'react';
import { SuppliersDataSetup } from './SuppliersDataSetup';

export function SuppliersSetupPage() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">CALICO Admin Setup</h1>
          <p className="text-muted-foreground">Initialize the suppliers database for the platform</p>
        </div>
        
        <SuppliersDataSetup />
        
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            After migrating suppliers data, the Suppliers Directory will show real Indian textile companies
          </p>
        </div>
      </div>
    </div>
  );
}
