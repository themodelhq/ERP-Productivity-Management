'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useSessionTracking } from '@/hooks/use-session-tracking';
import { getStore } from '@/lib/store';
import { calculateUserMetrics, generateInsightAlerts } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Clock, Zap, AlertCircle, TrendingUp, LogOut, Sparkles } from 'lucide-react';
import { AIInsightsPanel } from './ai-insights-panel';
import { IdleDetectionMonitor } from './idle-detection-monitor';
import type { UserMetrics } from '@/lib/analytics';

export function AgentDashboard() {
  const { session, logout } = useAuth();
  const sessionTracking = useSessionTracking(true);
  const [metrics, setMetrics] = useState<UserMetrics | null>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    if (!session) return;

    const store = getStore();
    const userMetrics = calculateUserMetrics(session.user_id, 30);
    setMetrics(userMetrics);

    const userAlerts = generateInsightAlerts(session.user_id, 7);
    setAlerts(userAlerts);

    // Get recent sessions
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);
    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];

    const sessions = store.getSessionsByUserAndDateRange(session.user_id, startDateStr, endDateStr);
    setRecentSessions(sessions.reverse());

    // Prepare chart data
    const data = sessions
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((s) => ({
        date: s.date,
        productivity: Math.round(s.active_minutes),
        idle: Math.round(s.idle_minutes),
        target: 420,
      }));
    setChartData(data);
  }, [session]);

  if (!session || !metrics) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Agent Dashboard</h1>
            <p className="text-sm text-slate-600">Welcome, {session.name}</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Live Session Stats */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              Today's Session
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <div className="text-3xl font-bold text-blue-600">
                  {Math.round(sessionTracking.totalMinutes)}
                </div>
                <div className="text-sm text-slate-600">Total Minutes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-600">
                  {Math.round(sessionTracking.activeMinutes)}
                </div>
                <div className="text-sm text-slate-600">Active</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-amber-600">
                  {Math.round(sessionTracking.idleMinutes)}
                </div>
                <div className="text-sm text-slate-600">Idle</div>
              </div>
              <div>
                <div className={`text-3xl font-bold ${sessionTracking.isIdle ? 'text-red-600' : 'text-green-600'}`}>
                  {sessionTracking.isIdle ? 'IDLE' : 'ACTIVE'}
                </div>
                <div className="text-sm text-slate-600">Status</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Productivity Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">
                {metrics.target_achievement_rate}%
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${metrics.target_achievement_rate}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {metrics.total_sessions} sessions tracked
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Execution Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">
                {metrics.execution_achievement_rate ?? 0}%
              </div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${metrics.execution_achievement_rate ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                {metrics.total_executions ?? 0} / {metrics.target_executions ?? 0} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Consistency Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-slate-900">{metrics.consistency_score}%</div>
              <div className="mt-2 w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${metrics.consistency_score}%` }}
                />
              </div>
              <p className="text-xs text-slate-600 mt-2">
                Performance trend: <span className="font-semibold capitalize">{metrics.trend}</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold capitalize text-slate-900">
                {metrics.performance_rating === 'excellent' && '⭐'}
                {metrics.performance_rating === 'good' && '✓'}
                {metrics.performance_rating === 'average' && '–'}
                {metrics.performance_rating === 'needs_improvement' && '⚠'}
                {metrics.performance_rating === 'critical' && '✕'}
              </div>
              <p className="text-xs text-slate-600 mt-2 capitalize">{metrics.performance_rating}</p>
            </CardContent>
          </Card>
        </div>

        {/* Productivity Chart */}
        <Card>
          <CardHeader>
            <CardTitle>7-Day Productivity Trend</CardTitle>
            <CardDescription>Active minutes vs. Idle time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="productivity" fill="#3b82f6" name="Active" />
                <Bar dataKey="idle" fill="#fbbf24" name="Idle" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* AI Insights */}
        {session && <AIInsightsPanel userId={session.user_id} />}

        {/* Idle Detection */}
        <IdleDetectionMonitor />

        {/* Alerts & Insights */}
        {alerts.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Insights & Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-lg border-l-4 ${
                      alert.severity === 'high'
                        ? 'bg-red-50 border-red-500'
                        : alert.severity === 'medium'
                          ? 'bg-amber-50 border-amber-500'
                          : 'bg-blue-50 border-blue-500'
                    }`}
                  >
                    <h4 className="font-semibold text-sm">{alert.title}</h4>
                    <p className="text-sm text-slate-700 mt-1">{alert.description}</p>
                    <p className="text-xs text-slate-600 mt-2 italic">
                      💡 {alert.actionable_recommendation}
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Sessions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Sessions</CardTitle>
            <CardDescription>Last 7 days of productivity tracking</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{session.date}</div>
                    <div className="text-xs text-slate-600">{session.activities.join(', ')}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">
                      {Math.round(session.total_minutes)} min
                    </div>
                    <div className={`text-xs ${session.total_minutes >= 420 ? 'text-green-600' : 'text-amber-600'}`}>
                      {session.total_minutes >= 420 ? '✓ Target met' : '⚠ Below target'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
