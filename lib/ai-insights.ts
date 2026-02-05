// AI-powered insights and recommendations engine

import { calculateUserMetrics, generateInsightAlerts } from './analytics';
import type { InsightAlert } from './analytics';

export interface AIInsight {
  category: 'performance' | 'behavior' | 'wellbeing' | 'team_dynamics' | 'anomaly';
  title: string;
  description: string;
  confidence: number; // 0-100
  actionable_steps: string[];
  predicted_outcome?: string;
}

export function generateAIInsights(userId: string): AIInsight[] {
  const insights: AIInsight[] = [];
  const metrics = calculateUserMetrics(userId, 30);
  const alerts = generateInsightAlerts(userId, 7);

  if (!metrics) return insights;

  // Performance Pattern Insight
  if (metrics.target_achievement_rate >= 85 && metrics.consistency_score >= 80) {
    insights.push({
      category: 'performance',
      title: 'Consistent High Performer',
      description:
        'Your metrics show consistent high performance with excellent target achievement and reliability.',
      confidence: 95,
      actionable_steps: [
        'Maintain your current work patterns',
        'Consider mentoring struggling teammates',
        'Document your productivity techniques',
      ],
      predicted_outcome: 'Continued excellent performance and potential career advancement',
    });
  }

  // Productivity Pattern Insight
  if (metrics.idle_time_percentage < 10) {
    insights.push({
      category: 'behavior',
      title: 'Highly Focused Work Style',
      description: 'Your idle time is exceptionally low, suggesting deep focus and minimal distractions.',
      confidence: 90,
      actionable_steps: [
        'Ensure you are taking adequate breaks',
        'Monitor for burnout signs',
        'Balance focus time with collaborative activities',
      ],
      predicted_outcome: 'High quality output with managed stress levels',
    });
  }

  // Well-being Insight
  if (metrics.idle_time_percentage > 25 && metrics.trend === 'declining') {
    insights.push({
      category: 'wellbeing',
      title: 'Work-Life Balance Consideration',
      description:
        'Increasing idle time combined with declining performance may indicate fatigue or personal factors.',
      confidence: 80,
      actionable_steps: [
        'Schedule a check-in with your manager',
        'Review your workload',
        'Consider taking a mental health day',
        'Evaluate external stressors',
      ],
      predicted_outcome: 'Improved well-being and sustainable performance',
    });
  }

  // Improvement Opportunity
  if (metrics.target_achievement_rate < 70 && metrics.consistency_score < 60) {
    insights.push({
      category: 'performance',
      title: 'Performance Improvement Opportunity',
      description:
        'Your metrics indicate room for improvement in both achievement and consistency.',
      confidence: 85,
      actionable_steps: [
        'Analyze your top distraction times',
        'Implement focused work blocks (Pomodoro technique)',
        'Set daily micro-goals',
        'Request manager support',
      ],
      predicted_outcome: '15-25% improvement in target achievement within 30 days',
    });
  }

  // Consistency Pattern
  if (Math.abs(metrics.total_sessions - 20) > 5) {
    insights.push({
      category: 'behavior',
      title: 'Session Frequency Pattern',
      description:
        `You're averaging ${metrics.total_sessions} sessions over 30 days, indicating ${metrics.total_sessions > 25 ? 'very consistent' : 'variable'} attendance.`,
      confidence: 75,
      actionable_steps: [
        metrics.total_sessions > 25
          ? 'Maintain your consistent presence'
          : 'Aim for more consistent daily sessions',
        'Track attendance trends',
      ],
    });
  }

  // Team Comparison Insight
  if (metrics.performance_rating === 'excellent') {
    insights.push({
      category: 'team_dynamics',
      title: 'Top Performer Recognition',
      description: 'You are performing at an elite level compared to your peers.',
      confidence: 90,
      actionable_steps: [
        'Share your techniques with team members',
        'Lead productivity workshops',
        'Mentor underperforming colleagues',
      ],
      predicted_outcome: 'Enhanced team performance and your professional growth',
    });
  }

  // Anomaly Detection
  const hasAnomalies = alerts.some((a) => a.type === 'anomaly');
  if (hasAnomalies) {
    insights.push({
      category: 'anomaly',
      title: 'Unusual Activity Pattern Detected',
      description:
        'Your recent session shows unusual patterns compared to your typical behavior.',
      confidence: 70,
      actionable_steps: [
        'Review what you were working on',
        'Check for technical issues',
        'Verify time tracking accuracy',
      ],
    });
  }

  return insights;
}

export function generateTeamInsights(managerUserId: string): AIInsight[] {
  const insights: AIInsight[] = [];

  // This would need team metrics - simplified version for demo
  insights.push({
    category: 'team_dynamics',
    title: 'Team Performance Summary',
    description: 'Your team metrics have been calculated and analyzed.',
    confidence: 85,
    actionable_steps: [
      'Review individual performance dashboards',
      'Identify coaching opportunities',
      'Celebrate top performers',
    ],
  });

  return insights;
}

export function predictFuturePerformance(userId: string): {
  predicted_achievement_rate: number;
  confidence: number;
  trend_direction: 'up' | 'down' | 'stable';
  estimated_time_to_target: string;
} {
  const metrics = calculateUserMetrics(userId, 30);

  if (!metrics) {
    return {
      predicted_achievement_rate: 0,
      confidence: 0,
      trend_direction: 'stable',
      estimated_time_to_target: 'Unknown',
    };
  }

  // Simple predictive model based on current trend
  let predictedRate = metrics.target_achievement_rate;
  let trendFactor = 0;

  if (metrics.trend === 'improving') {
    trendFactor = 5;
  } else if (metrics.trend === 'declining') {
    trendFactor = -5;
  }

  predictedRate = Math.min(100, Math.max(0, predictedRate + trendFactor));

  const timeToTarget =
    metrics.target_achievement_rate < 80
      ? metrics.trend === 'improving'
        ? '2-3 weeks'
        : '4-6 weeks'
      : 'Already at target';

  return {
    predicted_achievement_rate: Math.round(predictedRate),
    confidence: 70,
    trend_direction: metrics.trend,
    estimated_time_to_target: timeToTarget,
  };
}
