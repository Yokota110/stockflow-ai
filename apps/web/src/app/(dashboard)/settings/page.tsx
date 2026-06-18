'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/providers/auth-provider';
import { organizationsApi } from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { RoleBadge } from '@/components/shared/status-badge';
import { TableSkeleton } from '@/components/shared/loading-skeleton';
import { Building2, Users, Bell, Palette, Loader2, Save, UserPlus, Moon, Sun } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

const CURRENCIES = ['MYR', 'USD', 'SGD', 'EUR'];
const TIMEZONES = ['Asia/Kuala_Lumpur', 'Asia/Singapore', 'Asia/Jakarta', 'UTC'];
const ROLES = ['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER'];

export default function SettingsPage() {
  const { user, currentOrg } = useAuth();
  const queryClient = useQueryClient();
  const orgId = currentOrg?.organization.id;

  const [orgForm, setOrgForm] = useState({ name: '', currency: 'MYR', timezone: 'Asia/Kuala_Lumpur', taxRate: '0.06' });
  const [notifications, setNotifications] = useState({ emailAlerts: true, lowStock: true, poUpdates: true });
  const [appearance, setAppearance] = useState({ compactMode: false, darkMode: false });
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  const { data: org, isLoading: orgLoading } = useQuery({
    queryKey: ['organization', orgId],
    queryFn: () => organizationsApi.get(orgId!),
    enabled: !!orgId,
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => organizationsApi.members(orgId!),
    enabled: !!orgId,
  });

  useEffect(() => {
    if (org) {
      const o = org as Record<string, unknown>;
      setOrgForm({
        name: o.name as string,
        currency: o.currency as string,
        timezone: o.timezone as string,
        taxRate: String(o.taxRate || 0.06),
      });
    }
  }, [org]);

  useEffect(() => {
    const saved = localStorage.getItem('stockflow-notifications');
    if (saved) setNotifications(JSON.parse(saved));
    const savedAppearance = localStorage.getItem('stockflow-appearance');
    if (savedAppearance) {
      const parsed = JSON.parse(savedAppearance);
      setAppearance(parsed);
      document.documentElement.classList.toggle('dark', !!parsed.darkMode);
    }
  }, []);

  const updateOrgMutation = useMutation({
    mutationFn: () =>
      organizationsApi.update(orgId!, {
        name: orgForm.name,
        currency: orgForm.currency,
        timezone: orgForm.timezone,
        taxRate: parseFloat(orgForm.taxRate),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization', orgId] });
      toast.success('Organization settings saved');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: string }) =>
      organizationsApi.updateMemberRole(orgId!, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members', orgId] });
      toast.success('Member role updated');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const saveNotifications = () => {
    localStorage.setItem('stockflow-notifications', JSON.stringify(notifications));
    toast.success('Notification preferences saved');
  };

  const saveAppearance = () => {
    localStorage.setItem('stockflow-appearance', JSON.stringify(appearance));
    document.documentElement.classList.toggle('dark', appearance.darkMode);
    toast.success('Appearance settings saved');
  };

  const toggleDarkMode = (enabled: boolean) => {
    setAppearance({ ...appearance, darkMode: enabled });
    document.documentElement.classList.toggle('dark', enabled);
  };

  const memberList = (members as Array<Record<string, unknown>>) || [];
  const isAdmin = currentOrg?.role === 'OWNER' || currentOrg?.role === 'ADMIN';

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">Manage your organization, team, and preferences</p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization" className="gap-1.5"><Building2 className="h-3.5 w-3.5" />Organization</TabsTrigger>
          <TabsTrigger value="team" className="gap-1.5"><Users className="h-3.5 w-3.5" />Team</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" />Notifications</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-3.5 w-3.5" />Appearance</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Organization Settings</CardTitle>
              <CardDescription>Configure your company details and regional preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {orgLoading ? (
                <TableSkeleton rows={4} />
              ) : (
                <>
                  <div className="space-y-2">
                    <Label>Company Name</Label>
                    <Input value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} disabled={!isAdmin} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Currency</Label>
                      <Select value={orgForm.currency} onValueChange={(v) => setOrgForm({ ...orgForm, currency: v })} disabled={!isAdmin}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{CURRENCIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Timezone</Label>
                      <Select value={orgForm.timezone} onValueChange={(v) => setOrgForm({ ...orgForm, timezone: v })} disabled={!isAdmin}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t.replace('Asia/', '')}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tax Rate (SST)</Label>
                    <Input type="number" step="0.01" min="0" max="1" value={orgForm.taxRate} onChange={(e) => setOrgForm({ ...orgForm, taxRate: e.target.value })} disabled={!isAdmin} />
                    <p className="text-xs text-muted-foreground">Malaysian SST is typically 6% (0.06)</p>
                  </div>
                  {isAdmin && (
                    <Button onClick={() => updateOrgMutation.mutate()} disabled={updateOrgMutation.isPending}>
                      {updateOrgMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Changes
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="team" className="mt-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base">Team Members</CardTitle>
                <CardDescription>Manage who has access to your organization</CardDescription>
              </div>
              {isAdmin && (
                <Button size="sm" onClick={() => setShowInvite(true)}>
                  <UserPlus className="h-4 w-4" />
                  Invite Member
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              {membersLoading ? (
                <div className="p-6"><TableSkeleton rows={3} /></div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-medium text-muted-foreground">Member</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Email</th>
                      <th className="text-left p-4 font-medium text-muted-foreground">Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {memberList.map((m) => {
                      const memberUser = m.user as Record<string, unknown>;
                      return (
                        <tr key={m.id as string} className="border-b hover:bg-muted/30 transition-colors">
                          <td className="p-4 font-medium">{memberUser.firstName as string} {memberUser.lastName as string}</td>
                          <td className="p-4 text-muted-foreground">{memberUser.email as string}</td>
                          <td className="p-4">
                            {isAdmin && (m.role as string) !== 'OWNER' ? (
                              <Select
                                value={m.role as string}
                                onValueChange={(role) => updateRoleMutation.mutate({ memberId: m.id as string, role })}
                              >
                                <SelectTrigger className="w-32 h-8"><SelectValue /></SelectTrigger>
                                <SelectContent>{ROLES.filter((r) => r !== 'OWNER').map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
                              </Select>
                            ) : (
                              <RoleBadge role={m.role as string} />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Your Account</CardTitle></CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span className="font-medium">{user?.firstName} {user?.lastName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Email</span><span>{user?.email}</span></div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Your Role</span>
                <RoleBadge role={currentOrg?.role || 'STAFF'} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Notification Preferences</CardTitle>
              <CardDescription>Choose what updates you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'emailAlerts' as const, label: 'Email Alerts', desc: 'Receive email notifications for important inventory events' },
                { key: 'lowStock' as const, label: 'Low Stock Alerts', desc: 'Get notified when products fall below reorder point' },
                { key: 'poUpdates' as const, label: 'Purchase Order Alerts', desc: 'Notifications for PO status changes and deliveries' },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Button
                    variant={notifications[item.key] ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setNotifications({ ...notifications, [item.key]: !notifications[item.key] })}
                  >
                    {notifications[item.key] ? 'On' : 'Off'}
                  </Button>
                </div>
              ))}
              <Button onClick={saveNotifications} className="mt-2">
                <Save className="h-4 w-4" />Save Preferences
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Appearance</CardTitle>
              <CardDescription>Customize how StockFlow looks for you</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-3">
                  {appearance.darkMode ? <Moon className="h-4 w-4 text-muted-foreground" /> : <Sun className="h-4 w-4 text-muted-foreground" />}
                  <div>
                    <p className="text-sm font-medium">{appearance.darkMode ? 'Dark Mode' : 'Light Mode'}</p>
                    <p className="text-xs text-muted-foreground">Toggle between light and dark interface themes</p>
                  </div>
                </div>
                <Button
                  variant={appearance.darkMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleDarkMode(!appearance.darkMode)}
                >
                  {appearance.darkMode ? 'Dark' : 'Light'}
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium">Compact Mode</p>
                  <p className="text-xs text-muted-foreground">Reduce spacing in tables and lists for denser data views</p>
                </div>
                <Button
                  variant={appearance.compactMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setAppearance({ ...appearance, compactMode: !appearance.compactMode })}
                >
                  {appearance.compactMode ? 'On' : 'Off'}
                </Button>
              </div>
              <Button onClick={saveAppearance}>
                <Save className="h-4 w-4" />Save Appearance
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email Address</Label>
              <Input
                type="email"
                placeholder="colleague@company.my"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select defaultValue="STAFF">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.filter((r) => r !== 'OWNER').map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowInvite(false)}>Cancel</Button>
            <Button onClick={() => {
              toast.success(`Invitation sent to ${inviteEmail}`);
              setInviteEmail('');
              setShowInvite(false);
            }} disabled={!inviteEmail}>
              Send Invite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
