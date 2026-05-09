import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { ScrollArea } from '../ui/scroll-area';
import { Loader2, Search, Truck } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firebaseDb } from '../../utils/firebase/config';
import { approvalService } from '../../utils/firebase/approvalService';
import { toast } from 'sonner';

interface LogisticsReselectionModalProps {
  open: boolean;
  onClose: () => void;
  requestId: string;
  onSuccess?: () => void;
}

interface LogisticsAgent {
  id: string;
  name: string;
  mobile?: string;
  gst?: string;
  city?: string;
  state?: string;
}

export function LogisticsReselectionModal({
  open,
  onClose,
  requestId,
  onSuccess
}: LogisticsReselectionModalProps) {
  const [agents, setAgents] = useState<LogisticsAgent[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<LogisticsAgent | null>(null);

  useEffect(() => {
    if (!open || !firebaseDb) return;

    setLoading(true);

    const q = query(
      collection(firebaseDb, 'users'),
      where('role', '==', 'logistics_agent')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const logisticsAgents = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.company_name || data.owner_name || data.displayName || 'Unnamed Agent',
            mobile: data.mobile || data.mobile_number || '',
            gst: data.gstNumber || data.profile?.gstNumber || 'N/A',
            city: data.city || data.profile?.address?.city || '',
            state: data.state || data.profile?.address?.state || '',
          };
        });
        setAgents(logisticsAgents);
        setLoading(false);
      },
      (error) => {
        console.error('Error loading logistics agents:', error);
        setLoading(false);
        toast.error('Failed to load logistics agents');
      }
    );

    return () => unsubscribe();
  }, [open]);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      agent.city?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAgentSelect = (agent: LogisticsAgent) => {
    setSelectedAgentId(agent.id);
    setSelectedAgent(agent);
  };

  const handleSubmit = async () => {
    if (!selectedAgent) {
      toast.error('Please select a logistics agent');
      return;
    }

    setSubmitting(true);

    try {
      await approvalService.reselectLogisticsPartner({
        requestId,
        newLogisticsPartnerId: selectedAgent.id,
        newLogisticsPartnerName: selectedAgent.name,
        newLogisticsPartnerMobile: selectedAgent.mobile,
      });

      toast.success('Logistics agent updated successfully');
      onSuccess?.();
      onClose();
    } catch (error: any) {
      console.error('Error reselecting logistics agent:', error);
      toast.error('Failed to update logistics agent: ' + (error.message || 'Unknown error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-blue-600" />
            Select New Logistics Agent
          </DialogTitle>
          <DialogDescription>
            Choose a new logistics partner to handle delivery for this order
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Agents List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : filteredAgents.length === 0 ? (
            <div className="text-center py-12 border border-dashed rounded-lg bg-gray-50">
              <Truck className="h-16 w-16 mx-auto mb-3 text-gray-300" />
              <p className="text-muted-foreground">No logistics agents found</p>
            </div>
          ) : (
            <RadioGroup value={selectedAgentId} onValueChange={(id) => {
              const agent = agents.find((a) => a.id === id);
              if (agent) handleAgentSelect(agent);
            }}>
              <ScrollArea className="flex-1 pr-4">
                <div className="space-y-2">
                  {filteredAgents.map((agent) => (
                    <div
                      key={agent.id}
                      className={`flex items-start space-x-3 p-4 border-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-all ${
                        selectedAgentId === agent.id
                          ? 'border-blue-600 bg-blue-50/50'
                          : 'border-gray-200'
                      }`}
                      onClick={() => handleAgentSelect(agent)}
                    >
                      <RadioGroupItem value={agent.id} id={agent.id} className="mt-1" />
                      <Label htmlFor={agent.id} className="flex-1 cursor-pointer">
                        <div className="font-semibold text-gray-900">{agent.name}</div>
                        {agent.city && (
                          <div className="text-sm text-muted-foreground mt-0.5">
                            📍 {agent.city}, {agent.state}
                          </div>
                        )}
                        {agent.gst && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            GST: {agent.gst}
                          </div>
                        )}
                        {agent.mobile && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            📞 {agent.mobile}
                          </div>
                        )}
                      </Label>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </RadioGroup>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedAgent || submitting}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Confirm Selection'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
