import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Store, CreditCard, ArrowRight, Building2 } from 'lucide-react';
import { UserRole } from './AuthProvider';

interface RoleSelectorScreenProps {
  companyName: string;
  onSelectRole: (role: UserRole) => void;
}

export function RoleSelectorScreen({ companyName, onSelectRole }: RoleSelectorScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="max-w-4xl w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-block p-3 bg-white rounded-2xl shadow-sm mb-4">
            <Building2 className="h-8 w-8 text-[#FF8C42]" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {companyName}</h1>
          <p className="text-lg text-slate-500">How would you like to log in today?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {/* Trader / Retailer Option */}
          <Card 
            className="cursor-pointer hover:border-orange-200 hover:shadow-md transition-all group relative overflow-hidden border-2 border-transparent hover:border-orange-500/20"
            onClick={() => onSelectRole('retailer')} // Defaulting to retailer for the trading side
          >
            <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="h-20 w-20 bg-orange-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Store className="h-10 w-10 text-orange-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Trader / Retailer</h3>
                <p className="text-slate-500 mt-2">
                  Access the marketplace to buy or sell textile stocks. Manage orders and inventory.
                </p>
              </div>
              <Button 
                className="w-full mt-4 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 group-hover:bg-orange-600 group-hover:text-white group-hover:border-orange-600 transition-all"
              >
                Continue as Trader
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Financial Agent Option */}
          <Card 
            className="cursor-pointer hover:border-blue-200 hover:shadow-md transition-all group relative overflow-hidden border-2 border-transparent hover:border-blue-500/20"
            onClick={() => onSelectRole('financial')}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-8 flex flex-col items-center text-center space-y-4 relative z-10">
              <div className="h-20 w-20 bg-blue-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <CreditCard className="h-10 w-10 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-900">Financial Agent</h3>
                <p className="text-slate-500 mt-2">
                  Manage credit requests, approve financing for orders, and view client portfolios.
                </p>
              </div>
              <Button 
                className="w-full mt-4 bg-white text-slate-900 border border-slate-200 hover:bg-slate-50 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all"
              >
                Continue as Financial Agent
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
        
        <p className="text-center text-sm text-slate-400">
          You can switch roles later from your profile settings.
        </p>
      </div>
    </div>
  );
}
