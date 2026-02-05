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
  PerformanceRating,
  AgentExecution,
  BulkExecutionUpload,
} from './db-schema';

class DataStore {
  private users: Map<string, User> = new Map();
  private sessions: Map<string, ProductivitySession> = new Map();
  private targets: Map<string, ProductivityTarget> = new Map();
  private evaluations: Map<string, PerformanceEvaluation> = new Map();
  private uploads: Map<string, BulkTargetUpload> = new Map();
  private executions: Map<string, AgentExecution> = new Map();
  private executionUploads: Map<string, BulkExecutionUpload> = new Map();
  private activityLogs: ActivityLog[] = [];
  private auditLogs: AuditLog[] = [];

  constructor() {
    this.initializeDemo();
  }

  private initializeDemo() {
    // Create demo users
    const manager: User = {
      id: 'manager-1',
      email: 'manager@company.com',
      name: 'John Manager',
      role: 'manager',
      department: 'Sales',
      created_at: new Date('2024-01-01'),
      updated_at: new Date(),
      is_active: true,
      settings: {
        notifications_enabled: true,
        idle_detection_enabled: true,
        privacy_mode: false,
      },
    };

    const admin: User = {
      id: 'admin-1',
      email: 'admin@company.com',
      name: 'Admin User',
      role: 'admin',
      created_at: new Date('2024-01-01'),
      updated_at: new Date(),
      is_active: true,
      settings: {
        notifications_enabled: true,
        idle_detection_enabled: true,
        privacy_mode: false,
      },
    };

    const agents: User[] = [
      {
        id: 'agent-1',
        email: 'agent1@company.com',
        name: 'Alice Johnson',
        role: 'agent',
        department: 'Sales',
        manager_id: 'manager-1',
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
        is_active: true,
        settings: {
          notifications_enabled: true,
          idle_detection_enabled: true,
          privacy_mode: true,
        },
      },
      {
        id: 'agent-2',
        email: 'agent2@company.com',
        name: 'Bob Smith',
        role: 'agent',
        department: 'Sales',
        manager_id: 'manager-1',
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
        is_active: true,
        settings: {
          notifications_enabled: true,
          idle_detection_enabled: true,
          privacy_mode: true,
        },
      },
      {
        id: 'agent-3',
        email: 'agent3@company.com',
        name: 'Carol White',
        role: 'agent',
        department: 'Support',
        manager_id: 'manager-1',
        created_at: new Date('2024-01-15'),
        updated_at: new Date(),
        is_active: true,
        settings: {
          notifications_enabled: true,
          idle_detection_enabled: true,
          privacy_mode: true,
        },
      },
    ];

    [manager, admin, ...agents].forEach((user) => {
      this.users.set(user.id, user);
    });

    // Create demo sessions for the past 30 days
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      agents.forEach((agent) => {
        const sessionId = `session-${agent.id}-${dateStr}`;
        const startTime = new Date(date);
        startTime.setHours(9, 0, 0);

        const totalMinutes = Math.random() > 0.3 ? 420 : 360 + Math.random() * 60;
        const idleMinutes = totalMinutes * (0.1 + Math.random() * 0.2);
        const activeMinutes = totalMinutes - idleMinutes;

        const session: ProductivitySession = {
          id: sessionId,
          user_id: agent.id,
          date: dateStr,
          start_time: startTime,
          end_time: new Date(startTime.getTime() + totalMinutes * 60000),
          total_minutes: Math.round(totalMinutes),
          active_minutes: Math.round(activeMinutes),
          idle_minutes: Math.round(idleMinutes),
          idle_events: [],
          status: 'completed',
          activities: ['Salesforce CRM', 'Email', 'Documentation', 'Calls'],
          created_at: startTime,
          updated_at: new Date(),
        };

        this.sessions.set(sessionId, session);

        // Create target
        const targetId = `target-${agent.id}-${dateStr}`;
        const target: ProductivityTarget = {
          id: targetId,
          user_id: agent.id,
          target_date: dateStr,
          target_minutes: 420,
          status: session.total_minutes >= 400 ? 'achieved' : 'missed',
          created_at: startTime,
          updated_at: new Date(),
        };

        this.targets.set(targetId, target);
      });
    }

    // Create monthly evaluations
    agents.forEach((agent) => {
      const evaluation: PerformanceEvaluation = {
        id: `eval-${agent.id}-2025-02`,
        user_id: agent.id,
        evaluation_period: '2025-02',
        total_sessions: 20,
        target_achievement_rate: 75 + Math.random() * 25,
        average_daily_productivity: 350 + Math.random() * 100,
        idle_duration_percentage: 10 + Math.random() * 15,
        consistency_score: 70 + Math.random() * 30,
        performance_rating: (['excellent', 'good', 'average'] as PerformanceRating[])[
          Math.floor(Math.random() * 3)
        ],
        actionable_insights: [
          'Maintain consistent daily productivity levels',
          'Reduce idle time during peak hours',
          'Focus on email response times',
        ],
        created_at: new Date(),
        updated_at: new Date(),
      };

      this.evaluations.set(evaluation.id, evaluation);
    });
  }

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
