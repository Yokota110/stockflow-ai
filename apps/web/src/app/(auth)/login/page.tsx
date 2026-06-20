'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Boxes, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('demo@stockflow.app');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div
        className="relative hidden overflow-hidden lg:flex lg:w-1/2 flex-col justify-between bg-cover bg-center p-12 text-white"
        style={{ backgroundImage: "url('/images/japan-warehouse-hero.png')" }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-950/55 to-slate-950/15" />
        <div className="relative flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/20 backdrop-blur">
            <Boxes className="h-5 w-5" />
          </div>
          <span className="text-2xl font-bold">StockFlow</span>
        </div>
        <div className="relative max-w-lg">
          <h1 className="text-4xl font-bold leading-tight mb-4">
            Inventory operations,<br />built for Japan.
          </h1>
          <p className="text-lg text-white/80 max-w-md">
            Track stock, manage suppliers, and monitor purchasing from one calm, precise workspace.
          </p>
        </div>
        <p className="relative text-sm text-white/65">Tokyo Supply Works demo - JPY, Asia/Tokyo, 10% consumption tax</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Boxes className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">StockFlow</span>
          </div>
          <h2 className="text-2xl font-bold mb-1">Sign in</h2>
          <p className="text-muted-foreground mb-6">Enter your credentials to access your account</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Sign in
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-medium hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
