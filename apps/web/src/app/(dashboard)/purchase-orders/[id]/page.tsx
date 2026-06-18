'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { purchaseOrdersApi } from '@/services/api';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POStatusBadge } from '@/components/shared/status-badge';
import { POStatusTimeline } from '@/components/shared/status-timeline';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, FileText, Truck, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<'receive' | 'partial' | 'cancel' | null>(null);
  const [partialQtys, setPartialQtys] = useState<Record<string, string>>({});

  const { data: po, isLoading } = useQuery({
    queryKey: ['purchase-order', id],
    queryFn: () => purchaseOrdersApi.get(id),
  });

  const submitMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      toast.success('Purchase order submitted to supplier');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const receiveMutation = useMutation({
    mutationFn: () => {
      const items = ((po as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || [];
      return purchaseOrdersApi.receive(id, {
        items: items.map((item) => ({
          itemId: item.id,
          quantityReceived: (item.quantityOrdered as number) - (item.quantityReceived as number),
        })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Inventory received successfully');
      setConfirmAction(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const partialReceiveMutation = useMutation({
    mutationFn: () => {
      const items = ((po as Record<string, unknown>)?.items as Array<Record<string, unknown>>) || [];
      return purchaseOrdersApi.receive(id, {
        items: items
          .map((item) => {
            const remaining = (item.quantityOrdered as number) - (item.quantityReceived as number);
            const qty = parseInt(partialQtys[item.id as string] || '0');
            return { itemId: item.id, quantityReceived: Math.min(qty, remaining) };
          })
          .filter((i) => i.quantityReceived > 0),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast.success('Partial receipt recorded successfully');
      setConfirmAction(null);
      setPartialQtys({});
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const cancelMutation = useMutation({
    mutationFn: () => purchaseOrdersApi.cancel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-order', id] });
      toast.success('Purchase order cancelled');
      setConfirmAction(null);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (isLoading) return <PageSkeleton />;
  if (!po) return <EmptyState icon={FileText} title="Purchase order not found" description="This PO may have been removed." />;

  const order = po as Record<string, unknown>;
  const items = (order.items as Array<Record<string, unknown>>) || [];
  const supplier = order.supplier as Record<string, unknown> | undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/purchase-orders" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold font-mono">{order.poNumber as string}</h1>
              <POStatusBadge status={order.status as string} />
            </div>
            <p className="text-muted-foreground text-sm mt-0.5">Created {formatDate(order.orderDate as string)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {order.status === 'DRAFT' && (
            <Button onClick={() => submitMutation.mutate()} disabled={submitMutation.isPending}>
              Submit PO
            </Button>
          )}
          {['SUBMITTED', 'PARTIALLY_RECEIVED'].includes(order.status as string) && (
            <>
              <Button variant="outline" onClick={() => {
                const initial: Record<string, string> = {};
                items.forEach((item) => {
                  const remaining = (item.quantityOrdered as number) - (item.quantityReceived as number);
                  initial[item.id as string] = String(Math.ceil(remaining / 2));
                });
                setPartialQtys(initial);
                setConfirmAction('partial');
              }}>
                <Package className="h-4 w-4" />
                Partial Receive
              </Button>
              <Button onClick={() => setConfirmAction('receive')}>
                <CheckCircle className="h-4 w-4" />
                Mark Received
              </Button>
            </>
          )}
          {!['RECEIVED', 'CANCELLED'].includes(order.status as string) && (
            <Button variant="outline" onClick={() => setConfirmAction('cancel')}>
              <XCircle className="h-4 w-4" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <POStatusTimeline status={order.status as string} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4" />Order Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Order Date</span><span className="font-medium">{formatDate(order.orderDate as string)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Expected Delivery</span><span>{order.expectedDate ? formatDate(order.expectedDate as string) : '—'}</span></div>
            {order.receivedDate ? (
              <div className="flex justify-between"><span className="text-muted-foreground">Received Date</span><span className="text-success font-medium">{formatDate(order.receivedDate as string)}</span></div>
            ) : null}
            <Separator />
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(order.subtotal as number)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">SST (6%)</span><span>{formatCurrency(order.tax as number)}</span></div>
            <div className="flex justify-between font-semibold"><span>Total</span><span className="text-lg">{formatCurrency(order.total as number)}</span></div>
            {order.notes ? (
              <>
                <Separator />
                <div><p className="text-muted-foreground text-xs mb-1">Notes</p><p className="text-sm">{order.notes as string}</p></div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" />Supplier</CardTitle>
          </CardHeader>
          <CardContent>
            {supplier ? (
              <div className="flex items-start justify-between">
                <div>
                  <Link href={`/suppliers/${supplier.id}`} className="text-lg font-semibold hover:text-primary transition-colors">
                    {supplier.name as string}
                  </Link>
                  <p className="text-sm text-muted-foreground mt-1">{supplier.contactPerson as string}</p>
                  <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                    <span>{supplier.email as string}</span>
                    <span>{supplier.phone as string}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{supplier.city as string}, {supplier.country as string}</p>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No supplier information</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Package className="h-4 w-4" />Ordered Items</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Ordered</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Received</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Unit Cost</th>
                <th className="text-right p-4 font-medium text-muted-foreground">Line Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const received = item.quantityReceived as number;
                const ordered = item.quantityOrdered as number;
                const isFullyReceived = received >= ordered;
                return (
                  <tr key={item.id as string} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <p className="font-medium">{(item.product as { name: string })?.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{(item.product as { sku: string })?.sku}</p>
                    </td>
                    <td className="p-4 text-right">{ordered}</td>
                    <td className="p-4 text-right">
                      <span className={isFullyReceived ? 'text-success font-medium' : received > 0 ? 'text-warning font-medium' : ''}>
                        {received} / {ordered}
                      </span>
                    </td>
                    <td className="p-4 text-right">{formatCurrency(item.unitCost as number)}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(ordered * (item.unitCost as number))}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/30">
                <td colSpan={4} className="p-4 text-right font-medium">Grand Total</td>
                <td className="p-4 text-right font-bold text-lg">{formatCurrency(order.total as number)}</td>
              </tr>
            </tfoot>
          </table>
        </CardContent>
      </Card>

      <ConfirmDialog
        open={confirmAction === 'receive'}
        onOpenChange={() => setConfirmAction(null)}
        title="Mark order as received?"
        description="This will mark all remaining items as received and update inventory stock levels."
        confirmLabel="Mark Received"
        onConfirm={() => receiveMutation.mutate()}
        loading={receiveMutation.isPending}
      />

      <Dialog open={confirmAction === 'partial'} onOpenChange={() => { setConfirmAction(null); setPartialQtys({}); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Partial Receive</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-80 overflow-y-auto">
            {items.map((item) => {
              const remaining = (item.quantityOrdered as number) - (item.quantityReceived as number);
              if (remaining <= 0) return null;
              return (
                <div key={item.id as string} className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{(item.product as { name: string })?.name}</p>
                    <p className="text-xs text-muted-foreground">Remaining: {remaining} units</p>
                  </div>
                  <div className="w-24">
                    <Label className="sr-only">Qty to receive</Label>
                    <Input
                      type="number"
                      min="0"
                      max={remaining}
                      value={partialQtys[item.id as string] || ''}
                      onChange={(e) => setPartialQtys({ ...partialQtys, [item.id as string]: e.target.value })}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setConfirmAction(null); setPartialQtys({}); }}>Cancel</Button>
            <Button
              onClick={() => partialReceiveMutation.mutate()}
              disabled={partialReceiveMutation.isPending || !Object.values(partialQtys).some((v) => parseInt(v) > 0)}
            >
              Confirm Partial Receive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmAction === 'cancel'}
        onOpenChange={() => setConfirmAction(null)}
        title="Cancel purchase order?"
        description="This action cannot be undone. The purchase order will be marked as cancelled."
        confirmLabel="Cancel Order"
        variant="destructive"
        onConfirm={() => cancelMutation.mutate()}
        loading={cancelMutation.isPending}
      />
    </div>
  );
}
