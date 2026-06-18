import { AlertType, MovementType, PurchaseOrderStatus, Role } from './enums';

export interface ApiResponse<T> {
  data: T;
  meta?: PaginationMeta;
  error?: string | null;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  currency: string;
  timezone: string;
  taxRate?: number;
}

export interface UserOrganization {
  organization: Organization;
  role: Role;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  organizations: UserOrganization[];
}

export interface Category {
  id: string;
  name: string;
  description?: string | null;
  parentId?: string | null;
  _count?: { products: number };
  children?: Category[];
}

export interface Product {
  id: string;
  name: string;
  description?: string | null;
  sku: string;
  barcode?: string | null;
  unitPrice: number;
  costPrice: number;
  currentStock: number;
  reorderPoint: number;
  reorderQty: number;
  unit: string;
  imageUrl?: string | null;
  isActive: boolean;
  categoryId?: string | null;
  category?: Category | null;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reference?: string | null;
  notes?: string | null;
  createdAt: string;
  product?: Product;
  performedBy?: User;
}

export interface StockAlert {
  id: string;
  type: AlertType;
  threshold: number;
  isResolved: boolean;
  createdAt: string;
  product?: Product;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  contactPerson?: string | null;
  notes?: string | null;
  isActive: boolean;
  createdAt: string;
  _count?: { purchaseOrders: number };
}

export interface PurchaseOrderItem {
  id: string;
  productId: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitCost: number;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate?: string | null;
  receivedDate?: string | null;
  subtotal: number;
  tax: number;
  total: number;
  notes?: string | null;
  supplier?: Supplier;
  items?: PurchaseOrderItem[];
  createdAt: string;
}

export interface DashboardKPIs {
  totalProducts: number;
  inventoryValue: number;
  lowStockCount: number;
  openPOs: number;
  totalSuppliers: number;
  monthlyStockIn: number;
  monthlyStockOut: number;
  inventoryTurnover?: number;
  healthScore?: number;
}

export interface InventoryValuePoint {
  date: string;
  value: number;
}

export interface MonthlyTrend {
  month: string;
  stockIn: number;
  stockOut: number;
}

export interface FastMovingProduct {
  productId: string;
  name: string;
  sku: string;
  totalOut: number;
  currentStock: number;
  revenue?: number;
}
