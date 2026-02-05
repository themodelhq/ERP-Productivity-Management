// Database Schema Types for ERP Productivity Management System

export type UserRole = 'agent' | 'manager' | 'admin';
export type SessionStatus = 'active' | 'idle' | 'paused' | 'completed';
export type TargetStatus = 'pending' | 'in_progress' | 'achieved' | 'missed';
export type PerformanceRating = 'excellent' | 'good' | 'average' | 'needs_improvement' | 'critical';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  manager_id?: string;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
  settings: {
    notifications_enabled: boolean;
    idle_detection_enabled: boolean;
    privacy_mode: boolean;
  };
}

export interface ProductivitySession {
  id: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  start_time: Date;
  end_time?: Date;
  total_minutes: number; // Target: 420 minutes (7 hours)
  active_minutes: number;
  idle_minutes: number;
  idle_events: IdleEvent[];
  status: SessionStatus;
  activities: string[]; // List of tracked activities/applications
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface IdleEvent {
  id: string;
  session_id: string;
  start_time: Date;
  end_time: Date;
  duration_minutes: number;
  detection_method: 'mouse' | 'keyboard' | 'screen' | 'auto_lock';
  flagged_as_wfh_break: boolean;
}

export interface ProductivityTarget {
  id: string;
  user_id: string;
  target_date: string; // YYYY-MM-DD
  target_minutes: number; // Usually 420 minutes
  target_executions?: number; // Number of tasks/executions to complete
  status: TargetStatus;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface TaskTargetDefinition {
  task_name: string;
  average_unit_execution_time_minutes: number;
  target_daily: number;
}

export interface AgentExecution {
  id: string;
  user_id: string;
  agent_name: string;
  execution_date: string; // YYYY-MM-DD
  total_executions: number; // Total executions across all task types
  executions_by_type?: Record<string, number>; // Breakdown by task type
  created_at: Date;
  updated_at: Date;
}

export interface BulkExecutionUpload {
  id: string;
  uploaded_by: string; // manager_id or admin_id
  upload_date: Date;
  file_name: string;
  rows_processed: number;
  rows_successful: number;
  rows_failed: number;
  error_details?: Array<{
    row: number;
    agent_name: string;
    error: string;
  }>;
  status: 'processing' | 'completed' | 'failed';
}

export interface BulkTargetUpload {
  id: string;
  uploaded_by: string; // manager_id
  upload_date: Date;
  file_name: string;
  rows_processed: number;
  rows_successful: number;
  rows_failed: number;
  error_details?: Array<{
    row: number;
    email: string;
    error: string;
  }>;
  status: 'processing' | 'completed' | 'failed';
}

export interface PerformanceEvaluation {
  id: string;
  user_id: string;
  evaluation_period: string; // YYYY-MM (month)
  total_sessions: number;
  target_achievement_rate: number; // 0-100%
  average_daily_productivity: number; // minutes
  idle_duration_percentage: number; // 0-100%
  consistency_score: number; // 0-100%
  performance_rating: PerformanceRating;
  actionable_insights: string[];
  manager_notes?: string;
  created_at: Date;
  updated_at: Date;
}

export interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details: Record<string, any>;
  timestamp: Date;
  ip_address?: string;
}

export interface AuditLog {
  id: string;
  actor_id: string; // who performed the action
  action: string;
  resource_type: string;
  resource_id: string;
  changes: Record<string, any>;
  timestamp: Date;
  ip_address?: string;
}
