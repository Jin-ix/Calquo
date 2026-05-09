import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { CreditRequestsTab } from './CreditRequestsTab';
import { FinancialClients } from './FinancialClients'; // Assuming this exists or I should comment it out
import { useAuth } from '../auth/AuthProvider';
import { Briefcase, Building, BarChart3, Calculator } from 'lucide-react';

export function AgentDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('requests');

  return (
    <div className="max-w-7xl mx-auto w-full space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2 text-slate-900">
            <Briefcase className="h-8 w-8 text-orange-600" />
            Financial Agent Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage credit requests, approvals, and client portfolios
          </p>
          {user && (
             <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-md w-fit border">
                <Building className="h-3.5 w-3.5" />
                <span className="font-medium text-foreground">{user.company}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize border border-primary/20">
                   {user.role} Account
                </span>
             </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
          <Button variant="default" size="sm" className="bg-slate-900 text-white hover:bg-slate-800">
            <Calculator className="h-4 w-4 mr-2" />
            Financial Tools
          </Button>
        </div>
      </div>

      <Tabs defaultValue="requests" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-white border">
          <TabsTrigger value="requests">Credit Requests</TabsTrigger>
          <TabsTrigger value="clients">My Clients</TabsTrigger>
          <TabsTrigger value="overview">Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="requests" className="space-y-4">
           <CreditRequestsTab />
        </TabsContent>
        
        <TabsContent value="clients" className="space-y-4">
           {/* Reusing existing FinancialClients component if available, else placeholder */}
           <FinancialClients />
        </TabsContent>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
              <CardDescription>Financial performance summary</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Dashboard overview stats coming soon.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
