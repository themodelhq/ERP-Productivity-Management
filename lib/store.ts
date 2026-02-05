// In-memory data store for ERP application
// In production, this would connect to a real database like Supabase, PostgreSQL, etc.

import {
  User,
  ProductivitySession,
  IdleEvent,
  ProductivityTarget,
  PerformanceEvaluation,
  BulkTargetUpload,
  ActivityLog,
  AuditLog,
  UserRole,
  AgentExecution,
  BulkExecutionUpload,
  TaskTargetDefinition,
} from './db-schema';

class DataStore {
  private users: Map<string, User> = new Map();
  private passwordsByUserId: Map<string, string> = new Map();
  private sessions: Map<string, ProductivitySession> = new Map();
  private targets: Map<string, ProductivityTarget> = new Map();
  private evaluations: Map<string, PerformanceEvaluation> = new Map();
  private uploads: Map<string, BulkTargetUpload> = new Map();
  private executions: Map<string, AgentExecution> = new Map();
  private executionUploads: Map<string, BulkExecutionUpload> = new Map();
  private taskTargetDefinitions: Map<string, TaskTargetDefinition> = new Map();
  private activityLogs: ActivityLog[] = [];
  private auditLogs: AuditLog[] = [];

  constructor() {}

  // User operations
  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return undefined;
  }

  hasUsers(): boolean {
    return this.users.size > 0;
  }

  hasAdmin(): boolean {
    return Array.from(this.users.values()).some((u) => u.role === 'admin');
  }

  verifyCredentials(email: string, password: string): User | null {
    const user = this.getUserByEmail(email);
    if (!user || !user.is_active) {
      return null;
    }

    const storedPassword = this.passwordsByUserId.get(user.id);
    if (!storedPassword || storedPassword !== password) {
      return null;
    }

    return user;
  }

  createUser(params: {
    email: string;
    name: string;
    role: UserRole;
    password: string;
    department?: string;
    manager_id?: string;
  }): User {
    const normalizedEmail = params.email.trim().toLowerCase();
    if (!normalizedEmail) {
      throw new Error('Email is required');
    }

    if (this.getUserByEmail(normalizedEmail)) {
      throw new Error('A user with this email already exists');
    }

    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const normalizedName = params.name.trim();
    if (!normalizedName) {
      throw new Error('Name is required');
    }

    const now = new Date();
    const id = `user-${crypto.randomUUID()}`;
    const user: User = {
      id,
      email: normalizedEmail,
      name: normalizedName,
      role: params.role,
      department: params.department,
      manager_id: params.manager_id,
      created_at: now,
      updated_at: now,
      is_active: true,
      settings: {
        notifications_enabled: true,
        idle_detection_enabled: true,
        privacy_mode: false,
      },
    };

    this.users.set(user.id, user);
    this.passwordsByUserId.set(user.id, params.password);
    return user;
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  getUsersByRole(role: UserRole): User[] {
    return Array.from(this.users.values()).filter((u) => u.role === role);
  }

  getUsersByManager(managerId: string): User[] {
    return Array.from(this.users.values()).filter((u) => u.manager_id === managerId);
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const user = this.users.get(id);
    if (!user) return undefined;
    const updated = { ...user, ...updates, updated_at: new Date() };
    this.users.set(id, updated);
    return updated;
  }

  setTaskTargetDefinitions(definitions: TaskTargetDefinition[]): void {
    this.taskTargetDefinitions.clear();
    definitions.forEach((definition) => {
      const key = definition.task_name.trim().toLowerCase();
      this.taskTargetDefinitions.set(key, definition);
    });
  }

  getTaskTargetDefinitions(): TaskTargetDefinition[] {
    return Array.from(this.taskTargetDefinitions.values());
  }

  getTaskTargetDefinition(taskName: string): TaskTargetDefinition | undefined {
    return this.taskTargetDefinitions.get(taskName.trim().toLowerCase());
  }

  // Session operations
  getSession(id: string): ProductivitySession | undefined {
    return this.sessions.get(id);
  }

  getSessionsByUser(userId: string): ProductivitySession[] {
    return Array.from(this.sessions.values()).filter((s) => s.user_id === userId);
  }

  getSessionsByDate(date: string): ProductivitySession[] {
    return Array.from(this.sessions.values()).filter((s) => s.date === date);
  }

  getSessionsByUserAndDateRange(userId: string, startDate: string, endDate: string): ProductivitySession[] {
    return Array.from(this.sessions.values()).filter(
      (s) => s.user_id === userId && s.date >= startDate && s.date <= endDate,
    );
  }

  upsertSession(session: ProductivitySession): ProductivitySession {
    this.sessions.set(session.id, { ...session, updated_at: new Date() });
    return this.sessions.get(session.id)!;
  }

  // Target operations
  getTarget(id: string): ProductivityTarget | undefined {
    return this.targets.get(id);
  }

  getTargetsByUser(userId: string): ProductivityTarget[] {
    return Array.from(this.targets.values()).filter((t) => t.user_id === userId);
  }

  getTargetsByDate(date: string): ProductivityTarget[] {
    return Array.from(this.targets.values()).filter((t) => t.target_date === date);
  }

  getTargetsByUserAndMonth(userId: string, month: string): ProductivityTarget[] {
    return Array.from(this.targets.values()).filter(
      (t) => t.user_id === userId && t.target_date.startsWith(month),
    );
  }

  upsertTarget(target: ProductivityTarget): ProductivityTarget {
    this.targets.set(target.id, { ...target, updated_at: new Date() });
    return this.targets.get(target.id)!;
  }

  // Evaluation operations
  getEvaluation(id: string): PerformanceEvaluation | undefined {
    return this.evaluations.get(id);
  }

  getEvaluationsByUser(userId: string): PerformanceEvaluation[] {
    return Array.from(this.evaluations.values()).filter((e) => e.user_id === userId);
  }

  getEvaluationsByMonth(month: string): PerformanceEvaluation[] {
    return Array.from(this.evaluations.values()).filter((e) => e.evaluation_period === month);
  }

  upsertEvaluation(evaluation: PerformanceEvaluation): PerformanceEvaluation {
    this.evaluations.set(evaluation.id, { ...evaluation, updated_at: new Date() });
    return this.evaluations.get(evaluation.id)!;
  }

  // Bulk upload operations
  recordBulkUpload(upload: BulkTargetUpload): BulkTargetUpload {
    this.uploads.set(upload.id, upload);
    return upload;
  }

  getBulkUploads(): BulkTargetUpload[] {
    return Array.from(this.uploads.values());
  }

  // Execution operations
  getExecution(id: string): AgentExecution | undefined {
    return this.executions.get(id);
  }

  getExecutionsByUser(userId: string): AgentExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.user_id === userId);
  }

  getExecutionsByDate(date: string): AgentExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.execution_date === date);
  }

  getExecutionsByUserAndMonth(userId: string, month: string): AgentExecution[] {
    return Array.from(this.executions.values()).filter(
      (e) => e.user_id === userId && e.execution_date.startsWith(month),
    );
  }

  getExecutionsByAgentName(agentName: string): AgentExecution[] {
    return Array.from(this.executions.values()).filter((e) => e.agent_name === agentName);
  }

  upsertExecution(execution: AgentExecution): AgentExecution {
    this.executions.set(execution.id, { ...execution, updated_at: new Date() });
    return this.executions.get(execution.id)!;
  }

  recordBulkExecutionUpload(upload: BulkExecutionUpload): BulkExecutionUpload {
    this.executionUploads.set(upload.id, upload);
    return upload;
  }

  getBulkExecutionUploads(): BulkExecutionUpload[] {
    return Array.from(this.executionUploads.values());
  }

  // Logging operations
  logActivity(log: ActivityLog): void {
    this.activityLogs.push(log);
  }

  getActivityLogs(userId?: string): ActivityLog[] {
    if (userId) {
      return this.activityLogs.filter((l) => l.user_id === userId);
    }
    return this.activityLogs;
  }

  logAudit(log: AuditLog): void {
    this.auditLogs.push(log);
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }
}

// Singleton instance
let store: DataStore | null = null;

export function getStore(): DataStore {
  if (!store) {
    store = new DataStore();
  }
  return store;
}
