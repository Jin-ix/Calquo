import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { collection, getDocs, query, where, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { toast } from 'sonner';

export function LogisticsDebugger() {
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [logisticsUsers, setLogisticsUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [useRealtime, setUseRealtime] = useState(false);

  // Method 1: Get all users (no query filter)
  const fetchAllUsers = async () => {
    setLoading(true);
    setError('');
    try {
      if (!firebaseDb) {
        throw new Error('Firebase DB not initialized');
      }

      console.log('🔍 Fetching ALL users...');
      const usersRef = collection(firebaseDb, 'users');
      const snapshot = await getDocs(usersRef);
      
      console.log('📊 Total users found:', snapshot.size);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setAllUsers(users);
      
      // Filter logistics users manually
      const logistics = users.filter((u: any) => u.role === 'logistics_agent');
      console.log('🚚 Logistics agents found (manual filter):', logistics.length);
      console.log('Logistics data:', logistics);
      
      toast.success(`Found ${users.length} total users, ${logistics.length} logistics agents`);
    } catch (err: any) {
      console.error('❌ Error fetching users:', err);
      setError(err.message);
      toast.error('Failed to fetch users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Method 2: Query with where clause
  const fetchLogisticsWithQuery = async () => {
    setLoading(true);
    setError('');
    try {
      if (!firebaseDb) {
        throw new Error('Firebase DB not initialized');
      }

      console.log('🔍 Querying logistics agents...');
      const usersRef = collection(firebaseDb, 'users');
      const logisticsQuery = query(usersRef, where('role', '==', 'logistics_agent'));
      
      const snapshot = await getDocs(logisticsQuery);
      console.log('📊 Logistics query results:', snapshot.size);
      
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setLogisticsUsers(users);
      console.log('Logistics users:', users);
      
      toast.success(`Query found ${users.length} logistics agents`);
    } catch (err: any) {
      console.error('❌ Error querying logistics:', err);
      setError(err.message);
      
      // Check if it's an index error
      if (err.message.includes('index')) {
        toast.error('Firestore Index Required! Check console for link.');
      } else {
        toast.error('Query failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Method 3: Real-time listener
  useEffect(() => {
    if (!useRealtime || !firebaseDb) return;

    console.log('🔄 Setting up real-time listener...');
    const usersRef = collection(firebaseDb, 'users');
    const logisticsQuery = query(usersRef, where('role', '==', 'logistics_agent'));

    const unsubscribe = onSnapshot(
      logisticsQuery,
      (snapshot) => {
        console.log('📡 Real-time update! Documents:', snapshot.size);
        const users = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setLogisticsUsers(users);
        toast.success(`Real-time: ${users.length} logistics agents`);
      },
      (err) => {
        console.error('❌ Real-time listener error:', err);
        setError(err.message);
        toast.error('Real-time error: ' + err.message);
      }
    );

    return () => {
      console.log('🧹 Cleaning up real-time listener');
      unsubscribe();
    };
  }, [useRealtime]);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>🔧 Logistics Debugger</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            <Button onClick={fetchAllUsers} disabled={loading}>
              Fetch All Users
            </Button>
            <Button onClick={fetchLogisticsWithQuery} disabled={loading}>
              Query Logistics
            </Button>
            <Button 
              onClick={() => setUseRealtime(!useRealtime)}
              variant={useRealtime ? "destructive" : "default"}
            >
              {useRealtime ? 'Stop' : 'Start'} Real-time
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2 text-sm text-gray-600">Loading...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
              <p className="font-semibold">Error:</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          {allUsers.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded p-4">
              <h3 className="font-semibold mb-2">All Users ({allUsers.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {allUsers.map(user => (
                  <div key={user.id} className="bg-white p-2 rounded text-sm">
                    <div className="font-semibold">{user.owner_name || user.email || user.id}</div>
                    <div className="text-gray-600">
                      Role: <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">{user.role || 'none'}</span>
                    </div>
                    {user.state && <div className="text-gray-600">State: {user.state}</div>}
                    {user.mobile && <div className="text-gray-600">Mobile: {user.mobile}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {logisticsUsers.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded p-4">
              <h3 className="font-semibold mb-2">Logistics Agents ({logisticsUsers.length})</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {logisticsUsers.map(user => (
                  <div key={user.id} className="bg-white p-2 rounded text-sm">
                    <div className="font-semibold">{user.owner_name || user.email || user.id}</div>
                    <div className="text-gray-600">ID: {user.id}</div>
                    {user.state && <div className="text-gray-600">State: {user.state}</div>}
                    {user.mobile && <div className="text-gray-600">Mobile: {user.mobile}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
            <h4 className="font-semibold mb-2">🔍 Checklist:</h4>
            <ul className="text-sm space-y-1 list-disc list-inside">
              <li>Firebase DB initialized: {firebaseDb ? '✅' : '❌'}</li>
              <li>Users collection exists: Check Firestore console</li>
              <li>Documents have 'role' field: {allUsers.some(u => u.role) ? '✅' : '❌ (if users loaded)'}</li>
              <li>Any user has role='logistics_agent': {allUsers.some(u => u.role === 'logistics_agent') ? '✅' : '❌'}</li>
            </ul>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded p-4">
            <h4 className="font-semibold mb-2">📝 Expected Data Structure:</h4>
            <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
{`{
  id: "user_123",
  role: "logistics_agent",
  owner_name: "ABC Logistics",
  email: "abc@example.com",
  state: "Maharashtra",
  mobile: "9876543210"
}`}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
