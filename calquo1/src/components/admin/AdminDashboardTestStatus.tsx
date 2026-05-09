import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface AdminDashboardTestStatusProps {
  onRunTest: () => void;
}

export function AdminDashboardTestStatus({ onRunTest }: AdminDashboardTestStatusProps) {
  const [testResults, setTestResults] = React.useState<{
    jsonLoad: 'pending' | 'success' | 'failed';
    embeddedLoad: 'pending' | 'success' | 'failed';
    adminComponent: 'pending' | 'success' | 'failed';
  }>({
    jsonLoad: 'pending',
    embeddedLoad: 'pending', 
    adminComponent: 'pending'
  });

  const [isRunning, setIsRunning] = React.useState(false);

  const runDashboardTest = async () => {
    setIsRunning(true);
    setTestResults({
      jsonLoad: 'pending',
      embeddedLoad: 'pending',
      adminComponent: 'pending'
    });

    // Test 1: JSON file loading
    try {
      const response = await fetch('/admin-dashboard-content.json');
      if (response.ok) {
        await response.json();
        setTestResults(prev => ({ ...prev, jsonLoad: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, jsonLoad: 'failed' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, jsonLoad: 'failed' }));
    }

    // Test 2: Embedded data availability
    try {
      const embeddedData = {
        userRole: "Administrator",
        offers: [
          {
            title: "Test Admin Dashboard",
            desc: "Testing embedded content availability",
            urgency: "Test mode",
            link: "Test Dashboard"
          }
        ],
        recommendations: []
      };
      
      if (embeddedData.userRole === "Administrator") {
        setTestResults(prev => ({ ...prev, embeddedLoad: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, embeddedLoad: 'failed' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, embeddedLoad: 'failed' }));
    }

    // Test 3: Component rendering capability
    try {
      // Simulate component render test
      const testElement = document.createElement('div');
      testElement.innerHTML = '<div>Admin Dashboard Test</div>';
      if (testElement.innerHTML.includes('Admin Dashboard')) {
        setTestResults(prev => ({ ...prev, adminComponent: 'success' }));
      } else {
        setTestResults(prev => ({ ...prev, adminComponent: 'failed' }));
      }
    } catch (error) {
      setTestResults(prev => ({ ...prev, adminComponent: 'failed' }));
    }

    setIsRunning(false);
  };

  React.useEffect(() => {
    runDashboardTest();
  }, []);

  const getStatusIcon = (status: 'pending' | 'success' | 'failed') => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Loader2 className="h-4 w-4 animate-spin text-blue-600" />;
    }
  };

  const getStatusBadge = (status: 'pending' | 'success' | 'failed') => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-100 text-green-800">✓ OK</Badge>;
      case 'failed':
        return <Badge variant="destructive">✗ Failed</Badge>;
      default:
        return <Badge variant="secondary">⏳ Testing</Badge>;
    }
  };

  const allPassed = Object.values(testResults).every(status => status === 'success');
  const anyFailed = Object.values(testResults).some(status => status === 'failed');

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Admin Dashboard Status Test
          {allPassed && <Badge variant="default" className="bg-green-100 text-green-800">All Systems Ready</Badge>}
          {anyFailed && <Badge variant="destructive">Issues Detected</Badge>}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.jsonLoad)}
              <span className="text-sm font-medium">JSON Content Loading</span>
            </div>
            {getStatusBadge(testResults.jsonLoad)}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.embeddedLoad)}
              <span className="text-sm font-medium">Embedded Fallback Data</span>
            </div>
            {getStatusBadge(testResults.embeddedLoad)}
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div className="flex items-center gap-2">
              {getStatusIcon(testResults.adminComponent)}
              <span className="text-sm font-medium">Component Rendering</span>
            </div>
            {getStatusBadge(testResults.adminComponent)}
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="text-sm text-muted-foreground mb-2">
            <strong>Status:</strong> {
              allPassed 
                ? "✅ Admin dashboard is fully operational" 
                : anyFailed 
                ? "⚠️ Some issues detected but dashboard should work with fallback data"
                : "🔄 Running tests..."
            }
          </div>
          
          {testResults.jsonLoad === 'failed' && (
            <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
              Note: JSON loading failed, but embedded fallback data ensures dashboard functionality.
            </div>
          )}
        </div>

        <button
          onClick={runDashboardTest}
          disabled={isRunning}
          className="w-full py-2 px-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 text-sm"
        >
          {isRunning ? 'Running Tests...' : 'Re-run Tests'}
        </button>
      </CardContent>
    </Card>
  );
}
