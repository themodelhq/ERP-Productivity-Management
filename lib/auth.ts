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

// Demo user credentials
const DEMO_USERS = [
  {
    email: 'manager@company.com',
    password: 'password',
    id: 'manager-1',
  },
  {
    email: 'admin@company.com',
    password: 'password',
    id: 'admin-1',
  },
  {
    email: 'agent1@company.com',
    password: 'password',
    id: 'agent-1',
  },
  {
    email: 'agent2@company.com',
    password: 'password',
    id: 'agent-2',
  },
  {
    email: 'agent3@company.com',
    password: 'password',
    id: 'agent-3',
  },
];

export async function authenticate(
  email: string,
  password: string,
): Promise<AuthSession | null> {
  // In production, validate password against bcrypt hash
  const demoUser = DEMO_USERS.find((u) => u.email === email && u.password === password);

  if (!demoUser) {
    return null;
  }

  const user = getStore().getUser(demoUser.id);
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
