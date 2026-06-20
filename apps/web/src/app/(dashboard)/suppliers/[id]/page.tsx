'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { suppliersApi } from '@/services/api';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { POStatusBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import {
  ArrowLeft, Mail, Phone, MapPin, Globe, FileText, DollarSign, Clock, CheckCircle2, TrendingUp, Building2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SupplierDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: supplier, isLoading } = useQuery({
    queryKey: ['supplier', id],
    queryFn: () => suppliersApi.get(id),
  });

  const { data: pos } = useQuery({
    queryKey: ['supplier-pos', id],
    queryFn: () => suppliersApi.purchaseOrders(id),
  });

  const { data: suppliedProducts } = useQuery({
    queryKey: ['supplier-products', id],
    queryFn: () => suppliersApi.products(id),
  });

  if (isLoading) return <PageSkeleton />;
  if (!supplier) return <EmptyState icon={Building2} title="Supplier not found" description="This supplier may have been removed." />;

  const s = supplier as Record<string, unknown>;
  const stats = s.stats as Record<string, unknown> | undefined;
  const poList = (pos as { data?: Array<Record<string, unknown>> })?.data || [];
  const productList = (suppliedProducts as Array<Record<string, unknown>>) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/suppliers" className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{s.name as string}</h1>
              <Badge variant={s.isActive ? 'success' : 'muted'}>{s.isActive ? 'Active' : 'Inactive'}</Badge>
            </div>
            <p className="text-muted-foreground">{s.contactPerson as string} - {s.city as string}, Japan</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><FileText className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Orders</p>
              <p className="text-xl font-bold">{(stats?.totalOrders as number) || 0}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2"><DollarSign className="h-4 w-4 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Total Spend</p>
              <p className="text-xl font-bold">{formatCurrency((stats?.totalSpend as number) || 0)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2"><Clock className="h-4 w-4 text-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Last Order</p>
              <p className="text-sm font-semibold">
                {stats?.lastOrderDate ? formatDate(stats.lastOrderDate as string) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-primary/10 p-2"><Clock className="h-4 w-4 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Avg Delivery</p>
              <p className="text-xl font-bold">
                {stats?.avgDeliveryDays ? `${stats.avgDeliveryDays} days` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-success/10 p-2"><CheckCircle2 className="h-4 w-4 text-success" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Supplier Score - Reliability</p>
              <p className="text-2xl font-bold">{(stats?.reliabilityScore as number) ?? '-'}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="rounded-lg bg-warning/10 p-2"><TrendingUp className="h-4 w-4 text-warning" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Supplier Score - On-Time Delivery</p>
              <p className="text-2xl font-bold">
                {stats?.onTimeRate !== null && stats?.onTimeRate !== undefined ? `${stats.onTimeRate}%` : '-'}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-base">Supplier Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">Email</p><p>{(s.email as string) || '-'}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div><p className="text-xs text-muted-foreground">Phone</p><p>{(s.phone as string) || '-'}</p></div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Address</p>
                <p>{(s.address as string) || '-'}</p>
                <p className="text-muted-foreground">{s.city as string}, {s.country as string}</p>
              </div>
            </div>
            {s.website ? (
              <div className="flex items-start gap-3">
                <Globe className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div><p className="text-xs text-muted-foreground">Website</p><p className="text-primary">{s.website as string}</p></div>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{formatCurrency((stats?.avgOrderValue as number) || 0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Avg Order Value</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{(stats?.fulfillmentRate as number) || 0}%</p>
                <p className="text-xs text-muted-foreground mt-1">Fulfillment Rate</p>
              </div>
              <div className="text-center p-4 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{(stats?.onTimeRate as number) ?? '-'}{stats?.onTimeRate !== null ? '%' : ''}</p>
                <p className="text-xs text-muted-foreground mt-1">On-Time Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Recent Purchase Orders</CardTitle></CardHeader>
        <CardContent className="p-0">
          {poList.length === 0 ? (
            <EmptyState icon={FileText} title="No purchase orders" description="No orders have been placed with this supplier yet." size="compact" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">PO Number</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Items</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Total</th>
                </tr>
              </thead>
              <tbody>
                {poList.map((po) => (
                  <tr key={po.id as string} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <Link href={`/purchase-orders/${po.id}`} className="font-mono font-medium hover:text-primary transition-colors">
                        {po.poNumber as string}
                      </Link>
                    </td>
                    <td className="p-4"><POStatusBadge status={po.status as string} /></td>
                    <td className="p-4">{formatDate(po.orderDate as string)}</td>
                    <td className="p-4 text-right">{(po.items as unknown[])?.length || 0}</td>
                    <td className="p-4 text-right font-medium">{formatCurrency(po.total as number)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Products Supplied</CardTitle></CardHeader>
        <CardContent className="p-0">
          {productList.length === 0 ? (
            <EmptyState icon={Building2} title="No products" description="No products have been ordered from this supplier yet." size="compact" />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                  <th className="text-left p-4 font-medium text-muted-foreground">SKU</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Stock</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Total Ordered</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Cost</th>
                </tr>
              </thead>
              <tbody>
                {productList.map((p) => (
                  <tr key={p.id as string} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-4 font-medium">{p.name as string}</td>
                    <td className="p-4 font-mono text-muted-foreground">{p.sku as string}</td>
                    <td className="p-4 text-right">{p.currentStock as number}</td>
                    <td className="p-4 text-right">{p.totalOrdered as number}</td>
                    <td className="p-4 text-right">{formatCurrency(p.costPrice as number)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
