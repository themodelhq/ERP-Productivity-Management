// Reporting and export utilities

import { getStore } from './store';
import { calculateUserMetrics, calculateDepartmentMetrics } from './analytics';

export interface PerformanceReport {
  report_date: string;
  report_period: string;
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

export function generateMonthlyReport(month: string): PerformanceReport {
  const store = getStore();
  const agents = store.getUsersByRole('agent');

  const teamMetrics = agents
    .map((agent) => {
      const metrics = calculateUserMetrics(agent.id, 30);
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

  const departmentMetrics = calculateDepartmentMetrics('Sales');

  const avgAchievement =
    teamMetrics.reduce((sum, m) => sum + m.target_achievement, 0) / teamMetrics.length;

  // Generate recommendations based on data
  const recommendations: string[] = [];

  if (avgAchievement < 60) {
    recommendations.push(
      'Team is underperforming. Consider reviewing workload distribution and providing additional support.',
    );
  } else if (avgAchievement >= 85) {
    recommendations.push('Team is performing excellently. Consider recognizing top performers.');
  }

  const highIdleUsers = teamMetrics.filter((m) => m.idle_percentage > 20);
  if (highIdleUsers.length > 0) {
    recommendations.push(
      `${highIdleUsers.length} team member(s) show high idle time. Review system lock settings.`,
    );
  }

  const decliningUsers = teamMetrics.filter((m) => m.trend === 'declining');
  if (decliningUsers.length > 0) {
    recommendations.push(
      `${decliningUsers.length} team member(s) showing declining performance. Schedule 1-on-1s.`,
    );
  }

  return {
    report_date: new Date().toISOString().split('T')[0],
    report_period: month,
    total_users: agents.length,
    team_metrics: teamMetrics,
    department_summary: {
      department: 'Sales',
      avg_productivity: departmentMetrics.avg_productivity,
      avg_achievement: departmentMetrics.target_achievement_rate,
      distribution: {
        excellent: departmentMetrics.performance_distribution.excellent,
        good: departmentMetrics.performance_distribution.good,
        average: departmentMetrics.performance_distribution.average,
        needs_improvement: departmentMetrics.performance_distribution.needs_improvement,
        critical: departmentMetrics.performance_distribution.critical,
      },
    },
    recommendations,
  };
}

export function exportReportAsCSV(report: PerformanceReport): string {
  let csv = 'Performance Report - ' + report.report_period + '\n\n';

  csv += 'TEAM METRICS\n';
  csv += 'Name,Email,Achievement %,Consistency %,Idle %,Rating,Trend\n';

  report.team_metrics.forEach((m) => {
    csv += `${m.name},${m.email},${m.target_achievement},${m.consistency_score},${m.idle_percentage},${m.performance_rating},${m.trend}\n`;
  });

  csv += '\n\nDEPARTMENT SUMMARY\n';
  csv += `Department,Avg Productivity,Avg Achievement\n`;
  csv += `${report.department_summary.department},${report.department_summary.avg_productivity},${report.department_summary.avg_achievement}\n`;

  csv += '\n\nRECOMMENDATIONS\n';
  report.recommendations.forEach((rec) => {
    csv += `- ${rec}\n`;
  });

  return csv;
}

export function exportReportAsJSON(report: PerformanceReport): string {
  return JSON.stringify(report, null, 2);
}
