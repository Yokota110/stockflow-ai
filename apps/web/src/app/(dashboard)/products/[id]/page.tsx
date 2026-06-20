'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StockBadge, MovementTypeBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productsApi.get(id),
  });

  const { data: movements } = useQuery({
    queryKey: ['product-movements', id],
    queryFn: () => productsApi.movements(id),
  });

  if (isLoading) return <PageSkeleton />;
  if (!product) return <p>Product not found</p>;

  const movementList = (movements as { data?: Array<Record<string, unknown>> })?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/products" className="text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">{product.name}</h1>
          <p className="text-muted-foreground font-mono">{product.sku}</p>
        </div>
        <div className="ml-auto">
          <StockBadge stock={product.currentStock} reorderPoint={product.reorderPoint} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Unit Price</p>
            <p className="text-xl font-bold">{formatCurrency(product.unitPrice)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Cost Price</p>
            <p className="text-xl font-bold">{formatCurrency(product.costPrice)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Current Stock</p>
            <p className="text-xl font-bold">{product.currentStock} {product.unit}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Reorder Point</p>
            <p className="text-xl font-bold">{product.reorderPoint} {product.unit}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="movements">Movement History</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground">Category:</span> {product.category?.name || '-'}</div>
                <div><span className="text-muted-foreground">Barcode:</span> <span className="font-mono">{product.barcode || '-'}</span></div>
                <div><span className="text-muted-foreground">Unit:</span> {product.unit}</div>
                <div><span className="text-muted-foreground">Status:</span> {product.isActive ? 'Active' : 'Inactive'}</div>
              </div>
              {product.description && <p className="text-sm text-muted-foreground">{product.description}</p>}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="movements">
          <Card>
            <CardHeader><CardTitle className="text-base">Recent Movements</CardTitle></CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Date</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Qty</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {movementList.map((m: Record<string, unknown>) => (
                    <tr key={m.id as string} className="border-b">
                      <td className="p-4">{formatDate(m.createdAt as string)}</td>
                      <td className="p-4"><MovementTypeBadge type={m.type as string} /></td>
                      <td className="p-4 text-right font-mono">{(m.quantity as number) > 0 ? '+' : ''}{m.quantity as number}</td>
                      <td className="p-4 text-right">{m.newStock as number}</td>
                      <td className="p-4 text-muted-foreground">{(m.reference as string) || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
