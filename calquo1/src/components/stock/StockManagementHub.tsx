/**
 * StockManagementHub - Central hub for stock management
 * Integrates BrowseStockView and MyStockView with AddStockWizard
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { BrowseStockView } from '../views/BrowseStockView';
import { MyStockView } from '../views/MyStockView';
import { AddStockWizard } from './AddStockWizard';
import { useAuth } from '../auth/AuthProvider';
import { Badge } from '../ui/badge';
import { useStock } from '../context/StockContext';

export function StockManagementHub() {
  const { user } = useAuth();
  const { isFirebaseSync } = useStock();
  const [activeTab, setActiveTab] = useState<'browse' | 'my-stock' | 'add-stock'>('browse');
  const [isAddingStock, setIsAddingStock] = useState(false);

  // Handle stock submission from AddStockWizard
  const handleStockSubmit = (stockData: any) => {
    console.log('✅ Stock submitted:', stockData);
    // Firebase listener will automatically update BrowseStockView and MyStockView
    setIsAddingStock(false);
    setActiveTab('my-stock');
  };

  // Navigate to add stock
  const handleAddStock = () => {
    setActiveTab('add-stock');
    setIsAddingStock(true);
  };

  // If in add stock mode, show the wizard
  if (isAddingStock) {
    return (
      <AddStockWizard
        onSubmit={handleStockSubmit}
        onCancel={() => {
          setIsAddingStock(false);
          setActiveTab('my-stock');
        }}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Firebase Sync Status Indicator */}
      {isFirebaseSync && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>Live sync active</span>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">
            Browse All Stock
          </TabsTrigger>
          <TabsTrigger value="my-stock">
            My Stock
          </TabsTrigger>
          <TabsTrigger value="add-stock">
            Add Stock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <BrowseStockView
            onViewDetails={(stock) => {
              console.log('View details:', stock);
              // Implement detail view
            }}
            onAddToCart={(stock) => {
              console.log('Add to cart:', stock);
              // Implement cart functionality
            }}
          />
        </TabsContent>

        <TabsContent value="my-stock" className="mt-6">
          <MyStockView
            onAddStock={handleAddStock}
            onEditStock={(stock) => {
              console.log('Edit stock:', stock);
              // Implement edit functionality
            }}
            onViewDetails={(stock) => {
              console.log('View details:', stock);
              // Implement detail view
            }}
          />
        </TabsContent>

        <TabsContent value="add-stock" className="mt-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">
              Click below to start adding a new stock item
            </p>
            <button
              onClick={handleAddStock}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90"
            >
              Start Adding Stock
            </button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
