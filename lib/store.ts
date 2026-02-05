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

interface PersistedStoreSnapshot {
  users: User[];
  passwordsByUserId: Array<[string, string]>;
  sessions: ProductivitySession[];
  targets: ProductivityTarget[];
  evaluations: PerformanceEvaluation[];
  uploads: BulkTargetUpload[];
  executions: AgentExecution[];
  executionUploads: BulkExecutionUpload[];
  taskTargetDefinitions: TaskTargetDefinition[];
}

const STORAGE_KEY = 'erp-data-store-v1';

function toDate(value: string | Date | undefined): Date | undefined {
  if (!value) return undefined;
  return value instanceof Date ? value : new Date(value);
}

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

  constructor() {
    this.hydrate();
  }

  private get canPersist(): boolean {
    return typeof window !== 'undefined' && !!window.localStorage;
  }

  private hydrate(): void {
    if (!this.canPersist) return;

    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;

    try {
      const parsed = JSON.parse(raw) as PersistedStoreSnapshot;

      parsed.users.forEach((user) => {
        this.users.set(user.id, {
          ...user,
          created_at: toDate(user.created_at)!,
          updated_at: toDate(user.updated_at)!,
        });
      });

      parsed.passwordsByUserId.forEach(([id, password]) => {
        this.passwordsByUserId.set(id, password);
      });

      parsed.sessions.forEach((session) => {
        this.sessions.set(session.id, {
          ...session,
          start_time: toDate(session.start_time)!,
          end_time: toDate(session.end_time),
          created_at: toDate(session.created_at)!,
          updated_at: toDate(session.updated_at)!,
          idle_events: (session.idle_events || []).map((event) => ({
            ...event,
            start_time: toDate(event.start_time)!,
            end_time: toDate(event.end_time)!,
          })),
        });
      });

      parsed.targets.forEach((target) => {
        this.targets.set(target.id, {
          ...target,
          created_at: toDate(target.created_at)!,
          updated_at: toDate(target.updated_at)!,
        });
      });

      parsed.evaluations.forEach((evaluation) => {
        this.evaluations.set(evaluation.id, {
          ...evaluation,
          created_at: toDate(evaluation.created_at)!,
          updated_at: toDate(evaluation.updated_at)!,
        });
      });

      parsed.uploads.forEach((upload) => {
        this.uploads.set(upload.id, {
          ...upload,
          upload_date: toDate(upload.upload_date)!,
        });
      });

      parsed.executions.forEach((execution) => {
        this.executions.set(execution.id, {
          ...execution,
          created_at: toDate(execution.created_at)!,
          updated_at: toDate(execution.updated_at)!,
        });
      });

      parsed.executionUploads.forEach((upload) => {
        this.executionUploads.set(upload.id, {
          ...upload,
          upload_date: toDate(upload.upload_date)!,
        });
      });

      parsed.taskTargetDefinitions.forEach((definition) => {
        const ownerId = definition.owner_id || 'unknown';
        const normalized = { ...definition, owner_id: ownerId };
        const key = `${ownerId}::${definition.task_name.trim().toLowerCase()}`;
        this.taskTargetDefinitions.set(key, normalized);
      });
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(): void {
    if (!this.canPersist) return;

    const snapshot: PersistedStoreSnapshot = {
      users: Array.from(this.users.values()),
      passwordsByUserId: Array.from(this.passwordsByUserId.entries()),
      sessions: Array.from(this.sessions.values()),
      targets: Array.from(this.targets.values()),
      evaluations: Array.from(this.evaluations.values()),
      uploads: Array.from(this.uploads.values()),
      executions: Array.from(this.executions.values()),
      executionUploads: Array.from(this.executionUploads.values()),
      taskTargetDefinitions: Array.from(this.taskTargetDefinitions.values()),
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUser(id: string): User | undefined {
    return this.getUserById(id);
  }

  getUserByEmail(email: string): User | undefined {
    const normalizedEmail = email.trim().toLowerCase();

    for (const user of this.users.values()) {
      if (user.email === normalizedEmail) {
        return user;
      }
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
    this.persist();
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
    this.persist();
    return updated;
  }

  setTaskTargetDefinitions(ownerId: string, definitions: Omit<TaskTargetDefinition, 'owner_id'>[]): void {
    const ownerPrefix = `${ownerId}::`;
    Array.from(this.taskTargetDefinitions.keys()).forEach((key) => {
      if (key.startsWith(ownerPrefix)) {
        this.taskTargetDefinitions.delete(key);
      }
    });

    definitions.forEach((definition) => {
      const normalizedTaskName = definition.task_name.trim();
      const key = `${ownerId}::${normalizedTaskName.toLowerCase()}`;
      this.taskTargetDefinitions.set(key, {
        ...definition,
        task_name: normalizedTaskName,
        owner_id: ownerId,
      });
    });
    this.persist();
  }

  getTaskTargetDefinitions(ownerId?: string): TaskTargetDefinition[] {
    const definitions = Array.from(this.taskTargetDefinitions.values());
    if (!ownerId) return definitions;
    return definitions.filter((definition) => definition.owner_id === ownerId);
  }

  getTaskTargetDefinition(taskName: string, ownerId?: string): TaskTargetDefinition | undefined {
    const normalizedTaskName = taskName.trim().toLowerCase();

    if (ownerId) {
      return this.taskTargetDefinitions.get(`${ownerId}::${normalizedTaskName}`);
    }

    return Array.from(this.taskTargetDefinitions.values()).find(
      (definition) => definition.task_name.toLowerCase() === normalizedTaskName,
    );
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
    this.persist();
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
    this.persist();
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
    this.persist();
    return this.evaluations.get(evaluation.id)!;
  }

  // Bulk upload operations
  recordBulkUpload(upload: BulkTargetUpload): BulkTargetUpload {
    this.uploads.set(upload.id, upload);
    this.persist();
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
    this.persist();
    return this.executions.get(execution.id)!;
  }

  recordBulkExecutionUpload(upload: BulkExecutionUpload): BulkExecutionUpload {
    this.executionUploads.set(upload.id, upload);
    this.persist();
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
