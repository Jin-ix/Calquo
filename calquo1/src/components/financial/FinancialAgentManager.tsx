import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  CreditCard, 
  Phone, 
  MapPin, 
  ShieldCheck,
  Building2,
  Wallet
} from 'lucide-react';
import { CompanyUser } from '../admin/UserManagement';

interface FinancialAgentManagerProps {
  users: CompanyUser[];
}

export function FinancialAgentManager({ users }: FinancialAgentManagerProps) {
  // Filter for financial agents
  const financialAgents = users.filter(u => {
    const role = (u.business_role || '').toLowerCase().trim();
    return role === 'financial' || role.includes('finance');
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Financial Agents</h2>
          <p className="text-muted-foreground">
            Manage registered financial partners and trade finance agents
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-5 w-5 text-yellow-600" />
            Registered Financial Agents ({financialAgents.length})
          </CardTitle>
          <CardDescription>
            These agents provide trade finance and credit services to the platform.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {financialAgents.length > 0 ? (
            <div className="divide-y">
              {financialAgents.map(user => (
                <div key={user.id} className="p-4 hover:bg-muted/50 text-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-medium text-base flex items-center gap-1">
                       {user.company_name || user.owner_name}
                       {user.is_verified && <ShieldCheck className="h-4 w-4 text-blue-600 fill-blue-100" />}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs">
                       <Badge variant="outline" className="h-5 bg-yellow-50 text-yellow-700 border-yellow-200">
                         {user.business_role}
                       </Badge>
                       <span>•</span>
                       <span>GST: {user.gst_number || 'N/A'}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end gap-1 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{user.city}, {user.state}</span>
                    </div>
                    <div className="flex items-center gap-1">
                       <Phone className="h-3 w-3" />
                       <span>{user.mobile}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No users registered with 'Financial' role found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
