import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Separator } from '../ui/separator';
import { CheckCircle, XCircle, AlertCircle, Database, RefreshCw, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { firebaseDb, isFirebaseDemoMode } from '../../utils/firebase/config';
import { collection, getDocs, getCountFromServer } from 'firebase/firestore';

interface DatabaseTable {
  name: string;
  exists: boolean;
  rowCount: number;
  description: string;
}

interface DatabaseStatus {
  connected: boolean;
  tablesCreated: boolean;
  demoDataExists: boolean;
  tables: DatabaseTable[];
  error?: string;
}

export function DatabaseSetupManager() {
  const [status, setStatus] = useState<DatabaseStatus>({
    connected: false,
    tablesCreated: false,
    demoDataExists: false,
    tables: []
  });
  const [isChecking, setIsChecking] = useState(false);
  const [isSettingUp, setIsSettingUp] = useState(false);

  const expectedTables = [
    { name: 'companies', description: 'Business registrations and user accounts' },
    { name: 'stock_items', description: 'Product inventory and catalog' },
    { name: 'orders', description: 'Purchase orders and transactions' },
    { name: 'order_items', description: 'Detailed order line items' },
    { name: 'reviews_ratings', description: 'Customer reviews and ratings' },
    { name: 'logistics_partners', description: 'Shipping and delivery partners' },
    { name: 'banners_announcements', description: 'Marketing banners and announcements' },
    { name: 'system_settings', description: 'Application configuration' },
    { name: 'kv_store_e0964a83', description: 'Key-value storage for caching' }
  ];

  // Check database status
  const checkDatabaseStatus = async () => {
    setIsChecking(true);
    try {
      const tables: DatabaseTable[] = [];
      let tablesCreated = false;
      let demoDataExists = false;

      // Skip Firebase operations in demo mode
      if (isFirebaseDemoMode || !firebaseDb) {
        // Return mock data for demo mode
        expectedTables.forEach(table => {
          tables.push({
            name: table.name,
            exists: true,
            rowCount: 10,
            description: table.description
          });
        });
        
        setDbStatus({
          connected: true,
          tablesCreated: true,
          demoDataExists: true,
          tables
        });
        setIsChecking(false);
        return;
      }

      try {
        // Check each expected table in Firestore
        for (const expectedTable of expectedTables) {
          try {
            const collectionRef = collection(firebaseDb, expectedTable.name);
            const snapshot = await getCountFromServer(collectionRef);
            const rowCount = snapshot.data().count;
            
            tables.push({
              name: expectedTable.name,
              exists: true,
              rowCount,
              description: expectedTable.description
            });

            if (expectedTable.name === 'companies' && rowCount > 0) {
              demoDataExists = true;
            }
            
            tablesCreated = true;
          } catch (tableError) {
              tables.push({
                name: expectedTable.name,
                exists: false,
                rowCount: 0,
                description: expectedTable.description
              });
              tablesCreated = false;
            }
          } catch (error) {
            tables.push({
              name: expectedTable.name,
              exists: false,
              rowCount: 0,
              description: expectedTable.description
            });
            tablesCreated = false;
          }
        }

        setStatus({
          connected: true,
          tablesCreated,
          demoDataExists,
          tables
        });
      } else {
        const errorData = await response.json();
        setStatus({
          connected: false,
          tablesCreated: false,
          demoDataExists: false,
          tables: [],
          error: errorData.message || 'Database connection failed'
        });
      }
    } catch (error) {
      setStatus({
        connected: false,
        tablesCreated: false,
        demoDataExists: false,
        tables: [],
        error: error.message || 'Failed to connect to database'
      });
    } finally {
      setIsChecking(false);
    }
  };

  // Copy SQL setup script
  const copySetupScript = () => {
    const setupScript = `-- CALICO Database Setup Script
-- Copy and paste this into your Firebase Console → Firestore Database

-- Run the complete setup script from DATABASE_SETUP_PRODUCTION.sql
-- This will create all necessary collections, indexes, and demo data

-- After running the script, refresh this page to verify the setup`;

    navigator.clipboard.writeText(setupScript).then(() => {
      toast.success('Setup script copied to clipboard!');
    }).catch(() => {
      toast.error('Failed to copy setup script');
    });
  };

  // Run setup (this would ideally call a Firebase function)
  const runDatabaseSetup = async () => {
    setIsSettingUp(true);
    try {
      // For now, we'll show instructions since we can't run setup directly from the frontend
      toast.info('Please configure your Firestore database in Firebase Console', {
        description: 'Navigate to your Firebase project → Firestore Database → create collections',
        duration: 10000
      });
    } catch (error) {
      toast.error('Setup failed: ' + error.message);
    } finally {
      setIsSettingUp(false);
    }
  };

  useEffect(() => {
    checkDatabaseStatus();
  }, []);

  const getStatusIcon = (exists: boolean, rowCount: number) => {
    if (!exists) return <XCircle className="h-4 w-4 text-red-500" />;
    if (rowCount === 0) return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getStatusBadge = (exists: boolean, rowCount: number) => {
    if (!exists) return <Badge variant="destructive">Missing</Badge>;
    if (rowCount === 0) return <Badge variant="outline">Empty</Badge>;
    return <Badge variant="default">Ready ({rowCount} rows)</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Database Setup Manager</h2>
          <p className="text-muted-foreground">
            Verify and set up your CALICO production database
          </p>
        </div>
        <Button 
          onClick={checkDatabaseStatus} 
          disabled={isChecking}
          variant="outline"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Connection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {status.connected ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span className="text-green-700">Connected to Firebase</span>
                <Badge variant="default">Firebase Firestore</Badge>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                <span className="text-red-700">Connection Failed</span>
                {status.error && (
                  <Badge variant="destructive">{status.error}</Badge>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Setup Status */}
      {status.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                {status.tablesCreated ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="font-medium">Tables Created</p>
                  <p className="text-sm text-muted-foreground">
                    {status.tables.filter(t => t.exists).length} of {expectedTables.length}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {status.demoDataExists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">Demo Data</p>
                  <p className="text-sm text-muted-foreground">
                    {status.demoDataExists ? 'Available' : 'Not loaded'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {status.tablesCreated && status.demoDataExists ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium">Ready for Production</p>
                  <p className="text-sm text-muted-foreground">
                    {status.tablesCreated && status.demoDataExists ? 'Yes' : 'Setup required'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tables Status */}
      {status.connected && (
        <Card>
          <CardHeader>
            <CardTitle>Database Tables</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {status.tables.map((table, index) => (
                <div key={table.name} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(table.exists, table.rowCount)}
                    <div>
                      <p className="font-medium">{table.name}</p>
                      <p className="text-sm text-muted-foreground">{table.description}</p>
                    </div>
                  </div>
                  {getStatusBadge(table.exists, table.rowCount)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Setup Actions */}
      {status.connected && !status.tablesCreated && (
        <Card>
          <CardHeader>
            <CardTitle>Database Setup Required</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your database tables need to be created. Follow these steps to set up your CALICO database:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Setup Steps:</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Open your Firebase project dashboard</li>
                  <li>Navigate to the Firestore Database</li>
                  <li>Create the necessary collections and indexes</li>
                  <li>Add demo data to the 'companies' collection</li>
                  <li>Return here and refresh to verify the setup</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Button onClick={copySetupScript} variant="outline">
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Setup Script
                </Button>
                <Button 
                  onClick={runDatabaseSetup} 
                  disabled={isSettingUp}
                  variant="default"
                >
                  {isSettingUp ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Database className="h-4 w-4 mr-2" />
                  )}
                  View Setup Instructions
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Message */}
      {status.connected && status.tablesCreated && status.demoDataExists && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-500" />
              <div>
                <p className="font-medium text-green-900">Database Setup Complete!</p>
                <p className="text-sm text-green-700">
                  Your CALICO database is properly configured and ready for production use.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
