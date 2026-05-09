import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { StatusUpdateDialog } from './StatusUpdateDialog';
import { useLanguage } from '../context/LanguageProvider';
import { useAuth } from '../auth/AuthProvider';
import { Package, Clock, MessageSquare, Eye } from 'lucide-react';
import { getSafeString } from '../../utils/stringUtils';

export interface PurchaseRequest {
  id: string;
  stockItemId: string;
  stockItemName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  buyerCompany: string;
  buyerGstNumber: string;
  sellerCompany: string;
  sellerGstNumber: string;
  status: 'PR-Created' | 'PR-Acknowledged' | 'PR-PaymentDone' | 'PR-PaymentValidated' | 'PR-ItemShipped' | 'PR-ItemCollected' | 'PR-ItemInTransit' | 'PR-ItemReceived' | 'PR-ItemVerified' | 'PR-ItemReturned-F' | 'PR-ItemReturned-P';
  createdDate: string;
  lastUpdated: string;
  statusHistory: {
    status: PurchaseRequest['status'];
    updatedBy: string;
    updatedDate: string;
    remarks: string;
    waybillNumber?: string;
  }[];
  daysUntilVerificationDeadline?: number;
  logisticsPartner?: string;
  waybillNumber?: string;
}

interface PurchaseRequestsTableProps {
  title: string;
  purchaseRequests: PurchaseRequest[];
  onUpdateStatus: (requestId: string, newStatus: PurchaseRequest['status'], remarks: string) => void;
  showBuyerColumn?: boolean;
  showSellerColumn?: boolean;
}

const statusConfig = {
  'PR-Created': { label: 'Created', color: 'bg-blue-100 text-blue-800', priority: 1 },
  'PR-Acknowledged': { label: 'Acknowledged', color: 'bg-orange-100 text-orange-800', priority: 2 },
  'PR-PaymentDone': { label: 'Payment Done', color: 'bg-purple-100 text-purple-800', priority: 3 },
  'PR-PaymentValidated': { label: 'Payment Validated', color: 'bg-indigo-100 text-indigo-800', priority: 4 },
  'PR-ItemShipped': { label: 'Item Shipped', color: 'bg-yellow-100 text-yellow-800', priority: 5 },
  'PR-ItemCollected': { label: 'Item Collected', color: 'bg-amber-100 text-amber-800', priority: 6 },
  'PR-ItemInTransit': { label: 'Item In Transit', color: 'bg-blue-100 text-blue-800', priority: 7 },
  'PR-ItemReceived': { label: 'Item Received', color: 'bg-cyan-100 text-cyan-800', priority: 8 },
  'PR-ItemVerified': { label: 'Item Verified', color: 'bg-green-100 text-green-800', priority: 9 },
  'PR-ItemReturned-F': { label: 'Returned (Full)', color: 'bg-red-100 text-red-800', priority: 9 },
  'PR-ItemReturned-P': { label: 'Returned (Partial)', color: 'bg-red-100 text-red-800', priority: 9 }
};

export function PurchaseRequestsTable({ 
  title, 
  purchaseRequests, 
  onUpdateStatus, 
  showBuyerColumn = false, 
  showSellerColumn = false 
}: PurchaseRequestsTableProps) {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<PurchaseRequest | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);

  const getAvailableActions = (request: PurchaseRequest, userRole: string, userCompany: string): PurchaseRequest['status'][] => {
    const isBuyer = request.buyerCompany === userCompany;
    const isSeller = request.sellerCompany === userCompany;
    const isLogistics = userRole === 'logistics' && request.logisticsPartner === userCompany;

    if (!isBuyer && !isSeller && !isLogistics) return [];

    switch (request.status) {
      case 'PR-Created':
        return isSeller ? ['PR-Acknowledged'] : [];
      case 'PR-Acknowledged':
        return isBuyer ? ['PR-PaymentDone'] : [];
      case 'PR-PaymentDone':
        return isSeller ? ['PR-PaymentValidated'] : [];
      case 'PR-PaymentValidated':
        return isSeller ? ['PR-ItemShipped'] : [];
      case 'PR-ItemShipped':
        return isLogistics ? ['PR-ItemCollected'] : [];
      case 'PR-ItemCollected':
        return isLogistics ? ['PR-ItemInTransit'] : [];
      case 'PR-ItemInTransit':
        return isBuyer ? ['PR-ItemReceived'] : [];
      case 'PR-ItemReceived':
        if (isBuyer && (request.daysUntilVerificationDeadline ?? 0) > 0) {
          return ['PR-ItemVerified', 'PR-ItemReturned-F', 'PR-ItemReturned-P'];
        }
        return [];
      default:
        return [];
    }
  };

  const handleStatusUpdate = (newStatus: PurchaseRequest['status'], remarks: string) => {
    if (selectedRequest) {
      onUpdateStatus(selectedRequest.id, newStatus, remarks);
      setShowStatusDialog(false);
      setSelectedRequest(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const isUrgent = (request: PurchaseRequest) => {
    return request.status === 'PR-ItemReceived' && (request.daysUntilVerificationDeadline ?? 0) <= 3;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="text-sm text-muted-foreground">
          Total: {purchaseRequests.length} requests
        </div>
      </div>

      {purchaseRequests.length === 0 ? (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center">
              <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No purchase requests found</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Purchase Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Amount</TableHead>
                  {showBuyerColumn && <TableHead>Buyer</TableHead>}
                  {showSellerColumn && <TableHead>Seller</TableHead>}
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {purchaseRequests.map((request) => {
                  const availableActions = getAvailableActions(request, user?.role || '', user?.company || '');
                  const urgent = isUrgent(request);
                  
                  return (
                    <TableRow key={request.id} className={urgent ? 'bg-red-50 border-red-200' : ''}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{getSafeString(request.stockItemName)}</p>
                          <p className="text-sm text-muted-foreground">ID: {request.id}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">{request.quantity}</span>
                          <span className="text-sm text-muted-foreground">units</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">₹{request.totalAmount.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">@ ₹{request.unitPrice}/unit</p>
                        </div>
                      </TableCell>
                      {showBuyerColumn && (
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{getSafeString(request.buyerCompany)}</p>
                            <p className="text-sm text-muted-foreground">{getSafeString(request.buyerGstNumber)}</p>
                          </div>
                        </TableCell>
                      )}
                      {showSellerColumn && (
                        <TableCell>
                          <div className="space-y-1">
                            <p className="font-medium">{getSafeString(request.sellerCompany)}</p>
                            <p className="text-sm text-muted-foreground">{getSafeString(request.sellerGstNumber)}</p>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="space-y-2">
                          <Badge className={statusConfig[request.status].color}>
                            {statusConfig[request.status].label}
                          </Badge>
                          {request.status === 'PR-ItemReceived' && request.daysUntilVerificationDeadline !== undefined && (
                            <div className={`text-sm flex items-center gap-1 ${urgent ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                              <Clock className="h-3 w-3" />
                              {request.daysUntilVerificationDeadline} days left
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="text-sm">{formatDate(request.createdDate)}</p>
                          <p className="text-xs text-muted-foreground">
                            Updated: {formatDate(request.lastUpdated)}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailsDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {availableActions.length > 0 && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => {
                                setSelectedRequest(request);
                                setShowStatusDialog(true);
                              }}
                            >
                              Update Status
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Status Update Dialog */}
      {selectedRequest && (
        <StatusUpdateDialog
          isOpen={showStatusDialog}
          onClose={() => {
            setShowStatusDialog(false);
            setSelectedRequest(null);
          }}
          purchaseRequest={selectedRequest}
          availableStatuses={getAvailableActions(selectedRequest, user?.role || '', user?.company || '')}
          onUpdateStatus={handleStatusUpdate}
        />
      )}

      {/* Details Dialog */}
      {selectedRequest && (
        <div 
          className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 ${
            showDetailsDialog ? 'block' : 'hidden'
          }`}
          onClick={() => setShowDetailsDialog(false)}
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Purchase Request Details</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDetailsDialog(false)}
              >
                Close
              </Button>
            </div>

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Request ID</h3>
                  <p className="text-sm">{selectedRequest.id}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Current Status</h3>
                  <Badge className={statusConfig[selectedRequest.status].color}>
                    {statusConfig[selectedRequest.status].label}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Item</h3>
                  <p className="text-sm">{getSafeString(selectedRequest.stockItemName)}</p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Total Amount</h3>
                  <p className="text-sm font-medium">₹{selectedRequest.totalAmount.toLocaleString()}</p>
                </div>
                {selectedRequest.logisticsPartner && (
                  <div>
                    <h3 className="font-semibold mb-2">Logistics Partner</h3>
                    <p className="text-sm">{getSafeString(selectedRequest.logisticsPartner)}</p>
                  </div>
                )}
                {selectedRequest.waybillNumber && (
                  <div>
                    <h3 className="font-semibold mb-2">Waybill Number</h3>
                    <p className="text-sm font-mono bg-muted px-2 py-1 rounded">{selectedRequest.waybillNumber}</p>
                  </div>
                )}
              </div>

              {/* Status History */}
              <div>
                <h3 className="font-semibold mb-4">Status History</h3>
                <div className="space-y-3">
                  {selectedRequest.statusHistory.map((history, index) => (
                    <div key={index} className="border-l-2 border-primary pl-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={statusConfig[history.status].color}>
                          {statusConfig[history.status].label}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {formatDate(history.updatedDate)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Updated by: {getSafeString(history.updatedBy)}
                      </p>
                      {history.remarks && (
                        <div className="bg-muted p-3 rounded text-sm">
                          <div className="flex items-start gap-2">
                            <MessageSquare className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <p>{history.remarks}</p>
                          </div>
                        </div>
                      )}
                      {history.waybillNumber && (
                        <div className="bg-blue-50 p-3 rounded text-sm mt-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Waybill:</span>
                            <span className="font-mono bg-white px-2 py-1 rounded border">{history.waybillNumber}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
