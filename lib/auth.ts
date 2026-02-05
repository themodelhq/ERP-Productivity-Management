// Authentication utilities for ERP application
// In production, use proper auth systems (Auth.js, Supabase Auth, etc.)

import { getStore } from './store';

export interface AuthSession {
  user_id: string;
  email: string;
  name: string;
  role: 'agent' | 'manager' | 'admin';
  logged_in_at: Date;
}

export async function authenticate(
  email: string,
  password: string,
): Promise<AuthSession | null> {
  const user = getStore().verifyCredentials(email.trim().toLowerCase(), password);
  if (!user) {
    return null;
  }

  return {
    user_id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    logged_in_at: new Date(),
  };
}

export function validateSession(session: AuthSession | null): boolean {
  if (!session) return false;
  if (!session.user_id) return false;

  const user = getStore().getUser(session.user_id);
  return user ? user.is_active : false;
}
