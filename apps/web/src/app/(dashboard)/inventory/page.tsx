'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeftRight, ArrowDownToLine, ArrowUpFromLine, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { MovementTypeBadge } from '@/components/shared/status-badge';
import { inventoryApi } from '@/services/api';
import { formatDate } from '@/lib/utils';
import { StockActionDialog } from '@/components/inventory/stock-action-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function InventoryPage() {
  const [stockAction, setStockAction] = useState<'in' | 'out' | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['movements'],
    queryFn: () => inventoryApi.movements({ limit: '50' }),
  });

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => inventoryApi.alerts(),
  });

  const movements = (data as { data?: Array<Record<string, unknown>> })?.data || [];
  const alertList = (alerts as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inventory</h1>
          <p className="text-muted-foreground">Track stock movements and alerts</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setStockAction('in')}>
            <ArrowDownToLine className="h-4 w-4" />
            Stock In
          </Button>
          <Button variant="outline" onClick={() => setStockAction('out')}>
            <ArrowUpFromLine className="h-4 w-4" />
            Stock Out
          </Button>
        </div>
      </div>

      <Tabs defaultValue="movements">
        <TabsList>
          <TabsTrigger value="movements">Movement Log</TabsTrigger>
          <TabsTrigger value="alerts">
            Alerts {alertList.length > 0 && `(${alertList.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="movements">
          {isLoading ? (
            <TableSkeleton />
          ) : movements.length === 0 ? (
            <EmptyState
              icon={ArrowLeftRight}
              title="No stock movements yet"
              description="Record your first stock in or stock out transaction to start tracking inventory."
              action={{ label: 'Stock In', onClick: () => setStockAction('in') }}
            />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Quantity</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">By</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movements.map((m) => (
                      <tr key={m.id as string} className="border-b hover:bg-muted/30">
                        <td className="p-4">{formatDate(m.createdAt as string)}</td>
                        <td className="p-4">
                          <p className="font-medium">{(m.product as { name: string })?.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">{(m.product as { sku: string })?.sku}</p>
                        </td>
                        <td className="p-4"><MovementTypeBadge type={m.type as string} /></td>
                        <td className="p-4 text-right font-mono">
                          <span className={(m.quantity as number) > 0 ? 'text-success' : 'text-destructive'}>
                            {(m.quantity as number) > 0 ? '+' : ''}{m.quantity as number}
                          </span>
                        </td>
                        <td className="p-4 text-muted-foreground">{(m.reference as string) || '-'}</td>
                        <td className="p-4 text-muted-foreground">
                          {(m.performedBy as { firstName: string; lastName: string })?.firstName}{' '}
                          {(m.performedBy as { firstName: string; lastName: string })?.lastName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="alerts">
          <Card>
            <CardContent className="p-0">
              {alertList.length === 0 ? (
                <EmptyState
                  icon={AlertTriangle}
                  title="All stock levels healthy"
                  description="No active low-stock or out-of-stock alerts. You'll be notified when products need reordering."
                  size="compact"
                />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Current Stock</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Threshold</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertList.map((alert) => (
                      <tr key={alert.id as string} className="border-b">
                        <td className="p-4 font-medium">{(alert.product as { name: string })?.name}</td>
                        <td className="p-4"><MovementTypeBadge type={alert.type as string} /></td>
                        <td className="p-4 text-right">{(alert.product as { currentStock: number })?.currentStock}</td>
                        <td className="p-4 text-right">{alert.threshold as number}</td>
                        <td className="p-4">{formatDate(alert.createdAt as string)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {stockAction && (
        <StockActionDialog type={stockAction} open={!!stockAction} onOpenChange={() => setStockAction(null)} />
      )}
    </div>
  );
}
