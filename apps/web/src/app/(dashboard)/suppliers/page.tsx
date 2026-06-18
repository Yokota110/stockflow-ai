'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Plus, Search, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { EmptyState } from '@/components/shared/empty-state';
import { suppliersApi } from '@/services/api';
import { SupplierFormDialog } from '@/components/suppliers/supplier-form-dialog';
import Link from 'next/link';

export default function SuppliersPage() {
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['suppliers', search],
    queryFn: () => suppliersApi.list({ ...(search && { search }), limit: '50' }),
  });

  const suppliers = (data as { data?: Array<Record<string, unknown>> })?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Suppliers</h1>
          <p className="text-muted-foreground">Manage your supplier directory</p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" />
          Add Supplier
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search suppliers..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {isLoading ? (
        <TableSkeleton />
      ) : suppliers.length === 0 ? (
        <EmptyState icon={Truck} title="No suppliers" description="Add your first supplier to start creating purchase orders." action={{ label: 'Add Supplier', onClick: () => setShowCreate(true) }} />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suppliers.map((supplier) => (
            <Link key={supplier.id as string} href={`/suppliers/${supplier.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="rounded-lg bg-primary/10 p-2">
                      <Truck className="h-4 w-4 text-primary" />
                    </div>
                    <Badge variant={supplier.isActive ? 'success' : 'muted'}>
                      {supplier.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h3 className="font-semibold mb-1">{supplier.name as string}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{supplier.contactPerson as string}</p>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <p>{supplier.email as string}</p>
                    <p>{supplier.city as string}, {supplier.country as string}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
                    {(supplier._count as { purchaseOrders: number })?.purchaseOrders || 0} purchase orders
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <SupplierFormDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}
