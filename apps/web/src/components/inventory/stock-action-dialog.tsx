'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { inventoryApi, productsApi, suppliersApi } from '@/services/api';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const STOCK_OUT_REASONS = [
  'Sales Order',
  'Internal Use',
  'Damaged / Expired',
  'Sample / Demo',
  'Transfer',
  'Other',
];

interface StockActionDialogProps {
  type: 'in' | 'out';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StockActionDialog({ type, open, onOpenChange }: StockActionDialogProps) {
  const queryClient = useQueryClient();
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [reference, setReference] = useState('');
  const [reason, setReason] = useState('');
  const [recipient, setRecipient] = useState('');
  const [notes, setNotes] = useState('');

  const { data: products } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.list({ limit: '100' }),
    enabled: open,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-list'],
    queryFn: () => suppliersApi.list({ limit: '50' }),
    enabled: open && type === 'in',
  });

  const mutation = useMutation({
    mutationFn: () => {
      const qty = parseInt(quantity);
      const selectedProduct = productList.find((p) => p.id === productId);

      if (type === 'out' && selectedProduct && qty > selectedProduct.currentStock) {
        throw new Error(`Insufficient stock. Only ${selectedProduct.currentStock} units available.`);
      }

      const supplierName = supplierList.find((s) => s.id === supplierId)?.name as string;
      const ref = type === 'in'
        ? [supplierName && `Supplier: ${supplierName}`, reference].filter(Boolean).join(' | ')
        : [reason && `Reason: ${reason}`, recipient && `To: ${recipient}`, reference].filter(Boolean).join(' | ');

      const data = { productId, quantity: qty, reference: ref || undefined, notes: notes || undefined };
      return type === 'in' ? inventoryApi.stockIn(data) : inventoryApi.stockOut(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      toast.success(type === 'in' ? 'Stock received successfully' : 'Stock removed successfully');
      resetForm();
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const resetForm = () => {
    setProductId('');
    setQuantity('');
    setSupplierId('');
    setReference('');
    setReason('');
    setRecipient('');
    setNotes('');
  };

  const productList = products?.data || [];
  const supplierList = (suppliers as { data?: Array<Record<string, unknown>> })?.data || [];
  const selectedProduct = productList.find((p) => p.id === productId);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'in' ? 'Stock In' : 'Stock Out'}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!productId || !quantity) return;
            if (type === 'out' && reason === '') {
              toast.error('Please select a reason for stock out');
              return;
            }
            mutation.mutate();
          }}
          className="space-y-4"
        >
          <div className="space-y-2">
            <Label>Product</Label>
            <Select value={productId} onValueChange={setProductId}>
              <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
              <SelectContent>
                {productList.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} ({p.sku}) — {p.currentStock} in stock
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Quantity</Label>
            <Input
              type="number"
              min="1"
              max={type === 'out' && selectedProduct ? selectedProduct.currentStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
            {type === 'out' && selectedProduct && (
              <p className="text-xs text-muted-foreground">Available: {selectedProduct.currentStock} units</p>
            )}
          </div>

          {type === 'in' ? (
            <>
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    {supplierList.map((s) => (
                      <SelectItem key={s.id as string} value={s.id as string}>{s.name as string}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="GRN-2024-001, invoice no." />
              </div>
            </>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Select value={reason} onValueChange={setReason}>
                  <SelectTrigger><SelectValue placeholder="Select reason" /></SelectTrigger>
                  <SelectContent>
                    {STOCK_OUT_REASONS.map((r) => (
                      <SelectItem key={r} value={r}>{r}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Customer / Department</Label>
                <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="e.g. Sales Dept, ABC Trading Sdn Bhd" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Notes</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
          </div>

          <Button type="submit" className="w-full" disabled={mutation.isPending || !productId}>
            {mutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {type === 'in' ? 'Record Stock In' : 'Record Stock Out'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
