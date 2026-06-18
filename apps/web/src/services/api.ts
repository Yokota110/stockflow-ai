import type { DashboardKPIs, FastMovingProduct, InventoryValuePoint, MonthlyTrend, Product } from '@stockflow/shared';
import { api } from '@/lib/api-client';

export const analyticsApi = {
  dashboard: () => api<DashboardKPIs>('/analytics/dashboard'),
  inventoryValue: (days = 30) => api<InventoryValuePoint[]>(`/analytics/inventory-value?days=${days}`),
  inventoryTurnover: (days = 90) => api<{ rate: number; annualized: number; cogs: number; avgInventory: number }>(`/analytics/inventory-turnover?days=${days}`),
  fastMoving: (limit = 10) => api<FastMovingProduct[]>(`/analytics/fast-moving?limit=${limit}`),
  supplierPerformance: (limit = 8) => api<Array<{ supplierId: string; name: string; totalOrders: number; totalSpend: number; onTimeRate: number }>>(`/analytics/supplier-performance?limit=${limit}`),
  poStatusBreakdown: () => api<Array<{ status: string; count: number; value: number }>>('/analytics/po-status-breakdown'),
  lowStock: () => api<Product[]>('/analytics/low-stock'),
  lowStockForecast: () => api<Array<{ productId: string; name: string; sku: string; currentStock: number; daysUntilStockout: number | null; urgency: string; suggestedReorder: number }>>('/analytics/low-stock-forecast'),
  healthScore: () => api<{ score: number; factors: Record<string, number> }>('/analytics/health-score'),
  monthlyTrends: (months = 6) => api<MonthlyTrend[]>(`/analytics/monthly-trends?months=${months}`),
  inventoryAging: () => api<Array<{ range: string; value: number }>>('/analytics/inventory-aging'),
  categoryPerformance: () => api<Array<{ category: string; revenue: number; inventoryValue: number; unitsSold: number }>>('/analytics/category-performance'),
  lowStockRisk: () => api<{ summary: { high: number; medium: number; low: number }; items: Array<Record<string, unknown>> }>('/analytics/low-stock-risk'),
};

export const organizationsApi = {
  get: (id: string) => api(`/organizations/${id}`),
  update: (id: string, data: Record<string, unknown>) =>
    api(`/organizations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  members: (id: string) => api(`/organizations/${id}/members`),
  updateMemberRole: (orgId: string, memberId: string, role: string) =>
    api(`/organizations/${orgId}/members/${memberId}`, { method: 'PATCH', body: JSON.stringify({ role }) }),
};

export const productsApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api<{ data: Product[]; meta: { total: number; page: number; limit: number; totalPages: number } }>(`/products${query}`);
  },
  get: (id: string) => api<Product>(`/products/${id}`),
  getDetail: (id: string) => api(`/products/${id}/detail`),
  create: (data: Partial<Product>) => api<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Partial<Product>) => api<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  delete: (id: string) => api(`/products/${id}`, { method: 'DELETE' }),
  movements: (id: string) => api(`/products/${id}/movements`),
};

export const categoriesApi = {
  list: () => api('/categories'),
  create: (data: { name: string; description?: string }) =>
    api('/categories', { method: 'POST', body: JSON.stringify(data) }),
};

export const inventoryApi = {
  stockIn: (data: { productId: string; quantity: number; reference?: string; notes?: string }) =>
    api('/inventory/stock-in', { method: 'POST', body: JSON.stringify(data) }),
  stockOut: (data: { productId: string; quantity: number; reference?: string; notes?: string }) =>
    api('/inventory/stock-out', { method: 'POST', body: JSON.stringify(data) }),
  movements: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/inventory/movements${query}`);
  },
  alerts: () => api('/inventory/alerts'),
  resolveAlert: (id: string) => api(`/inventory/alerts/${id}/resolve`, { method: 'PATCH' }),
};

export const suppliersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/suppliers${query}`);
  },
  get: (id: string) => api(`/suppliers/${id}`),
  create: (data: Record<string, string>) => api('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: string, data: Record<string, string>) =>
    api(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  purchaseOrders: (id: string) => api(`/suppliers/${id}/purchase-orders`),
  products: (id: string) => api(`/suppliers/${id}/products`),
};

export const purchaseOrdersApi = {
  list: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return api(`/purchase-orders${query}`);
  },
  get: (id: string) => api(`/purchase-orders/${id}`),
  create: (data: Record<string, unknown>) => api('/purchase-orders', { method: 'POST', body: JSON.stringify(data) }),
  submit: (id: string) => api(`/purchase-orders/${id}/submit`, { method: 'POST' }),
  receive: (id: string, data: Record<string, unknown>) =>
    api(`/purchase-orders/${id}/receive`, { method: 'POST', body: JSON.stringify(data) }),
  cancel: (id: string) => api(`/purchase-orders/${id}/cancel`, { method: 'POST' }),
};
