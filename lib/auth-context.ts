// Auth context for managing user sessions across the app

'use client';

import { createContext } from 'react';
import type { AuthSession } from './auth';

export interface AuthContextType {
  session: AuthSession | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
