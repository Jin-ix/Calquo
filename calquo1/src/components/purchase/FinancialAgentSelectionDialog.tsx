
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { User } from '../auth/AuthProvider';
import { Check, Search, Shield } from 'lucide-react';
import { Input } from '../ui/input';

interface FinancialAgentSelectionDialogProps {
  open: boolean;
  onClose: () => void;
  onSelect: (agent: { id: string; name: string }) => void;
}

export function FinancialAgentSelectionDialog({ open, onClose, onSelect }: FinancialAgentSelectionDialogProps) {
  const [agents, setAgents] = useState<{ id: string; name: string; company: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchAgents();
    }
  }, [open]);

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // In a real app, query Firestore. For demo/proto, we can also mock if needed.
      // Trying Firestore first
      const q = query(collection(firebaseDb, 'users'), where('role', '==', 'financial'));
      const querySnapshot = await getDocs(q);
      
      const fetchedAgents = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || data.profile?.fullName || 'Financial Agent',
          company: data.company || 'Finance Corp'
        };
      });

      // If no agents found (empty DB or demo mode), add mock agents
      if (fetchedAgents.length === 0) {
        fetchedAgents.push(
          { id: 'agent-1', name: 'Bajaj Finance', company: 'Bajaj Finserv' },
          { id: 'agent-2', name: 'Chola Finance', company: 'Cholamandalam' },
          { id: 'agent-3', name: 'HDFC Corp', company: 'HDFC Ergo' }
        );
      }

      setAgents(fetchedAgents);
    } catch (error) {
      console.error('Error fetching agents:', error);
      // Fallback
      setAgents([
        { id: 'agent-1', name: 'Bajaj Finance', company: 'Bajaj Finserv' },
        { id: 'agent-2', name: 'Chola Finance', company: 'Cholamandalam' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    agent.company.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleConfirm = () => {
    const agent = agents.find(a => a.id === selectedAgentId);
    if (agent) {
      onSelect(agent);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Select Financial Agent</DialogTitle>
          <DialogDescription>
            Choose a financial agent to handle payment for this order.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search agents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {loading ? (
              <p className="text-center text-sm text-muted-foreground py-4">Loading agents...</p>
            ) : filteredAgents.length > 0 ? (
              filteredAgents.map(agent => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedAgentId(agent.id)}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${
                    selectedAgentId === agent.id 
                      ? 'border-blue-600 bg-blue-50 ring-1 ring-blue-600' 
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback className="bg-blue-100 text-blue-700">
                      {agent.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{agent.name}</h4>
                    <p className="text-xs text-muted-foreground">{agent.company}</p>
                  </div>
                  {selectedAgentId === agent.id && (
                    <Check className="h-5 w-5 text-blue-600" />
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground py-4">No agents found</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleConfirm} disabled={!selectedAgentId}>
            Confirm Selection
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
