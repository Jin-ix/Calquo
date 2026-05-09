import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { useLanguage } from '../context/LanguageProvider';
import { useAuth } from '../auth/AuthProvider';
import { PurchaseRequest } from './PurchaseRequestsTable';
import { AlertTriangle, MessageSquare, CheckCircle, Info } from 'lucide-react';

interface StatusUpdateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseRequest: PurchaseRequest;
  availableStatuses: PurchaseRequest['status'][];
  onUpdateStatus: (newStatus: PurchaseRequest['status'], remarks: string, waybillNumber?: string) => void;
}

const statusConfig = {
  'PR-Created': { label: 'Created', color: 'bg-blue-100 text-blue-800', icon: Info },
  'PR-Acknowledged': { label: 'Acknowledged', color: 'bg-orange-100 text-orange-800', icon: CheckCircle },
  'PR-PaymentDone': { label: 'Payment Done', color: 'bg-purple-100 text-purple-800', icon: CheckCircle },
  'PR-PaymentValidated': { label: 'Payment Validated', color: 'bg-indigo-100 text-indigo-800', icon: CheckCircle },
  'PR-ItemShipped': { label: 'Item Shipped', color: 'bg-yellow-100 text-yellow-800', icon: CheckCircle },
  'PR-ItemCollected': { label: 'Item Collected', color: 'bg-amber-100 text-amber-800', icon: CheckCircle },
  'PR-ItemInTransit': { label: 'Item In Transit', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  'PR-ItemReceived': { label: 'Item Received', color: 'bg-cyan-100 text-cyan-800', icon: CheckCircle },
  'PR-ItemVerified': { label: 'Item Verified', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  'PR-ItemReturned-F': { label: 'Returned (Full)', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  'PR-ItemReturned-P': { label: 'Returned (Partial)', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
};

const statusDescriptions = {
  'PR-Acknowledged': 'Confirm that you have received and acknowledged this purchase request.',
  'PR-PaymentDone': 'Confirm that payment has been made for this purchase request.',
  'PR-PaymentValidated': 'Confirm that you have received and validated the payment.',
  'PR-ItemShipped': 'Confirm that the items have been shipped and assigned to logistics partner.',
  'PR-ItemCollected': 'Confirm that you have collected the items from the supplier.',
  'PR-ItemInTransit': 'Confirm that the items are now in transit with a waybill number.',
  'PR-ItemReceived': 'Confirm that you have received the shipped items.',
  'PR-ItemVerified': 'Confirm that the received items meet quality standards and specifications.',
  'PR-ItemReturned-F': 'Return the full order due to quality issues or other problems.',
  'PR-ItemReturned-P': 'Return part of the order due to quality issues or other problems.'
};

export function StatusUpdateDialog({
  isOpen,
  onClose,
  purchaseRequest,
  availableStatuses,
  onUpdateStatus
}: StatusUpdateDialogProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<PurchaseRequest['status'] | ''>('');
  const [remarks, setRemarks] = useState('');
  const [waybillNumber, setWaybillNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStatus || !remarks.trim()) {
      return;
    }

    if (remarks.trim().split(/\s+/).length > 100) {
      return;
    }

    // Validate waybill number for transit status
    if (selectedStatus === 'PR-ItemInTransit' && !waybillNumber.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      onUpdateStatus(
        selectedStatus as PurchaseRequest['status'], 
        remarks.trim(),
        waybillNumber.trim() || undefined
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStatus('');
    setRemarks('');
    setWaybillNumber('');
    onClose();
  };

  const wordCount = remarks.trim().split(/\s+/).filter(word => word.length > 0).length;
  const isRemarksValid = wordCount > 0 && wordCount <= 100;
  const isWaybillRequired = selectedStatus === 'PR-ItemInTransit';
  const isWaybillValid = !isWaybillRequired || waybillNumber.trim().length > 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-bold mb-2">Update Purchase Request Status</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Request ID: {purchaseRequest.id}</span>
              <span>•</span>
              <span>{purchaseRequest.stockItemName}</span>
            </div>
          </div>

          {/* Current Status */}
          <div className="space-y-2">
            <Label>Current Status</Label>
            <div className="flex items-center gap-2">
              <Badge className={statusConfig[purchaseRequest.status].color}>
                {statusConfig[purchaseRequest.status].label}
              </Badge>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Status Selection */}
            <div className="space-y-2">
              <Label htmlFor="status">New Status *</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select new status" />
                </SelectTrigger>
                <SelectContent>
                  {availableStatuses.map((status) => {
                    const Icon = statusConfig[status].icon;
                    return (
                      <SelectItem key={status} value={status}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          {statusConfig[status].label}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              
              {selectedStatus && statusDescriptions[selectedStatus] && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    {statusDescriptions[selectedStatus]}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Waybill Number (for Transit Status) */}
            {isWaybillRequired && (
              <div className="space-y-2">
                <Label htmlFor="waybill">Waybill Number *</Label>
                <Input
                  id="waybill"
                  value={waybillNumber}
                  onChange={(e) => setWaybillNumber(e.target.value)}
                  placeholder="Enter waybill/tracking number"
                  className="font-mono"
                />
                {isWaybillRequired && !isWaybillValid && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Waybill number is required for transit status.
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Remarks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="remarks">Remarks *</Label>
                <span className={`text-sm ${wordCount > 100 ? 'text-red-500' : wordCount > 80 ? 'text-orange-500' : 'text-muted-foreground'}`}>
                  {wordCount}/100 words
                </span>
              </div>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Provide details about this status update (required, max 100 words)"
                className="min-h-[100px] resize-none"
                maxLength={1000} // Character limit to prevent extremely long text
              />
              
              {remarks && !isRemarksValid && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {wordCount === 0 
                      ? "Remarks are required for status updates."
                      : "Remarks must not exceed 100 words."
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Deadline Warning for Item Received Status */}
            {purchaseRequest.status === 'PR-ItemReceived' && selectedStatus && ['PR-ItemVerified', 'PR-ItemReturned-F', 'PR-ItemReturned-P'].includes(selectedStatus) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Verification Deadline:</strong> You have {purchaseRequest.daysUntilVerificationDeadline || 0} days remaining to verify or return the items.
                </AlertDescription>
              </Alert>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!selectedStatus || !isRemarksValid || !isWaybillValid || isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? 'Updating...' : 'Update Status'}
              </Button>
            </div>
          </form>

          {/* Status History Preview */}
          {purchaseRequest.statusHistory.length > 0 && (
            <div className="border-t pt-4">
              <Label className="mb-3 block">Recent Status History</Label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {purchaseRequest.statusHistory.slice(-3).reverse().map((history, index) => (
                  <div key={index} className="flex items-start gap-3 p-2 bg-muted rounded text-sm">
                    <Badge className={`${statusConfig[history.status].color} text-xs`}>
                      {statusConfig[history.status].label}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{history.updatedBy}</p>
                      <p className="text-muted-foreground text-xs">
                        {new Date(history.updatedDate).toLocaleDateString('en-IN')}
                      </p>
                      {history.remarks && (
                        <p className="text-xs mt-1 line-clamp-2">{history.remarks}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
