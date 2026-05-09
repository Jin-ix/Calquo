import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { suppliersAPI } from '../../utils/api';
import { toast } from 'sonner';
import { Database, Upload, CheckCircle, Users } from 'lucide-react';

export function SuppliersDataSetup() {
  const [loading, setLoading] = useState(false);
  const [suppliersCount, setSuppliersCount] = useState<number | null>(null);
  const [migrationStatus, setMigrationStatus] = useState<'pending' | 'completed' | 'error'>('pending');

  const checkSuppliersData = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.getSuppliers();
      
      if (response.success) {
        setSuppliersCount(response.count || response.suppliers?.length || 0);
        setMigrationStatus(response.suppliers?.length > 0 ? 'completed' : 'pending');
        toast.success(`Found ${response.suppliers?.length || 0} suppliers in database`);
      } else {
        setMigrationStatus('error');
        toast.error('Failed to check suppliers data');
      }
    } catch (error) {
      console.error('Check suppliers error:', error);
      setMigrationStatus('error');
      toast.error('Error checking suppliers data');
    } finally {
      setLoading(false);
    }
  };

  const migrateSuppliersData = async () => {
    try {
      setLoading(true);
      const response = await suppliersAPI.migrateSuppliers();
      
      if (response.success) {
        setSuppliersCount(response.count);
        setMigrationStatus('completed');
        toast.success(`Successfully migrated ${response.count} suppliers to database`);
      } else {
        setMigrationStatus('error');
        toast.error('Failed to migrate suppliers data');
      }
    } catch (error) {
      console.error('Migration error:', error);
      setMigrationStatus('error');
      toast.error('Error during suppliers migration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Suppliers Database Setup
        </CardTitle>
        <CardDescription>
          Initialize and manage the suppliers database for the CALICO platform
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <h3 className="font-medium">Database Status</h3>
            <p className="text-sm text-muted-foreground">
              {suppliersCount !== null 
                ? `${suppliersCount} suppliers currently in database`
                : 'Database status unknown'
              }
            </p>
          </div>
          <Badge variant={
            migrationStatus === 'completed' ? 'default' :
            migrationStatus === 'error' ? 'destructive' : 'secondary'
          }>
            {migrationStatus === 'completed' && <CheckCircle className="h-3 w-3 mr-1" />}
            {migrationStatus === 'completed' ? 'Ready' : 
             migrationStatus === 'error' ? 'Error' : 'Pending'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex gap-2">
            <Button
              onClick={checkSuppliersData}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <Users className="h-4 w-4 mr-2" />
              {loading ? 'Checking...' : 'Check Database'}
            </Button>
            
            <Button
              onClick={migrateSuppliersData}
              disabled={loading}
              className="flex-1"
            >
              <Upload className="h-4 w-4 mr-2" />
              {loading ? 'Migrating...' : 'Migrate Suppliers'}
            </Button>
          </div>
          
          {migrationStatus === 'completed' && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-sm text-green-800">
                ✅ Suppliers database is ready with {suppliersCount} suppliers from major Indian textile companies
              </p>
            </div>
          )}
          
          {migrationStatus === 'error' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">
                ❌ There was an issue with the suppliers database. Please check the logs and try again.
              </p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <h4 className="font-medium mb-2">What this migration includes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Real Indian textile manufacturers (Arvind, Welspun, Vardhman, etc.)</li>
            <li>• Major textile traders and wholesalers</li>
            <li>• Financial service providers for B2B textile trade</li>
            <li>• Verified GST numbers and contact information</li>
            <li>• Product specialties and ratings</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
