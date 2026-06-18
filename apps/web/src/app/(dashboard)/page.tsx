'use client';

import { useQuery } from '@tanstack/react-query';
import { Package, DollarSign, AlertTriangle, FileText, TrendingUp, ArrowDownToLine, ArrowUpFromLine, RotateCcw } from 'lucide-react';
import { KpiCard, KpiCardCurrency } from '@/components/dashboard/kpi-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { HealthScoreRing } from '@/components/shared/status-timeline';
import { analyticsApi } from '@/services/api';
import { formatCurrency, formatAxisCurrency } from '@/lib/utils';
import { StockBadge } from '@/components/shared/status-badge';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend,
} from 'recharts';

export default function DashboardPage() {
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => analyticsApi.dashboard(),
  });

  const { data: inventoryValue } = useQuery({
    queryKey: ['inventory-value'],
    queryFn: () => analyticsApi.inventoryValue(30),
  });

  const { data: fastMoving } = useQuery({
    queryKey: ['fast-moving'],
    queryFn: () => analyticsApi.fastMoving(5),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => analyticsApi.lowStock(),
  });

  const { data: trends } = useQuery({
    queryKey: ['monthly-trends'],
    queryFn: () => analyticsApi.monthlyTrends(6),
  });

  if (kpisLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Acme Supplies Co. — inventory overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Products" value={kpis?.totalProducts || 0} icon={Package} subtitle="Active in catalog" />
        <KpiCardCurrency title="Inventory Value" value={kpis?.inventoryValue || 0} icon={DollarSign} subtitle="At cost price" />
        <KpiCard title="Low Stock Items" value={kpis?.lowStockCount || 0} icon={AlertTriangle} variant="warning" subtitle="Below reorder point" />
        <KpiCard title="Open POs" value={kpis?.openPOs || 0} icon={FileText} subtitle="Awaiting delivery" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <HealthScoreRing score={kpis?.healthScore || 0} size={72} />
            <div>
              <p className="text-sm text-muted-foreground">Health Score</p>
              <p className="text-2xl font-bold">{kpis?.healthScore || 0}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-success/10 p-2.5"><RotateCcw className="h-5 w-5 text-success" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Inventory Turnover</p>
              <p className="text-2xl font-bold">{kpis?.inventoryTurnover || 0}x</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="rounded-lg bg-destructive/10 p-2.5"><ArrowUpFromLine className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Stock Out</p>
              <p className="text-2xl font-bold">{kpis?.monthlyStockOut || 0} <span className="text-sm font-normal text-muted-foreground">units</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Inventory Value Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={inventoryValue || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={formatAxisCurrency} domain={['auto', 'auto']} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Value']} />
                <Area type="monotone" dataKey="value" stroke="hsl(239, 84%, 67%)" fill="url(#colorValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Fast Moving
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(fastMoving || []).map((item, i) => (
                <div key={item.productId} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                    <div>
                      <p className="text-sm font-medium leading-none">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-destructive">-{item.totalOut}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Monthly Stock Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={trends || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="stockIn" name="Stock In" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stockOut" name="Stock Out" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Low Stock Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(lowStock || []).slice(0, 6).map((product) => (
                <div key={product.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{product.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{product.sku}</p>
                  </div>
                  <StockBadge stock={product.currentStock} reorderPoint={product.reorderPoint} />
                </div>
              ))}
              {(!lowStock || lowStock.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">All stock levels healthy</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-lg bg-success/10 p-3">
              <ArrowDownToLine className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Stock In</p>
              <p className="text-xl font-bold">{kpis?.monthlyStockIn || 0} units</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-lg bg-destructive/10 p-3">
              <ArrowUpFromLine className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Monthly Stock Out</p>
              <p className="text-xl font-bold">{kpis?.monthlyStockOut || 0} units</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
