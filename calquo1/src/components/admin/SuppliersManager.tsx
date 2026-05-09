import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { 
  Building2, 
  Database, 
  Download, 
  Upload, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  Users,
  ShieldCheck // Added import
} from 'lucide-react';
import { toast } from 'sonner';
import { suppliersAPI } from '../../utils/api';

interface SuppliersManagerProps {
  users?: CompanyUser[];
  onSuppliersUpdate?: () => void;
}

export function SuppliersManager({ users = [], onSuppliersUpdate }: SuppliersManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  // Check suppliers in database
  const checkSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await suppliersAPI.getSuppliers();

      if (data.success && data.suppliers) {
        setSuppliers(data.suppliers);
        setLastChecked(new Date().toLocaleString());
        toast.success(`Found ${data.suppliers.length} suppliers in database`);
      } else {
        setSuppliers([]);
        toast.warning('No suppliers found in database');
      }
    } catch (error) {
      console.error('Error checking suppliers:', error);
      toast.error('Failed to check suppliers');
    } finally {
      setIsLoading(false);
    }
  };

  // Migrate suppliers to database
  const migrateSuppliers = async () => {
    setIsLoading(true);
    try {
      const data = await suppliersAPI.migrateSuppliers();

      if (data.success) {
        toast.success(`Successfully migrated ${data.count || 0} suppliers to database`);
        await checkSuppliers(); // Refresh the list
        onSuppliersUpdate?.();
      } else {
        toast.error(`Migration failed: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error during migration:', error);
      toast.error('Migration failed due to network error');
    } finally {
      setIsLoading(false);
    }
  };

  // Derive suppliers from Users who have the role
  const manufacturerUsers = users.filter(u => ['manufacturer', 'mill', 'factory', 'weaver'].includes((u.business_role || '').toLowerCase().trim()));
  const traderUsers = users.filter(u => ['trader', 'wholesaler', 'distributor'].includes((u.business_role || '').toLowerCase().trim()));
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5" />
          Suppliers Directory Management
        </CardTitle>
        <CardDescription>
          Manage the suppliers database with real Indian textile manufacturers, traders, and financial agents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Display */}
        <div className="flex items-center justify-between p-3 bg-muted/20 rounded-lg">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              <span className="font-medium">Database Status</span>
            </div>
            {lastChecked && (
              <p className="text-sm text-muted-foreground">
                Last checked: {lastChecked}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2">
              {suppliers.length > 0 ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
              )}
              <span className="font-bold">{suppliers.length} suppliers</span>
            </div>
          </div>
        </div>

        {/* Supplier Type Breakdown */}
        {suppliers.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="font-bold text-blue-700">{typeCounts.manufacturers}</div>
              <div className="text-sm text-blue-600">Manufacturers</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="font-bold text-green-700">{typeCounts.traders}</div>
              <div className="text-sm text-green-600">Traders</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="font-bold text-purple-700">{typeCounts.financial}</div>
              <div className="text-sm text-purple-600">Financial Agents</div>
            </div>
          </div>
        )}

        {/* List of Registered Users by Type (New Section) */}
        <div className="grid md:grid-cols-2 gap-6 mt-6">
           {/* Manufacturers List */}
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-base flex items-center gap-2">
                 <Building2 className="h-4 w-4 text-blue-600" />
                 Registered Manufacturers ({manufacturerUsers.length})
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0 max-h-60 overflow-y-auto">
               {manufacturerUsers.length > 0 ? (
                 <div className="divide-y">
                   {manufacturerUsers.map(user => (
                     <div key={user.id} className="p-3 hover:bg-muted/50 text-sm">
                       <div className="font-medium flex items-center gap-1">
                          {user.company_name || user.owner_name}
                          {user.is_verified && <ShieldCheck className="h-3 w-3 text-blue-600 fill-blue-100" />}
                       </div>
                       <div className="text-xs text-muted-foreground flex justify-between mt-1">
                         <span>{user.city}, {user.state}</span>
                         <Badge variant="outline" className="text-[10px] h-5">{user.business_role}</Badge>
                       </div>
                       <div className="text-xs text-muted-foreground mt-1">GST: {user.gst_number}</div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="p-4 text-center text-sm text-muted-foreground">No manufacturers registered</div>
               )}
             </CardContent>
           </Card>

           {/* Traders List */}
           <Card>
             <CardHeader className="pb-3">
               <CardTitle className="text-base flex items-center gap-2">
                 <Users className="h-4 w-4 text-green-600" />
                 Registered Traders ({traderUsers.length})
               </CardTitle>
             </CardHeader>
             <CardContent className="p-0 max-h-60 overflow-y-auto">
               {traderUsers.length > 0 ? (
                 <div className="divide-y">
                   {traderUsers.map(user => (
                     <div key={user.id} className="p-3 hover:bg-muted/50 text-sm">
                       <div className="font-medium flex items-center gap-1">
                          {user.company_name || user.owner_name}
                          {user.is_verified && <ShieldCheck className="h-3 w-3 text-blue-600 fill-blue-100" />}
                       </div>
                       <div className="text-xs text-muted-foreground flex justify-between mt-1">
                         <span>{user.city}, {user.state}</span>
                         <Badge variant="outline" className="text-[10px] h-5">{user.business_role}</Badge>
                       </div>
                       <div className="text-xs text-muted-foreground mt-1">GST: {user.gst_number}</div>
                     </div>
                   ))}
                 </div>
               ) : (
                 <div className="p-4 text-center text-sm text-muted-foreground">No traders registered</div>
               )}
             </CardContent>
           </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            onClick={checkSuppliers} 
            disabled={isLoading}
            variant="outline"
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Check Database
          </Button>
          
          <Button 
            onClick={migrateSuppliers} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Migrate Suppliers
          </Button>
        </div>

        {/* Information */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Migration includes:</strong> 22 real Indian textile companies including major manufacturers 
            (Arvind, Welspun, Raymond, Vardhman), established traders (Gujarat Cooperative Cotton, Mahavir Spinning Mills), 
            and financial agents specializing in textile trade finance.
          </AlertDescription>
        </Alert>

        {suppliers.length === 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              No suppliers found in database. Click "Migrate Suppliers" to populate the database with 
              comprehensive Indian textile industry data.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
