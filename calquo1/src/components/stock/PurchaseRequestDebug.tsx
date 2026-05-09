import React, { useEffect } from 'react';

interface DebugProps {
  checkoutPhase: 'summary' | 'checkout';
  createdRequest: any;
  selections: any;
  totalSelectedQty: number;
}

export function PurchaseRequestDebug({ checkoutPhase, createdRequest, selections, totalSelectedQty }: DebugProps) {
  useEffect(() => {
    console.log('🔍 ===== PURCHASE REQUEST DEBUG =====');
    console.log('Checkout Phase:', checkoutPhase);
    console.log('Created Request:', createdRequest);
    console.log('Selections:', selections);
    console.log('Total Selected Qty:', totalSelectedQty);
    console.log('====================================');
  }, [checkoutPhase, createdRequest, selections, totalSelectedQty]);

  return null;
}
