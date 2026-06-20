'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { StockBadge } from '@/components/shared/status-badge';
import { productsApi } from '@/services/api';
import { formatCurrency } from '@/lib/utils';
import { ProductFormDialog } from '@/components/products/product-form-dialog';
import { ProductDetailDrawer } from '@/components/products/product-detail-drawer';

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [lowStock, setLowStock] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['products', search, lowStock],
    queryFn: () =>
      productsApi.list({
        ...(search && { search }),
        ...(lowStock && { lowStock: 'true' }),
        limit: '50',
      }),
  });

  const products = data?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">{data?.meta?.total || 0} products in catalog</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Product
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, SKU, or barcode..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Button variant={lowStock ? 'default' : 'outline'} size="sm" onClick={() => setLowStock(!lowStock)}>
          Low Stock
        </Button>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Get started by adding your first product to the catalog."
          action={{ label: 'Add Product', onClick: () => setShowCreate(true) }}
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-4 font-medium text-muted-foreground">Product</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">SKU</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Category</th>
                    <th className="text-left p-4 font-medium text-muted-foreground">Stock</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Cost</th>
                    <th className="text-right p-4 font-medium text-muted-foreground">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={() => setSelectedProductId(product.id)}
                    >
                      <td className="p-4">
                        <span className="font-medium">{product.name}</span>
                      </td>
                      <td className="p-4 font-mono text-muted-foreground">{product.sku}</td>
                      <td className="p-4 text-muted-foreground">{product.category?.name || '-'}</td>
                      <td className="p-4">
                        <StockBadge stock={product.currentStock} reorderPoint={product.reorderPoint} />
                      </td>
                      <td className="p-4 text-right">{formatCurrency(product.costPrice)}</td>
                      <td className="p-4 text-right font-medium">{formatCurrency(product.unitPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <ProductFormDialog open={showCreate} onOpenChange={setShowCreate} />
      <ProductDetailDrawer
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
      />
    </div>
  );
}
