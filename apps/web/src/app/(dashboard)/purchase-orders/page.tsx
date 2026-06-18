'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { POStatusBadge } from '@/components/shared/status-badge';
import { purchaseOrdersApi } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CreatePODialog } from '@/components/purchase-orders/create-po-dialog';
import Link from 'next/link';

const statuses = ['ALL', 'DRAFT', 'SUBMITTED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED'];

export default function PurchaseOrdersPage() {
  const [status, setStatus] = useState('ALL');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['purchase-orders', status],
    queryFn: () =>
      purchaseOrdersApi.list({
        limit: '50',
        ...(status !== 'ALL' && { status }),
      }),
  });

  const orders = (data as { data?: Array<Record<string, unknown>> })?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Purchase Orders</h1>
          <p className="text-muted-foreground">Create and manage purchase orders</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          New PO
        </Button>
      </div>

      <Tabs value={status} onValueChange={setStatus}>
        <TabsList>
          {statuses.map((s) => (
            <TabsTrigger key={s} value={s} className="text-xs">
              {s === 'ALL' ? 'All' : s.replace('_', ' ')}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={status}>
          {isLoading ? (
            <TableSkeleton />
          ) : orders.length === 0 ? (
            <EmptyState icon={FileText} title="No purchase orders" description="Create your first purchase order to start receiving inventory." action={{ label: 'Create PO', onClick: () => setShowCreate(true) }} />
          ) : (
            <Card>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">PO Number</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Supplier</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Order Date</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Items</th>
                      <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((po) => (
                      <tr key={po.id as string} className="border-b hover:bg-muted/30">
                        <td className="p-4">
                          <Link href={`/purchase-orders/${po.id}`} className="font-mono font-medium hover:text-primary">
                            {po.poNumber as string}
                          </Link>
                        </td>
                        <td className="p-4">{(po.supplier as { name: string })?.name}</td>
                        <td className="p-4"><POStatusBadge status={po.status as string} /></td>
                        <td className="p-4">{formatDate(po.orderDate as string)}</td>
                        <td className="p-4 text-right">{(po.items as unknown[])?.length || 0}</td>
                        <td className="p-4 text-right font-medium">{formatCurrency(po.total as number)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <CreatePODialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
