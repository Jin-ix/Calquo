import React from 'react';
import { HomePage } from '../home/HomePage';

interface SimpleMobileWrapperProps {
  user: any;
}

export function SimpleMobileWrapper({ user }: SimpleMobileWrapperProps) {
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">CALICO Mobile</h1>
        <p className="text-sm text-muted-foreground">Welcome, {user?.role || 'User'}</p>
      </div>
      <HomePage />
    </div>
  );
}
