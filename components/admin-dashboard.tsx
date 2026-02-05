'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Upload, Users, Settings, LogOut, Download } from 'lucide-react';
import { TargetUpload } from '@/components/target-upload';
import { ExecutionUpload } from '@/components/execution-upload';

export function AdminDashboard() {
  const { session, logout } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  useEffect(() => {
    const store = getStore();
    const allUsers = store.getAllUsers();
    setUsers(allUsers);

    // Calculate system stats
    const agents = allUsers.filter((u) => u.role === 'agent');
    const managers = allUsers.filter((u) => u.role === 'manager');

    setSystemStats({
      total_users: allUsers.length,
      agents: agents.length,
      managers: managers.length,
      admins: allUsers.filter((u) => u.role === 'admin').length,
      active_users: allUsers.filter((u) => u.is_active).length,
    });
  }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    // In production, parse Excel file and import targets
    console.log('[v0] File selected:', file.name);
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const usersByRole = {
    agent: users.filter((u) => u.role === 'agent'),
    manager: users.filter((u) => u.role === 'manager'),
    admin: users.filter((u) => u.role === 'admin'),
  };

  const roleDistribution = [
    { name: 'Agents', value: usersByRole.agent.length, fill: '#3b82f6' },
    { name: 'Managers', value: usersByRole.manager.length, fill: '#10b981' },
    { name: 'Admins', value: usersByRole.admin.length, fill: '#8b5cf6' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Admin Dashboard</h1>
            <p className="text-sm text-slate-600">System Administration & Configuration</p>
          </div>
          <Button variant="outline" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* System Stats */}
        {systemStats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{systemStats.total_users}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{systemStats.agents}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Managers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{systemStats.managers}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Admins</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{systemStats.admins}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{systemStats.active_users}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="users" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="targets">
              <Upload className="w-4 h-4 mr-2" />
              Targets
            </TabsTrigger>
            <TabsTrigger value="executions">
              <Upload className="w-4 h-4 mr-2" />
              Executions
            </TabsTrigger>
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>View and manage all system users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Agents */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-blue-500 rounded-full" />
                      Agents ({usersByRole.agent.length})
                    </h3>
                    <div className="space-y-2 ml-4">
                      {usersByRole.agent.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-blue-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-slate-600">{user.email}</p>
                          </div>
                          <div className="text-xs">
                            <span
                              className={`px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Managers */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-green-500 rounded-full" />
                      Managers ({usersByRole.manager.length})
                    </h3>
                    <div className="space-y-2 ml-4">
                      {usersByRole.manager.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-slate-600">{user.email}</p>
                          </div>
                          <div className="text-xs">
                            <span
                              className={`px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Admins */}
                  <div>
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <span className="w-3 h-3 bg-purple-500 rounded-full" />
                      Admins ({usersByRole.admin.length})
                    </h3>
                    <div className="space-y-2 ml-4">
                      {usersByRole.admin.map((user) => (
                        <div key={user.id} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                          <div>
                            <p className="font-medium text-sm">{user.name}</p>
                            <p className="text-xs text-slate-600">{user.email}</p>
                          </div>
                          <div className="text-xs">
                            <span
                              className={`px-2 py-1 rounded ${user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                            >
                              {user.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Targets Upload Tab */}
          <TabsContent value="targets" className="space-y-4">
            <TargetUpload />
          </TabsContent>

          {/* Executions Upload Tab */}
          <TabsContent value="executions" className="space-y-4">
            <ExecutionUpload />
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Settings</CardTitle>
                <CardDescription>Configure ERP system parameters</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Daily Target (minutes)</label>
                    <Input type="number" value={420} defaultValue={420} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Idle Threshold (minutes)</label>
                    <Input type="number" value={5} defaultValue={5} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Idle Detection Enabled
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="w-4 h-4" />
                      <span className="text-sm text-slate-600">Enable WFH idle monitoring</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Privacy Mode
                    </label>
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm text-slate-600">Hide agent names from reports</span>
                    </div>
                  </div>
                </div>

                <Button className="w-full mt-4">Save Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
