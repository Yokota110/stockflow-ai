'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { purchaseOrdersApi, suppliersApi, productsApi } from '@/services/api';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2 } from 'lucide-react';

interface CreatePODialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface POItem {
  productId: string;
  quantityOrdered: string;
  unitCost: string;
}

export function CreatePODialog({ open, onOpenChange }: CreatePODialogProps) {
  const queryClient = useQueryClient();
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<POItem[]>([{ productId: '', quantityOrdered: '', unitCost: '' }]);

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersApi.list({ limit: '100' }),
    enabled: open,
  });

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.list({ limit: '100' }),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: () =>
      purchaseOrdersApi.create({
        supplierId,
        items: items
          .filter((i) => i.productId)
          .map((i) => ({
            productId: i.productId,
            quantityOrdered: parseInt(i.quantityOrdered),
            unitCost: parseFloat(i.unitCost),
          })),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      toast.success('Purchase order created');
      onOpenChange(false);
      setSupplierId('');
      setItems([{ productId: '', quantityOrdered: '', unitCost: '' }]);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const supplierList = (suppliers as { data?: Array<{ id: string; name: string }> })?.data || [];
  const productList = products?.data || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Create Purchase Order</DialogTitle></DialogHeader>
        <form onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }} className="space-y-4">
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
              <SelectContent>
                {supplierList.map((s) => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Items</Label>
            {items.map((item, idx) => (
              <div key={idx} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select
                    value={item.productId}
                    onValueChange={(v) => {
                      const updated = [...items];
                      updated[idx].productId = v;
                      const product = productList.find((p) => p.id === v);
                      if (product) updated[idx].unitCost = String(product.costPrice);
                      setItems(updated);
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Product" /></SelectTrigger>
                    <SelectContent>
                      {productList.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input type="number" placeholder="Qty" className="w-20" value={item.quantityOrdered} onChange={(e) => { const u = [...items]; u[idx].quantityOrdered = e.target.value; setItems(u); }} />
                <Input type="number" step="0.01" placeholder="Cost" className="w-24" value={item.unitCost} onChange={(e) => { const u = [...items]; u[idx].unitCost = e.target.value; setItems(u); }} />
                {items.length > 1 && (
                  <Button type="button" variant="ghost" size="icon" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={() => setItems([...items, { productId: '', quantityOrdered: '', unitCost: '' }])}>
              <Plus className="h-4 w-4" /> Add Item
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending || !supplierId}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Create Purchase Order
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
