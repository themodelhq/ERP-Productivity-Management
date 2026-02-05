// Hook for accessing auth context

'use client';

import { useContext } from 'react';
import { AuthContext } from '@/lib/auth-context';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
