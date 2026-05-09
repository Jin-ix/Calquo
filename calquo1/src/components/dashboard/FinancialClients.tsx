import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Search, Eye, TrendingUp, AlertTriangle, Users, Loader2, ArrowLeft } from 'lucide-react';
import { Input } from '../ui/input';
import { Progress } from '../ui/progress';
import { useAuth } from '../auth/AuthProvider';

interface FinancialClientsProps {
  onBack: () => void;
}

export function FinancialClients({ onBack }: FinancialClientsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    let unsubscribeOrders = () => {};
    let unsubscribeClients = () => {};

    const fetchClients = async () => {
      try {
        const { firebaseDb, isFirebaseDemoMode } = await import('../../utils/firebase/config');
        const { collection, query, where, onSnapshot } = await import('firebase/firestore');

        if (isFirebaseDemoMode || !firebaseDb) {
           console.log('Firebase not connected or in demo mode');
           setClients([]);
           setLoading(false);
           return;
        }

        let allRetailers: any[] = [];
        let allowedClientNames: Set<string> | null = null;

        const updateState = () => {
             if (user?.role === 'financial' && user?.id) {
                 if (allowedClientNames !== null) {
                     const filtered = allRetailers.filter(c => allowedClientNames!.has(c.clientName));
                     setClients(filtered);
                     setLoading(false);
                 }
             } else {
                 setClients(allRetailers);
                 setLoading(false);
             }
        };

        const qClients = query(
            collection(firebaseDb, 'companies'),
            where('role', 'in', ['retailer', 'trader'])
        );

        unsubscribeClients = onSnapshot(qClients, (snapshot) => {
           allRetailers = snapshot.docs.map(doc => {
              const data = doc.data();
              const totalCredit = data.creditLimit || 500000;
              const utilizedCredit = data.creditUtilized || Math.floor(Math.random() * totalCredit);
              
              return {
                id: doc.id,
                clientName: data.company_name || 'Unknown Company',
                totalCredit: totalCredit,
                utilizedCredit: utilizedCredit,
                paymentHistory: data.paymentHistory || 'Good',
                riskScore: data.riskScore || 'A',
                lastTransaction: data.lastTransactionDate ? new Date(data.lastTransactionDate).toLocaleDateString() : 'N/A',
                status: data.status || 'active'
              };
           });
           updateState();
        }, (error) => {
           console.error("Error listening to clients:", error);
           if (user?.role !== 'financial') setLoading(false);
        });

        if (user?.role === 'financial' && user?.id) {
            const qOrders = query(
                collection(firebaseDb, 'orders'),
                where('financialAgentId', '==', user.id)
            );

            unsubscribeOrders = onSnapshot(qOrders, (snapshot) => {
                const names = snapshot.docs.map(doc => doc.data().buyerCompany).filter(Boolean);
                allowedClientNames = new Set(names);
                updateState();
            }, (error) => {
                console.error("Error listening to orders:", error);
                allowedClientNames = new Set();
                updateState();
            });
        }

      } catch (error) {
        console.error("Error fetching clients:", error);
        setClients([]);
        setLoading(false);
      }
    };

    fetchClients();

    return () => {
        unsubscribeOrders();
        unsubscribeClients();
    };
  }, [user]);

  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const filteredClients = clients.filter(client => 
    client.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-500">Monitor client portfolios & credit</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <Input
          type="search"
          placeholder="Search clients..."
          className="md:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Risk Score</TableHead>
                  <TableHead>Credit Utilization</TableHead>
                  <TableHead>Payment History</TableHead>
                  <TableHead>Last Transaction</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-white">
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No clients found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{client.clientName}</TableCell>
                      <TableCell>
                         <Badge variant="secondary" className={client.riskScore === 'A' ? 'bg-green-100 text-green-800' : ''}>
                           Grade {client.riskScore}
                         </Badge>
                      </TableCell>
                      <TableCell className="min-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                             <span>{Math.round((client.utilizedCredit / client.totalCredit) * 100)}%</span>
                             <span className="text-muted-foreground">{formatCurrency(client.utilizedCredit)} / {formatCurrency(client.totalCredit)}</span>
                          </div>
                          <Progress value={(client.utilizedCredit / client.totalCredit) * 100} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={client.paymentHistory === 'Good' ? 'text-green-600 border-green-200' : ''}>
                           {client.paymentHistory}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.lastTransaction}</TableCell>
                      <TableCell className="text-right">
                         <div className="flex justify-end gap-2">
                            <Button size="sm" variant="ghost" title="View Profile">
                               <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost" title="Risk Report">
                               <AlertTriangle className="h-4 w-4" />
                            </Button>
                         </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>
    </div>
  );
}
