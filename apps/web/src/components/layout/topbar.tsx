'use client';

import { useAuth } from '@/providers/auth-provider';
import { Bell, ChevronDown, LogOut, Building2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery } from '@tanstack/react-query';
import { inventoryApi } from '@/services/api';
import { Badge } from '@/components/ui/badge';
import { MovementTypeBadge } from '@/components/shared/status-badge';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';

export function Topbar() {
  const { user, currentOrg, organizations, logout, switchOrg } = useAuth();

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => inventoryApi.alerts(),
  });

  const alertList = (alerts as Array<Record<string, unknown>>) || [];
  const alertCount = alertList.length;

  return (
    <header className="flex h-14 items-center justify-between border-b bg-card px-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Building2 className="h-4 w-4" />
        <span className="font-medium text-foreground">{currentOrg?.organization.name || 'StockFlow'}</span>
      </div>

      <div className="flex items-center gap-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {alertCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px]" variant="destructive">
                  {alertCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              {alertCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">{alertCount} active</Badge>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {alertCount === 0 ? (
              <div className="px-3 py-6 text-center">
                <AlertTriangle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-sm font-medium">All clear</p>
                <p className="text-xs text-muted-foreground mt-1">No active stock alerts</p>
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto">
                {alertList.slice(0, 6).map((alert) => {
                  const product = alert.product as { name: string; sku: string; currentStock: number };
                  return (
                    <DropdownMenuItem key={alert.id as string} className="flex flex-col items-start gap-1 py-2.5 cursor-pointer" asChild>
                      <Link href="/inventory">
                        <div className="flex items-center justify-between w-full gap-2">
                          <p className="text-sm font-medium truncate">{product?.name}</p>
                          <MovementTypeBadge type={alert.type as string} />
                        </div>
                        <p className="text-xs text-muted-foreground font-mono">{product?.sku}</p>
                        <p className="text-xs text-muted-foreground">
                          {product?.currentStock} units - threshold {alert.threshold as number} - {formatDate(alert.createdAt as string)}
                        </p>
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/inventory" className="w-full text-center text-xs text-primary font-medium">
                View all alerts
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-medium">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </div>
              <span className="text-sm">{user?.firstName} {user?.lastName}</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span>{user?.firstName} {user?.lastName}</span>
                <span className="text-xs font-normal text-muted-foreground">{user?.email}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {organizations.length > 1 && (
              <>
                <DropdownMenuLabel className="text-xs text-muted-foreground">Organizations</DropdownMenuLabel>
                {organizations.map((org) => (
                  <DropdownMenuItem key={org.organization.id} onClick={() => switchOrg(org.organization.id)}>
                    {org.organization.name}
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
