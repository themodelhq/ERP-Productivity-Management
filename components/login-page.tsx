'use client';

import React from "react"

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [setupName, setSetupName] = useState('System Admin');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupMessage, setSetupMessage] = useState('');
  const { login } = useAuth();
  const router = useRouter();
  const hasAdmin = getStore().hasAdmin();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInitialAdminCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSetupMessage('');

    try {
      getStore().createUser({
        email: setupEmail,
        name: setupName,
        role: 'admin',
        password: setupPassword,
      });

      setSetupMessage('Admin account created successfully. Please sign in.');
      setEmail(setupEmail.trim().toLowerCase());
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create admin account');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2">
          <CardTitle className="text-2xl">ERP Productivity Manager</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {!hasAdmin && (
            <form onSubmit={handleInitialAdminCreate} className="space-y-4 mb-6 pb-6 border-b">
              <p className="text-sm font-medium">Create initial admin account</p>
              <Input
                placeholder="Admin name"
                value={setupName}
                onChange={(e) => setSetupName(e.target.value)}
              />
              <Input
                type="email"
                placeholder="admin@company.com"
                value={setupEmail}
                onChange={(e) => setSetupEmail(e.target.value)}
              />
              <Input
                type="password"
                placeholder="Minimum 8 characters"
                value={setupPassword}
                onChange={(e) => setSetupPassword(e.target.value)}
              />
              <Button type="submit" className="w-full">Create Admin Account</Button>
              {setupMessage && <p className="text-xs text-green-700">{setupMessage}</p>}
            </form>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
