// Analytics and insights engine for ERP productivity tracking

import { getStore } from './store';
import { PerformanceRating } from './db-schema';

export interface DailyMetrics {
  date: string;
  total_users: number;
  avg_productivity: number;
  sessions_completed: number;
  target_achievement_rate: number;
  avg_idle_percentage: number;
  top_performers: Array<{ user_id: string; score: number }>;
  needs_attention: Array<{ user_id: string; reason: string }>;
}

export interface UserMetrics {
  user_id: string;
  total_sessions: number;
  avg_daily_minutes: number;
  consistency_score: number;
  target_achievement_rate: number;
  execution_achievement_rate?: number;
  total_executions?: number;
  target_executions?: number;
  idle_time_percentage: number;
  trend: 'improving' | 'stable' | 'declining';
  performance_rating: PerformanceRating;
}

export interface DepartmentMetrics {
  department: string;
  total_users: number;
  avg_productivity: number;
  target_achievement_rate: number;
  performance_distribution: {
    excellent: number;
    good: number;
    average: number;
    needs_improvement: number;
    critical: number;
  };
}

export interface InsightAlert {
  type: 'warning' | 'opportunity' | 'achievement' | 'anomaly';
  user_id?: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  actionable_recommendation: string;
  timestamp: Date;
}

export function calculateUserMetrics(userId: string, days: number = 30): UserMetrics | null {
  const store = getStore();
  const user = store.getUser(userId);
  if (!user) return null;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const sessions = store.getSessionsByUserAndDateRange(userId, startDateStr, endDateStr);
  const targets = store.getTargetsByUserAndMonth(userId, endDateStr.substring(0, 7));
  const executions = store.getExecutionsByUserAndMonth(userId, endDateStr.substring(0, 7));

  // Calculate execution metrics
  let totalExecutions = 0;
  let targetExecutions = 0;
  let executionAchievementRate = 0;

  if (executions.length > 0) {
    totalExecutions = executions.reduce((sum, e) => sum + e.total_executions, 0);
    const executionTargets = targets.filter((t) => t.target_executions && t.target_executions > 0);
    targetExecutions = executionTargets.reduce((sum, t) => sum + (t.target_executions || 0), 0);
    executionAchievementRate = targetExecutions > 0 ? (totalExecutions / targetExecutions) * 100 : 0;
  }

  if (sessions.length === 0) {
    return {
      user_id: userId,
      total_sessions: 0,
      avg_daily_minutes: 0,
      consistency_score: 0,
      target_achievement_rate: 0,
      execution_achievement_rate: Math.round(executionAchievementRate),
      total_executions: totalExecutions,
      target_executions: targetExecutions,
      idle_time_percentage: 0,
      trend: 'stable',
      performance_rating: 'average',
    };
  }

  const avgDailyMinutes = sessions.reduce((sum, s) => sum + s.total_minutes, 0) / sessions.length;
  const totalIdleMinutes = sessions.reduce((sum, s) => sum + s.idle_minutes, 0);
  const totalMinutes = sessions.reduce((sum, s) => sum + s.total_minutes, 0);
  const idlePercentage = (totalIdleMinutes / totalMinutes) * 100;

  // Consistency: how many days met the 420-minute target
  const achievedDays = sessions.filter((s) => s.total_minutes >= 420).length;
  const achievementRate = (achievedDays / sessions.length) * 100;

  // Consistency score (0-100): frequency of hitting targets
  const consistencyScore = Math.min(100, (achievedDays / sessions.length) * 100);

  // Determine trend
  const halfPoint = Math.floor(sessions.length / 2);
  const firstHalf = sessions.slice(0, halfPoint);
  const secondHalf = sessions.slice(halfPoint);
  const firstHalfAvg =
    firstHalf.reduce((sum, s) => sum + s.total_minutes, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, s) => sum + s.total_minutes, 0) / secondHalf.length;

  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (secondHalfAvg > firstHalfAvg * 1.05) trend = 'improving';
  else if (secondHalfAvg < firstHalfAvg * 0.95) trend = 'declining';

  // Determine performance rating
  let performanceRating: PerformanceRating = 'average';
  if (achievementRate >= 90 && idlePercentage <= 12) {
    performanceRating = 'excellent';
  } else if (achievementRate >= 75 && idlePercentage <= 15) {
    performanceRating = 'good';
  } else if (achievementRate < 50 || idlePercentage > 25) {
    performanceRating = 'critical';
  } else if (achievementRate < 60 || idlePercentage > 20) {
    performanceRating = 'needs_improvement';
  }

  return {
    user_id: userId,
    total_sessions: sessions.length,
    avg_daily_minutes: Math.round(avgDailyMinutes),
    consistency_score: Math.round(consistencyScore),
    target_achievement_rate: Math.round(achievementRate),
    execution_achievement_rate: Math.round(executionAchievementRate),
    total_executions: totalExecutions,
    target_executions: targetExecutions,
    idle_time_percentage: Math.round(idlePercentage),
    trend,
    performance_rating: performanceRating,
  };
}

export function calculateDailyMetrics(date: string): DailyMetrics {
  const store = getStore();
  const sessions = store.getSessionsByDate(date);
  const targets = store.getTargetsByDate(date);

  const avgProductivity =
    sessions.length > 0
      ? Math.round(
          sessions.reduce((sum, s) => sum + s.active_minutes, 0) / sessions.length,
        )
      : 0;

  const achievedTargets = targets.filter((t) => t.status === 'achieved').length;
  const targetAchievementRate =
    targets.length > 0 ? Math.round((achievedTargets / targets.length) * 100) : 0;

  const avgIdlePercentage =
    sessions.length > 0
      ? Math.round(
          (sessions.reduce((sum, s) => sum + s.idle_minutes, 0) /
            sessions.reduce((sum, s) => sum + s.total_minutes, 0)) *
          100,
        )
      : 0;

  // Top performers for the day
  const performers = sessions
    .map((s) => ({
      user_id: s.user_id,
      score: s.active_minutes / 420,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  // Users who need attention
  const needsAttention = sessions
    .filter((s) => s.total_minutes < 300 || s.idle_minutes > s.total_minutes * 0.3)
    .map((s) => ({
      user_id: s.user_id,
      reason:
        s.total_minutes < 300
          ? 'Low productivity'
          : 'High idle time',
    }));

  return {
    date,
    total_users: new Set(sessions.map((s) => s.user_id)).size,
    avg_productivity: avgProductivity,
    sessions_completed: sessions.length,
    target_achievement_rate: targetAchievementRate,
    avg_idle_percentage: avgIdlePercentage,
    top_performers: performers,
    needs_attention: needsAttention,
  };
}

export function calculateDepartmentMetrics(department: string): DepartmentMetrics {
  const store = getStore();
  const users = store
    .getAllUsers()
    .filter((u) => u.department === department && u.role === 'agent');

  const userMetrics = users
    .map((u) => calculateUserMetrics(u.id, 30))
    .filter((m) => m !== null) as UserMetrics[];

  const avgProductivity =
    userMetrics.length > 0
      ? Math.round(
          userMetrics.reduce((sum, m) => sum + m.avg_daily_minutes, 0) / userMetrics.length,
        )
      : 0;

  const achievementRate =
    userMetrics.length > 0
      ? Math.round(
          userMetrics.reduce((sum, m) => sum + m.target_achievement_rate, 0) /
          userMetrics.length,
        )
      : 0;

  const distribution = {
    excellent: userMetrics.filter((m) => m.performance_rating === 'excellent').length,
    good: userMetrics.filter((m) => m.performance_rating === 'good').length,
    average: userMetrics.filter((m) => m.performance_rating === 'average').length,
    needs_improvement: userMetrics.filter((m) => m.performance_rating === 'needs_improvement')
      .length,
    critical: userMetrics.filter((m) => m.performance_rating === 'critical').length,
  };

  return {
    department,
    total_users: users.length,
    avg_productivity: avgProductivity,
    target_achievement_rate: achievementRate,
    performance_distribution: distribution,
  };
}

export function generateInsightAlerts(userId: string, days: number = 7): InsightAlert[] {
  const store = getStore();
  const metrics = calculateUserMetrics(userId, days);
  const alerts: InsightAlert[] = [];

  if (!metrics) return alerts;

  // Alert: Declining performance
  if (metrics.trend === 'declining') {
    alerts.push({
      type: 'warning',
      user_id: userId,
      title: 'Performance Declining',
      description: `Your productivity has declined over the past ${days} days. Average daily minutes have decreased.`,
      severity: 'high',
      actionable_recommendation:
        'Review your schedule and identify blockers. Consider discussing workload with your manager.',
      timestamp: new Date(),
    });
  }

  // Alert: Low achievement rate
  if (metrics.target_achievement_rate < 60) {
    alerts.push({
      type: 'warning',
      user_id: userId,
      title: 'Target Achievement Below 60%',
      description: 'You have not met your productivity targets for most days this period.',
      severity: 'high',
      actionable_recommendation:
        'Analyze daily patterns to identify time-wasting activities. Implement focused work blocks.',
      timestamp: new Date(),
    });
  }

  // Alert: High idle time
  if (metrics.idle_time_percentage > 25) {
    alerts.push({
      type: 'warning',
      user_id: userId,
      title: 'High Idle Time Detected',
      description: `Your idle time is ${metrics.idle_time_percentage}%, significantly above the 15% benchmark.`,
      severity: 'medium',
      actionable_recommendation:
        'Review idle periods and ensure your system locks are not too aggressive. Take scheduled breaks instead.',
      timestamp: new Date(),
    });
  }

  // Alert: Improving performance (positive)
  if (metrics.trend === 'improving' && metrics.target_achievement_rate >= 80) {
    alerts.push({
      type: 'achievement',
      user_id: userId,
      title: 'Great Performance Improvement',
      description: 'Your productivity metrics show consistent improvement over time.',
      severity: 'low',
      actionable_recommendation: 'Keep up the excellent work! Consider mentoring other team members.',
      timestamp: new Date(),
    });
  }

  // Alert: Excellent performance
  if (metrics.performance_rating === 'excellent') {
    alerts.push({
      type: 'achievement',
      user_id: userId,
      title: 'Top Performer Recognition',
      description:
        'You have achieved excellent performance with high targets and low idle time.',
      severity: 'low',
      actionable_recommendation: 'Maintain your current pace and consider taking on additional responsibilities.',
      timestamp: new Date(),
    });
  }

  // Anomaly: Sudden drop in activity
  const store_inst = getStore();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = endDate.toISOString().split('T')[0];

  const recentSessions = store_inst.getSessionsByUserAndDateRange(userId, startDateStr, endDateStr);
  if (recentSessions.length > 0) {
    const lastSession = recentSessions[recentSessions.length - 1];
    const avgMinutes = recentSessions.reduce((sum, s) => sum + s.total_minutes, 0) / recentSessions.length;

    if (lastSession.total_minutes < avgMinutes * 0.5) {
      alerts.push({
        type: 'anomaly',
        user_id: userId,
        title: 'Significant Productivity Drop',
        description: 'Your most recent session shows significantly lower activity than your average.',
        severity: 'medium',
        actionable_recommendation:
          'Check if you were working on a single focused task or if there were technical issues.',
        timestamp: new Date(),
      });
    }
  }

  return alerts;
}
