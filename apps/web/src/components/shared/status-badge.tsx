import { PurchaseOrderStatus, Role } from '@stockflow/shared';
import { Badge } from '@/components/ui/badge';

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'success' | 'warning' | 'destructive' | 'muted' }> = {
  DRAFT: { label: 'Draft', variant: 'muted' },
  SUBMITTED: { label: 'Submitted', variant: 'default' },
  PARTIALLY_RECEIVED: { label: 'Partially Received', variant: 'warning' },
  RECEIVED: { label: 'Received', variant: 'success' },
  CANCELLED: { label: 'Cancelled', variant: 'destructive' },
};

export function POStatusBadge({ status }: { status: PurchaseOrderStatus | string }) {
  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

export function StockBadge({ stock, reorderPoint }: { stock: number; reorderPoint: number }) {
  if (stock === 0) return <Badge variant="destructive">Out of Stock</Badge>;
  if (stock <= reorderPoint) return <Badge variant="warning">{stock} units</Badge>;
  return <Badge variant="success">{stock} units</Badge>;
}

export function MovementTypeBadge({ type }: { type: string }) {
  const variants: Record<string, 'success' | 'destructive' | 'default' | 'warning' | 'secondary'> = {
    STOCK_IN: 'success',
    STOCK_OUT: 'destructive',
    PO_RECEIPT: 'success',
    ADJUSTMENT: 'warning',
    RETURN: 'secondary',
    TRANSFER: 'default',
  };
  const labels: Record<string, string> = {
    STOCK_IN: 'Stock In',
    STOCK_OUT: 'Stock Out',
    PO_RECEIPT: 'PO Receipt',
    ADJUSTMENT: 'Adjustment',
    RETURN: 'Return',
    TRANSFER: 'Transfer',
    LOW_STOCK: 'Low Stock',
    OUT_OF_STOCK: 'Out of Stock',
  };
  return <Badge variant={variants[type] || 'default'}>{labels[type] || type}</Badge>;
}

export function RoleBadge({ role }: { role: Role | string }) {
  const variants: Record<string, 'default' | 'secondary' | 'success' | 'warning' | 'muted'> = {
    OWNER: 'default',
    ADMIN: 'success',
    MANAGER: 'warning',
    STAFF: 'secondary',
    VIEWER: 'muted',
  };
  const labels: Record<string, string> = {
    OWNER: 'Owner',
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    STAFF: 'Staff',
    VIEWER: 'Viewer',
  };
  return <Badge variant={variants[role] || 'secondary'}>{labels[role] || role}</Badge>;
}

export function UrgencyBadge({ urgency }: { urgency: string }) {
  const variants: Record<string, 'destructive' | 'warning' | 'secondary'> = {
    critical: 'destructive',
    high: 'warning',
    medium: 'secondary',
  };
  return <Badge variant={variants[urgency] || 'secondary'}>{urgency}</Badge>;
}
