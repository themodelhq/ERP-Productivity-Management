'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getStore } from '@/lib/store';
import { calculateUserMetrics, calculateDailyMetrics, calculateDepartmentMetrics } from '@/lib/analytics';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, TrendingUp, AlertTriangle, Download, LogOut } from 'lucide-react';
import { ReportingPanel } from './reporting-panel';
import { TargetUpload } from './target-upload';
import { ExecutionUpload } from './execution-upload';

export function ManagerDashboard() {
  const { session, logout } = useAuth();
  const [teamMetrics, setTeamMetrics] = useState<any[]>([]);
  const [departmentMetrics, setDepartmentMetrics] = useState<any>(null);
  const [dailyMetrics, setDailyMetrics] = useState<any>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!session) return;

    const store = getStore();
    const teamMembers = store.getUsersByManager(session.user_id);

    // Calculate metrics for all team members
    const metrics = teamMembers.map((member) => {
      const userMetrics = calculateUserMetrics(member.id, 30);
      return {
        id: member.id,
        name: member.name,
        email: member.email,
        ...userMetrics,
      };
    });

    setTeamMetrics(metrics);

    // Department metrics
    const deptMetrics = calculateDepartmentMetrics('Sales');
    setDepartmentMetrics(deptMetrics);

    // Daily metrics
    const daily = calculateDailyMetrics(selectedDate);
    setDailyMetrics(daily);
  }, [session, selectedDate]);

  if (!session) {
    return <div>Loading...</div>;
  }

  const performanceData = teamMetrics.map((m) => ({
    name: m.name.split(' ')[0],
    achievement: m.target_achievement_rate,
    consistency: m.consistency_score,
  }));

  const performanceDistribution = departmentMetrics
    ? [
        {
          name: 'Excellent',
          value: departmentMetrics.performance_distribution.excellent,
          fill: '#10b981',
        },
        { name: 'Good', value: departmentMetrics.performance_distribution.good, fill: '#3b82f6' },
        { name: 'Average', value: departmentMetrics.performance_distribution.average, fill: '#f59e0b' },
        {
          name: 'Needs Improvement',
          value: departmentMetrics.performance_distribution.needs_improvement,
          fill: '#ef4444',
        },
        { name: 'Critical', value: departmentMetrics.performance_distribution.critical, fill: '#991b1b' },
      ]
    : [];

  const topPerformers = [...teamMetrics]
    .sort((a, b) => b.target_achievement_rate - a.target_achievement_rate)
    .slice(0, 3);

  const needsAttention = [...teamMetrics].filter((m) => m.target_achievement_rate < 60).sort((a, b) => a.target_achievement_rate - b.target_achievement_rate);


  const selectedAgentTaskRows = selectedAgent
    ? getStore()
        .getExecutionsByDate(selectedDate)
        .filter((exec) => exec.user_id === selectedAgent)
        .flatMap((exec) =>
          Object.entries(exec.executions_by_type || {}).map(([taskName, count]) => {
            const taskDefinition = getStore().getTaskTargetDefinition(taskName, session.user_id);
            const usedMinutes = (taskDefinition?.average_unit_execution_time_minutes || 0) * count;
            return { task_name: taskName, count, used_minutes: Math.round(usedMinutes) };
          }),
        )
    : [];

  const selectedAgentDailyMinutes = selectedAgentTaskRows.reduce((sum, row) => sum + row.used_minutes, 0);

  const dailyAgentSummary = getStore()
    .getUsersByManager(session.user_id)
    .map((agent) => {
      const taskRows = getStore()
        .getExecutionsByDate(selectedDate)
        .filter((exec) => exec.user_id === agent.id)
        .flatMap((exec) =>
          Object.entries(exec.executions_by_type || {}).map(([taskName, count]) => {
            const taskDefinition = getStore().getTaskTargetDefinition(taskName, session.user_id);
            return (taskDefinition?.average_unit_execution_time_minutes || 0) * count;
          }),
        );

      return {
        agent_id: agent.id,
        agent_name: agent.name,
        minutes_used: Math.round(taskRows.reduce((sum, v) => sum + v, 0)),
      };
    });


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Manager Dashboard</h1>
            <p className="text-sm text-slate-600">Team Performance & Analytics</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Team Size</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{teamMetrics.length}</div>
              <p className="text-xs text-slate-600 mt-2">Active agents</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Avg Achievement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {teamMetrics.length > 0
                  ? Math.round(
                      teamMetrics.reduce((sum, m) => sum + m.target_achievement_rate, 0) /
                        teamMetrics.length,
                    )
                  : 0}
                %
              </div>
              <p className="text-xs text-slate-600 mt-2">Target achievement rate</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Top Performer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{topPerformers.length > 0 ? '⭐' : '–'}</div>
              <p className="text-xs text-slate-600 mt-2">
                {topPerformers.length > 0 ? topPerformers[0].name : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Needs Attention</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{needsAttention.length}</div>
              <p className="text-xs text-slate-600 mt-2">Below 60% target</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team Performance</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="reports">Reports</TabsTrigger>
            <TabsTrigger value="targets">Targets Upload</TabsTrigger>
            <TabsTrigger value="executions">Execution Upload</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Performance Distribution</CardTitle>
                  <CardDescription>Team performance ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={performanceDistribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {performanceDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Team Achievement vs Consistency</CardTitle>
                  <CardDescription>Individual metrics comparison</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="achievement" fill="#3b82f6" name="Achievement %" />
                      <Bar dataKey="consistency" fill="#10b981" name="Consistency %" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Team Performance Tab */}
          <TabsContent value="team" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Team Members Performance</CardTitle>
                <CardDescription>Detailed metrics for each team member</CardDescription>
                <div className="mt-3 flex items-center gap-2">
                  <label className="text-sm text-slate-600">Date:</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="px-3 py-1 border border-slate-300 rounded text-sm"
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-4 rounded border bg-slate-50 p-3">
                  <p className="font-semibold text-sm mb-2">All Agents for {selectedDate}</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                    {dailyAgentSummary.map((row) => (
                      <div key={row.agent_id} className="rounded border bg-white px-3 py-2">
                        <p className="font-medium">{row.agent_name}</p>
                        <p>{row.minutes_used} / 420 minutes</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  {teamMetrics.map((member) => (
                    <div
                      key={member.id}
                      className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer transition"
                      onClick={() => setSelectedAgent(selectedAgent === member.id ? null : member.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h4 className="font-semibold">{member.name}</h4>
                          <p className="text-xs text-slate-600">{member.email}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{member.performance_rating === 'excellent' ? '⭐' : member.performance_rating === 'good' ? '✓' : member.performance_rating === 'average' ? '–' : '⚠'}</div>
                          <p className="text-xs text-slate-600 capitalize">{member.performance_rating}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-slate-600">Productivity</p>
                          <p className="font-bold">{member.target_achievement_rate}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Executions</p>
                          <p className="font-bold">{member.execution_achievement_rate ?? 0}%</p>
                          {member.total_executions && member.target_executions && (
                            <p className="text-xs text-slate-600">
                              {member.total_executions}/{member.target_executions} tasks
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-slate-600">Consistency</p>
                          <p className="font-bold">{member.consistency_score}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Idle Time</p>
                          <p className="font-bold">{member.idle_time_percentage}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Consistency</p>
                          <p className="font-bold">{member.consistency_score}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Idle Time</p>
                          <p className="font-bold">{member.idle_time_percentage}%</p>
                        </div>
                        <div>
                          <p className="text-slate-600">Trend</p>
                          <p className="font-bold capitalize">{member.trend}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedAgent && (
                  <div className="mt-4 rounded border p-4 bg-white">
                    <h4 className="font-semibold">Selected Agent Daily Task Usage ({selectedDate})</h4>
                    <p className="text-sm text-slate-600 mb-2">{selectedAgentDailyMinutes} / 420 minutes used</p>
                    <div className="space-y-2 text-sm">
                      {selectedAgentTaskRows.length === 0 && <p>No tasks recorded for this date.</p>}
                      {selectedAgentTaskRows.map((row, idx) => (
                        <div key={`${row.task_name}-${idx}`} className="flex justify-between border-b pb-1">
                          <span>{row.task_name} ({row.count})</span>
                          <span>{row.used_minutes} mins</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  Alerts & Issues
                </CardTitle>
              </CardHeader>
              <CardContent>
                {needsAttention.length > 0 ? (
                  <div className="space-y-3">
                    {needsAttention.map((member) => (
                      <div key={member.id} className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-red-900">{member.name}</h4>
                            <p className="text-sm text-red-800 mt-1">
                              Productivity: {member.target_achievement_rate}%
                            </p>
                            <p className="text-sm text-red-800">
                              Executions: {member.execution_achievement_rate ?? 0}%
                              {member.total_executions && member.target_executions && (
                                <span> ({member.total_executions}/{member.target_executions} tasks)</span>
                              )}
                            </p>
                            <p className="text-sm text-red-800">
                              Idle time: {member.idle_time_percentage}%
                            </p>
                          </div>
                          <Button size="sm" variant="outline">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-slate-600">All team members are performing well!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Reports Tab */}
          <TabsContent value="reports" className="space-y-4">
            <ReportingPanel managerEmail={session.email} managerId={session.user_id} />
          </TabsContent>

          <TabsContent value="targets" className="space-y-4">
            <TargetUpload />
          </TabsContent>

          <TabsContent value="executions" className="space-y-4">
            <ExecutionUpload />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
