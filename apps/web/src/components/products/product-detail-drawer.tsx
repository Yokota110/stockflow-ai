'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/services/api';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { StockBadge, MovementTypeBadge } from '@/components/shared/status-badge';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Pencil, Package, TrendingUp, Clock, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface ProductDetailDrawerProps {
  productId: string | null;
  onClose: () => void;
  onEdit?: () => void;
}

export function ProductDetailDrawer({ productId, onClose, onEdit }: ProductDetailDrawerProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['product-detail', productId],
    queryFn: () => productsApi.getDetail(productId!),
    enabled: !!productId,
  });

  const detail = data as Record<string, unknown> | undefined;
  const product = detail?.product as Record<string, unknown> | undefined;
  const supplier = detail?.supplier as { name: string } | null;
  const movements = (detail?.recentMovements as Array<Record<string, unknown>>) || [];
  const performance = detail?.performance as Record<string, number> | undefined;

  return (
    <Sheet
      open={!!productId}
      onClose={onClose}
      title={product?.name as string}
      description={product?.sku as string}
      footer={
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={onClose}>Close</Button>
          <Button className="flex-1" asChild>
            <Link href={productId ? `/products/${productId}` : '#'}>
              <Pencil className="h-4 w-4" />
              Edit Product
            </Link>
          </Button>
        </div>
      }
    >
      {isLoading ? (
        <TableSkeleton rows={6} />
      ) : product ? (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Product Information</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><p className="text-muted-foreground text-xs">SKU</p><p className="font-mono font-medium">{product.sku as string}</p></div>
              <div><p className="text-muted-foreground text-xs">Category</p><p>{(product.category as { name: string })?.name || '-'}</p></div>
              <div><p className="text-muted-foreground text-xs">Supplier</p><p>{supplier?.name || '-'}</p></div>
              <div><p className="text-muted-foreground text-xs">Unit</p><p>{product.unit as string}</p></div>
              <div><p className="text-muted-foreground text-xs">Cost Price</p><p className="font-medium">{formatCurrency(product.costPrice as number)}</p></div>
              <div><p className="text-muted-foreground text-xs">Selling Price</p><p className="font-medium text-primary">{formatCurrency(product.unitPrice as number)}</p></div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Inventory</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3 text-center">
                <Package className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                <p className="text-lg font-bold">{product.currentStock as number}</p>
                <p className="text-[10px] text-muted-foreground">Current Stock</p>
              </div>
              <div className="rounded-lg border p-3 text-center">
                <p className="text-lg font-bold">{product.reorderPoint as number}</p>
                <p className="text-[10px] text-muted-foreground">Reorder Point</p>
              </div>
              <div className="rounded-lg border p-3 text-center flex flex-col items-center justify-center">
                <StockBadge stock={product.currentStock as number} reorderPoint={product.reorderPoint as number} />
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Performance (90 days)</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/40 p-3">
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                <p className="text-lg font-bold">{performance?.unitsSold || 0}</p>
                <p className="text-[10px] text-muted-foreground">Units Sold</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <BarChart3 className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                <p className="text-lg font-bold">{performance?.turnover || 0}x</p>
                <p className="text-[10px] text-muted-foreground">Turnover</p>
              </div>
              <div className="rounded-lg bg-muted/40 p-3">
                <Clock className="h-3.5 w-3.5 text-muted-foreground mb-1" />
                <p className="text-lg font-bold">{performance?.daysRemaining ?? '-'}</p>
                <p className="text-[10px] text-muted-foreground">Days of Stock</p>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Recent Movements</h3>
            {movements.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No movements recorded</p>
            ) : (
              <div className="space-y-2">
                {movements.map((m) => (
                  <div key={m.id as string} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                    <div>
                      <MovementTypeBadge type={m.type as string} />
                      <p className="text-xs text-muted-foreground mt-1">{formatDate(m.createdAt as string)}</p>
                    </div>
                    <span className={`font-mono font-medium ${(m.quantity as number) > 0 ? 'text-success' : 'text-destructive'}`}>
                      {(m.quantity as number) > 0 ? '+' : ''}{m.quantity as number}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Sheet>
  );
}
