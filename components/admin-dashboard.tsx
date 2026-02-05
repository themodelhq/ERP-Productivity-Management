'use client';

import React from "react"

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Upload, Users, Settings, LogOut } from 'lucide-react';
import { TargetUpload } from '@/components/target-upload';
import { ExecutionUpload } from '@/components/execution-upload';
import type { User } from '@/lib/db-schema';

function parseCsvRows(content: string): string[][] {
  return content
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((value) => value.trim()));
}

function findUserByEmail(users: User[], email: string): User | undefined {
  const normalizedEmail = email.trim().toLowerCase();
  return users.find((user) => user.email === normalizedEmail);
}

export function AdminDashboard() {
  const { session, logout } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [systemStats, setSystemStats] = useState<any>(null);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'admin' | 'manager' | 'agent'>('admin');
  const [newUserDepartment, setNewUserDepartment] = useState('');
  const [userCreateMessage, setUserCreateMessage] = useState('');
  const [selectedAgentId, setSelectedAgentId] = useState('');
  const [selectedManagerId, setSelectedManagerId] = useState('');
  const [assignmentMessage, setAssignmentMessage] = useState('');
  const [assignmentCsvFile, setAssignmentCsvFile] = useState<File | null>(null);
  const [assignmentCsvMessage, setAssignmentCsvMessage] = useState('');

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

  const refreshUsersAndStats = () => {
    const allUsers = getStore().getAllUsers();
    setUsers(allUsers);
    setSystemStats({
      total_users: allUsers.length,
      agents: allUsers.filter((u) => u.role === 'agent').length,
      managers: allUsers.filter((u) => u.role === 'manager').length,
      admins: allUsers.filter((u) => u.role === 'admin').length,
      active_users: allUsers.filter((u) => u.is_active).length,
    });
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    setUserCreateMessage('');

    try {
      getStore().createUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        department: newUserRole === 'manager' ? newUserDepartment : undefined,
      });

      refreshUsersAndStats();
      setUserCreateMessage(`${newUserRole.charAt(0).toUpperCase() + newUserRole.slice(1)} account created successfully.`);
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserDepartment('');
    } catch (error) {
      setUserCreateMessage(error instanceof Error ? error.message : 'Failed to create account');
    }
  };



  const handleManualAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    setAssignmentMessage('');

    if (!selectedAgentId || !selectedManagerId) {
      setAssignmentMessage('Please choose both an agent and a manager.');
      return;
    }

    const store = getStore();
    const agent = store.getUser(selectedAgentId);
    const manager = store.getUser(selectedManagerId);

    if (!agent || agent.role !== 'agent') {
      setAssignmentMessage('Selected user is not a valid agent.');
      return;
    }

    if (!manager || manager.role !== 'manager') {
      setAssignmentMessage('Selected user is not a valid manager.');
      return;
    }

    store.updateUser(agent.id, { manager_id: manager.id });
    refreshUsersAndStats();
    setAssignmentMessage(`${agent.name} is now assigned to ${manager.name}.`);
  };

  const handleAssignmentCsvUpload = async () => {
    setAssignmentCsvMessage('');

    if (!assignmentCsvFile) {
      setAssignmentCsvMessage('Please select a CSV file first.');
      return;
    }

    try {
      const content = await assignmentCsvFile.text();
      const rows = parseCsvRows(content);
      if (rows.length < 2) {
        setAssignmentCsvMessage('CSV must include a header and at least one data row.');
        return;
      }

      const headers = rows[0].map((h) => h.toLowerCase());
      const indexOf = (name: string) => headers.indexOf(name);

      const managerEmailIdx = indexOf('manager_email');
      const managerNameIdx = indexOf('manager_name');
      const managerPasswordIdx = indexOf('manager_password');
      const managerDepartmentIdx = indexOf('manager_department');
      const agentEmailIdx = indexOf('agent_email');
      const agentNameIdx = indexOf('agent_name');
      const agentPasswordIdx = indexOf('agent_password');

      if (managerEmailIdx === -1 || agentEmailIdx === -1 || agentNameIdx === -1) {
        setAssignmentCsvMessage('CSV must include manager_email, agent_email, and agent_name columns.');
        return;
      }

      const store = getStore();
      let allUsers = store.getAllUsers();
      let createdManagers = 0;
      let createdAgents = 0;
      let updatedAssignments = 0;
      let skipped = 0;

      rows.slice(1).forEach((row) => {
        const managerEmail = (row[managerEmailIdx] || '').trim().toLowerCase();
        const agentEmail = (row[agentEmailIdx] || '').trim().toLowerCase();
        const agentName = (row[agentNameIdx] || '').trim();

        if (!managerEmail || !agentEmail || !agentName) {
          skipped += 1;
          return;
        }

        let manager = findUserByEmail(allUsers, managerEmail);
        if (!manager) {
          const managerName = (managerNameIdx >= 0 ? row[managerNameIdx] : '')?.trim() || managerEmail.split('@')[0];
          const managerPassword = (managerPasswordIdx >= 0 ? row[managerPasswordIdx] : '')?.trim() || 'password123';
          const managerDepartment = managerDepartmentIdx >= 0 ? (row[managerDepartmentIdx] || '').trim() : undefined;
          try {
            manager = store.createUser({
              name: managerName,
              email: managerEmail,
              password: managerPassword,
              role: 'manager',
              department: managerDepartment || undefined,
            });
            createdManagers += 1;
            allUsers = store.getAllUsers();
          } catch {
            skipped += 1;
            return;
          }
        }

        if (manager.role !== 'manager') {
          skipped += 1;
          return;
        }

        let agent = findUserByEmail(allUsers, agentEmail);
        if (!agent) {
          const agentPassword = (agentPasswordIdx >= 0 ? row[agentPasswordIdx] : '')?.trim() || 'password123';
          try {
            agent = store.createUser({
              name: agentName,
              email: agentEmail,
              password: agentPassword,
              role: 'agent',
              manager_id: manager.id,
            });
            createdAgents += 1;
            allUsers = store.getAllUsers();
          } catch {
            skipped += 1;
            return;
          }
        }

        if (agent.role !== 'agent') {
          skipped += 1;
          return;
        }

        store.updateUser(agent.id, { manager_id: manager.id });
        updatedAssignments += 1;
      });

      refreshUsersAndStats();
      setAssignmentCsvMessage(
        `CSV processed. Created ${createdManagers} manager(s), ${createdAgents} agent(s), assigned ${updatedAssignments} agent(s), skipped ${skipped} row(s).`,
      );
      setAssignmentCsvFile(null);
    } catch (error) {
      setAssignmentCsvMessage(error instanceof Error ? error.message : 'Failed to process assignment CSV.');
    }
  };

  if (!session) {
    return <div>Loading...</div>;
  }

  const usersByRole = {
    agent: users.filter((u) => u.role === 'agent'),
    manager: users.filter((u) => u.role === 'manager'),
    admin: users.filter((u) => u.role === 'admin'),
  };

  const managersById = new Map(usersByRole.manager.map((manager) => [manager.id, manager]));

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
              <form onSubmit={handleCreateUser} className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-2">
                <Input
                  placeholder="Full name"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                />
                <Input
                  type="email"
                  placeholder="user@company.com"
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Minimum 8 characters"
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as 'admin' | 'manager' | 'agent')}
                  className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="agent">Agent</option>
                </select>
                <Button type="submit">Create Account</Button>
                {newUserRole === 'manager' && (
                  <Input
                    placeholder="Department (for manager)"
                    value={newUserDepartment}
                    onChange={(e) => setNewUserDepartment(e.target.value)}
                    className="md:col-span-2"
                  />
                )}
              </form>
              {userCreateMessage && <p className="text-sm mt-2 text-slate-700">{userCreateMessage}</p>}
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
                            <p className="text-xs text-slate-500">
                              Manager: {user.manager_id ? managersById.get(user.manager_id)?.name || 'Unassigned' : 'Unassigned'}
                            </p>
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

                <div className="mt-6 border-t pt-4 space-y-4">
                  <h3 className="font-semibold">Agent-to-Manager Assignment</h3>

                  <form onSubmit={handleManualAssignment} className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <select
                      value={selectedAgentId}
                      onChange={(e) => setSelectedAgentId(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Agent</option>
                      {usersByRole.agent.map((agent) => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                      ))}
                    </select>
                    <select
                      value={selectedManagerId}
                      onChange={(e) => setSelectedManagerId(e.target.value)}
                      className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select Manager</option>
                      {usersByRole.manager.map((manager) => (
                        <option key={manager.id} value={manager.id}>{manager.name}</option>
                      ))}
                    </select>
                    <Button type="submit">Assign Agent</Button>
                  </form>
                  {assignmentMessage && <p className="text-sm text-slate-700">{assignmentMessage}</p>}

                  <div className="rounded border bg-slate-50 p-3 space-y-2">
                    <p className="text-sm font-medium">Bulk create/assign via CSV</p>
                    <p className="text-xs text-slate-600">
                      Columns: manager_email, manager_name, manager_password, manager_department, agent_email, agent_name, agent_password
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="file"
                        accept=".csv,.txt"
                        onChange={(e) => setAssignmentCsvFile(e.target.files?.[0] || null)}
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
                      />
                      <Button type="button" onClick={handleAssignmentCsvUpload}>Process CSV</Button>
                    </div>
                    {assignmentCsvMessage && <p className="text-sm text-slate-700">{assignmentCsvMessage}</p>}
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
