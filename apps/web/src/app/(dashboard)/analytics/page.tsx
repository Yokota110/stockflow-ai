'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { PageSkeleton } from '@/components/shared/loading-skeleton';
import { HealthScoreRing } from '@/components/shared/status-timeline';
import { UrgencyBadge } from '@/components/shared/status-badge';
import { analyticsApi } from '@/services/api';
import { formatCurrency, formatNumber, formatAxisCurrency } from '@/lib/utils';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell,
} from 'recharts';
import { TrendingUp, Package, AlertTriangle, RotateCcw, Layers, BarChart2, ShieldAlert, Truck } from 'lucide-react';

const AGING_COLORS = ['hsl(142, 76%, 36%)', 'hsl(239, 84%, 67%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)'];
const RISK_COLORS = { high: 'hsl(0, 84%, 60%)', medium: 'hsl(38, 92%, 50%)', low: 'hsl(142, 76%, 36%)' };

const PO_COLORS: Record<string, string> = {
  DRAFT: 'hsl(240, 4%, 46%)',
  SUBMITTED: 'hsl(239, 84%, 67%)',
  PARTIALLY_RECEIVED: 'hsl(38, 92%, 50%)',
  RECEIVED: 'hsl(142, 76%, 36%)',
  CANCELLED: 'hsl(0, 84%, 60%)',
};

const PO_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Submitted',
  PARTIALLY_RECEIVED: 'Partial',
  RECEIVED: 'Received',
  CANCELLED: 'Cancelled',
};

export default function AnalyticsPage() {
  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ['health-score'],
    queryFn: () => analyticsApi.healthScore(),
  });

  const { data: inventoryValue } = useQuery({
    queryKey: ['analytics-inventory-value'],
    queryFn: () => analyticsApi.inventoryValue(90),
  });

  const { data: turnover } = useQuery({
    queryKey: ['inventory-turnover'],
    queryFn: () => analyticsApi.inventoryTurnover(90),
  });

  const { data: fastMoving } = useQuery({
    queryKey: ['analytics-fast-moving'],
    queryFn: () => analyticsApi.fastMoving(8),
  });

  const { data: supplierPerf } = useQuery({
    queryKey: ['supplier-performance'],
    queryFn: () => analyticsApi.supplierPerformance(6),
  });

  const { data: poBreakdown } = useQuery({
    queryKey: ['po-status-breakdown'],
    queryFn: () => analyticsApi.poStatusBreakdown(),
  });

  const { data: forecast } = useQuery({
    queryKey: ['low-stock-forecast'],
    queryFn: () => analyticsApi.lowStockForecast(),
  });

  const { data: trends } = useQuery({
    queryKey: ['analytics-trends'],
    queryFn: () => analyticsApi.monthlyTrends(8),
  });

  const { data: aging } = useQuery({
    queryKey: ['inventory-aging'],
    queryFn: () => analyticsApi.inventoryAging(),
  });

  const { data: categoryPerf } = useQuery({
    queryKey: ['category-performance'],
    queryFn: () => analyticsApi.categoryPerformance(),
  });

  const { data: lowStockRisk } = useQuery({
    queryKey: ['low-stock-risk'],
    queryFn: () => analyticsApi.lowStockRisk(),
  });

  if (healthLoading) return <PageSkeleton />;

  const poChartData = (poBreakdown || []).map((p) => ({
    name: PO_LABELS[p.status] || p.status,
    value: p.count,
    amount: p.value,
    fill: PO_COLORS[p.status] || 'hsl(240, 4%, 46%)',
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">Business insights for Acme Supplies Co.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <CardContent className="flex flex-col items-center justify-center p-6">
            <HealthScoreRing score={health?.score || 0} />
            <p className="text-sm text-muted-foreground mt-3 text-center">Inventory Health Score</p>
            <div className="grid grid-cols-3 gap-3 mt-4 w-full text-center">
              <div>
                <p className="text-lg font-semibold">{health?.factors?.stockAvailability || 0}%</p>
                <p className="text-[10px] text-muted-foreground">Availability</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{health?.factors?.poCoverage || 0}%</p>
                <p className="text-[10px] text-muted-foreground">PO Coverage</p>
              </div>
              <div>
                <p className="text-lg font-semibold">{health?.factors?.turnoverHealth || 0}%</p>
                <p className="text-[10px] text-muted-foreground">Turnover</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Inventory Value Trend</CardTitle>
            <CardDescription>90-day inventory value based on stock movements</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={inventoryValue || []}>
                <defs>
                  <linearGradient id="invValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="hsl(239, 84%, 67%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatAxisCurrency} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Value']} labelFormatter={(l) => `Date: ${l}`} />
                <Area type="monotone" dataKey="value" stroke="hsl(239, 84%, 67%)" fill="url(#invValue)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2"><RotateCcw className="h-4 w-4 text-primary" /></div>
              <div>
                <p className="text-sm text-muted-foreground">Turnover Rate (90d)</p>
                <p className="text-2xl font-bold">{turnover?.rate || 0}x</p>
              </div>
            </div>
            <div className="text-xs text-muted-foreground space-y-1 border-t pt-3">
              <div className="flex justify-between"><span>Annualized</span><span className="font-medium">{turnover?.annualized || 0}x</span></div>
              <div className="flex justify-between"><span>COGS (90d)</span><span className="font-medium">{formatCurrency(turnover?.cogs || 0)}</span></div>
              <div className="flex justify-between"><span>Avg Inventory</span><span className="font-medium">{formatCurrency(turnover?.avgInventory || 0)}</span></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4" />Top Selling Products</CardTitle>
            <CardDescription>By units sold (90 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(fastMoving || []).map((item, i) => (
                <div key={item.productId} className="flex items-center gap-3">
                  <span className="text-xs font-mono text-muted-foreground w-4">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">{formatNumber(item.totalOut)}</p>
                    <p className="text-[10px] text-muted-foreground">units</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">PO Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={poChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {poChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [`${v} orders`, name]} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Supplier Performance</CardTitle>
            <CardDescription>By total spend</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={supplierPerf || []} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis type="number" tick={{ fontSize: 10 }} tickFormatter={formatAxisCurrency} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 9 }} width={100} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Spend']} />
                <Bar dataKey="totalSpend" fill="hsl(239, 84%, 67%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Stock Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={trends || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="stockIn" name="Stock In" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="stockOut" name="Stock Out" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Low Stock Forecast
            </CardTitle>
            <CardDescription>Projected stockouts based on 30-day consumption</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Product</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Stock</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Days Left</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Urgency</th>
                </tr>
              </thead>
              <tbody>
                {(forecast || []).slice(0, 8).map((item) => (
                  <tr key={item.productId} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                    </td>
                    <td className="p-3 text-right">{item.currentStock}</td>
                    <td className="p-3 text-right font-medium">
                      {item.daysUntilStockout !== null ? `${item.daysUntilStockout}d` : '—'}
                    </td>
                    <td className="p-3 text-right"><UrgencyBadge urgency={item.urgency} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Layers className="h-4 w-4" />Inventory Aging</CardTitle>
            <CardDescription>Inventory value by days since last stock-in</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={aging || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="range" tick={{ fontSize: 10 }} label={{ value: 'Days', position: 'insideBottom', offset: -2, fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatAxisCurrency} />
                <Tooltip formatter={(v: number) => [formatCurrency(v), 'Value']} />
                <Bar dataKey="value" name="Inventory Value" radius={[4, 4, 0, 0]}>
                  {(aging || []).map((_, i) => (
                    <Cell key={i} fill={AGING_COLORS[i % AGING_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><BarChart2 className="h-4 w-4" />Category Performance</CardTitle>
            <CardDescription>Revenue vs inventory value by category (90 days)</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={categoryPerf || []}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="category" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 10 }} tickFormatter={formatAxisCurrency} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(239, 84%, 67%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="inventoryValue" name="Inventory Value" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4 text-warning" />Low Stock Risk Analysis</CardTitle>
            <CardDescription>Products at risk of stockout</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              {(['high', 'medium', 'low'] as const).map((level) => (
                <div key={level} className="text-center p-3 rounded-lg border">
                  <p className="text-2xl font-bold" style={{ color: RISK_COLORS[level] }}>
                    {lowStockRisk?.summary?.[level] || 0}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">{level} Risk</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(lowStockRisk?.items || []).slice(0, 6).map((item) => (
                <div key={item.productId as string} className="flex items-center justify-between text-sm py-1.5 border-b last:border-0">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{item.name as string}</p>
                    <p className="text-xs text-muted-foreground font-mono">{item.sku as string}</p>
                  </div>
                  <UrgencyBadge urgency={item.urgency as string} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Truck className="h-4 w-4" />Top Suppliers</CardTitle>
            <CardDescription>Spend, reliability & delivery performance</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 font-medium text-muted-foreground">Supplier</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Spend</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">Reliability</th>
                  <th className="text-right p-3 font-medium text-muted-foreground">On-Time</th>
                </tr>
              </thead>
              <tbody>
                {(supplierPerf || []).map((s) => (
                  <tr key={s.supplierId} className="border-b hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-medium">{s.name}</td>
                    <td className="p-3 text-right">{formatCurrency(s.totalSpend)}</td>
                    <td className="p-3 text-right">{(s as { reliabilityScore?: number }).reliabilityScore ?? '—'}%</td>
                    <td className="p-3 text-right">{s.onTimeRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
