'use client';

import React from "react"

import { useState, useCallback, useEffect } from 'react';
import { AuthContext } from '@/lib/auth-context';
import { authenticate, validateSession } from '@/lib/auth';
import type { AuthSession } from '@/lib/auth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem('authSession');
    if (stored) {
      try {
        const parsedSession = JSON.parse(stored) as AuthSession;
        if (validateSession(parsedSession)) {
          setSession(parsedSession);
        } else {
          localStorage.removeItem('authSession');
        }
      } catch (e) {
        localStorage.removeItem('authSession');
      }
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const newSession = await authenticate(email, password);
      if (newSession) {
        setSession(newSession);
        localStorage.setItem('authSession', JSON.stringify(newSession));
      } else {
        throw new Error('Invalid credentials');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem('authSession');
  }, []);

  return (
    <AuthContext.Provider value={{ session, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
