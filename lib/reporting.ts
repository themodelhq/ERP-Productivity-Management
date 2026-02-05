// Reporting and export utilities

import { getStore } from './store';
import { calculateDailyMetrics, calculateUserMetrics } from './analytics';

export type ReportPeriodType = 'daily' | 'weekly' | 'monthly';

export interface PerformanceReport {
  report_date: string;
  report_period: string;
  period_type: ReportPeriodType;
  total_users: number;
  team_metrics: Array<{
    name: string;
    email: string;
    target_achievement: number;
    consistency_score: number;
    idle_percentage: number;
    performance_rating: string;
    trend: string;
  }>;
  department_summary: {
    department: string;
    avg_productivity: number;
    avg_achievement: number;
    distribution: Record<string, number>;
  };
  recommendations: string[];
}

function buildReport(period: ReportPeriodType, referenceDate: string, managerId?: string): PerformanceReport {
  const store = getStore();
  const agents = managerId ? store.getUsersByManager(managerId) : store.getUsersByRole('agent');

  const days = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;

  const teamMetrics = agents
    .map((agent) => {
      const metrics = calculateUserMetrics(agent.id, days);
      return {
        name: agent.name,
        email: agent.email,
        target_achievement: metrics?.target_achievement_rate || 0,
        consistency_score: metrics?.consistency_score || 0,
        idle_percentage: metrics?.idle_time_percentage || 0,
        performance_rating: metrics?.performance_rating || 'N/A',
        trend: metrics?.trend || 'stable',
      };
    })
    .sort((a, b) => b.target_achievement - a.target_achievement);

  const distribution = {
    excellent: teamMetrics.filter((m) => m.performance_rating === 'excellent').length,
    good: teamMetrics.filter((m) => m.performance_rating === 'good').length,
    average: teamMetrics.filter((m) => m.performance_rating === 'average').length,
    needs_improvement: teamMetrics.filter((m) => m.performance_rating === 'needs_improvement').length,
    critical: teamMetrics.filter((m) => m.performance_rating === 'critical').length,
  };

  const avgAchievement =
    teamMetrics.length > 0
      ? teamMetrics.reduce((sum, m) => sum + m.target_achievement, 0) / teamMetrics.length
      : 0;

  const dailyMetrics = calculateDailyMetrics(referenceDate);
  const scopedSessions = store
    .getSessionsByDate(referenceDate)
    .filter((session) => agents.some((agent) => agent.id === session.user_id));

  const scopedAvgProductivity =
    scopedSessions.length > 0
      ? Math.round(scopedSessions.reduce((sum, session) => sum + session.active_minutes, 0) / scopedSessions.length)
      : 0;

  const scopedAvgIdlePercentage =
    scopedSessions.length > 0
      ? Math.round(
          (scopedSessions.reduce((sum, session) => sum + session.idle_minutes, 0) /
            scopedSessions.reduce((sum, session) => sum + session.total_minutes, 0)) *
            100,
        )
      : 0;

  const recommendations: string[] = [];
  if (avgAchievement < 60) {
    recommendations.push('Team achievement is below threshold. Review workload and coaching plans.');
  }
  if (scopedAvgProductivity < 300) {
    recommendations.push('Average active minutes are low. Investigate blockers and process friction.');
  }
  if (scopedAvgIdlePercentage > 20) {
    recommendations.push('Idle percentage is high. Validate task allocation and break policies.');
  }
  if (recommendations.length === 0) {
    recommendations.push('Performance is stable. Continue monitoring and recognize top performers.');
  }

  return {
    report_date: new Date().toISOString().split('T')[0],
    report_period: referenceDate,
    period_type: period,
    total_users: agents.length,
    team_metrics: teamMetrics,
    department_summary: {
      department: 'All',
      avg_productivity: scopedSessions.length > 0 ? scopedAvgProductivity : dailyMetrics.avg_productivity,
      avg_achievement: Math.round(avgAchievement),
      distribution,
    },
    recommendations,
  };
}

export function generateDailyReport(date: string, managerId?: string): PerformanceReport {
  return buildReport('daily', date, managerId);
}

export function generateWeeklyReport(date: string, managerId?: string): PerformanceReport {
  return buildReport('weekly', date, managerId);
}

export function generateMonthlyReport(month: string, managerId?: string): PerformanceReport {
  const referenceDate = `${month}-01`;
  return buildReport('monthly', referenceDate, managerId);
}

export function exportReportAsCSV(report: PerformanceReport): string {
  let csv = `Performance Report - ${report.period_type} (${report.report_period})\n\n`;
  csv += 'TEAM METRICS\n';
  csv += 'Name,Email,Achievement %,Consistency %,Idle %,Rating,Trend\n';

  report.team_metrics.forEach((m) => {
    csv += `${m.name},${m.email},${m.target_achievement},${m.consistency_score},${m.idle_percentage},${m.performance_rating},${m.trend}\n`;
  });

  csv += '\nDEPARTMENT SUMMARY\n';
  csv += 'Department,Avg Productivity,Avg Achievement\n';
  csv += `${report.department_summary.department},${report.department_summary.avg_productivity},${report.department_summary.avg_achievement}\n`;

  csv += '\nRECOMMENDATIONS\n';
  report.recommendations.forEach((rec) => {
    csv += `- ${rec}\n`;
  });

  return csv;
}

export function exportReportAsJSON(report: PerformanceReport): string {
  return JSON.stringify(report, null, 2);
}
