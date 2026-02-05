'use client';

import React from "react"

import { useState } from 'react';
import { parseExecutionFile, type ExecutionImportRow, type ImportResult } from '@/lib/excel-parser';
import { getStore } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { AgentExecution, BulkExecutionUpload, ProductivitySession, ProductivityTarget } from '@/lib/db-schema';

interface ExecutionUploadProps {
  onComplete?: () => void;
}

const DAILY_TARGET_MINUTES = 420;

export function ExecutionUpload({ onComplete }: ExecutionUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult<ExecutionImportRow> | null>(null);
  const { session } = useAuth();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsProcessing(true);
    try {
      const importResult = await parseExecutionFile(file);
      setResult(importResult);

      if (importResult.success) {
        const store = getStore();
        if (!session) {
          throw new Error('You must be logged in to upload executions');
        }

        const currentUser = store.getUser(session.user_id);
        if (!currentUser) {
          throw new Error('Unable to identify current user');
        }

        const eligibleAgents =
          currentUser.role === 'manager'
            ? store.getUsersByManager(currentUser.id)
            : store.getUsersByRole('agent');

        const usedMinutesByUserAndDate = new Map<string, number>();

        importResult.imported_data.forEach((row) => {
          const matchingUser = eligibleAgents.find((u) => u.name.toLowerCase() === row.agent_name.toLowerCase());
          if (!matchingUser) {
            return;
          }

          const taskDefinition = store.getTaskTargetDefinition(row.task_name, currentUser.id);
          if (!taskDefinition) {
            return;
          }

          const execution: AgentExecution = {
            id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
            user_id: matchingUser.id,
            agent_name: row.agent_name,
            execution_date: row.execution_date,
            total_executions: row.number_treated,
            executions_by_type: { [row.task_name]: row.number_treated },
            created_at: new Date(),
            updated_at: new Date(),
          };
          store.upsertExecution(execution);

          const key = `${matchingUser.id}::${row.execution_date}`;
          const currentMinutes = usedMinutesByUserAndDate.get(key) || 0;
          const rowMinutes = row.number_treated * taskDefinition.average_unit_execution_time_minutes;
          usedMinutesByUserAndDate.set(key, currentMinutes + rowMinutes);
        });

        usedMinutesByUserAndDate.forEach((usedMinutes, key) => {
          const [userId, date] = key.split('::');
          const existingExecutions = store
            .getExecutionsByDate(date)
            .filter((exec) => exec.user_id === userId);

          const totalExecutions = existingExecutions.reduce((sum, exec) => sum + exec.total_executions, 0);

          const startTime = new Date(`${date}T09:00:00`);
          const cappedMinutes = Math.round(Math.min(usedMinutes, DAILY_TARGET_MINUTES));

          const session: ProductivitySession = {
            id: `session-${userId}-${date}`,
            user_id: userId,
            date,
            start_time: startTime,
            end_time: new Date(startTime.getTime() + cappedMinutes * 60 * 1000),
            total_minutes: cappedMinutes,
            active_minutes: cappedMinutes,
            idle_minutes: 0,
            idle_events: [],
            status: 'completed',
            activities: ['Task Execution Upload'],
            created_at: new Date(),
            updated_at: new Date(),
          };
          store.upsertSession(session);

          const target: ProductivityTarget = {
            id: `target-${userId}-${date}`,
            user_id: userId,
            target_date: date,
            target_minutes: DAILY_TARGET_MINUTES,
            target_executions: totalExecutions,
            status: cappedMinutes >= DAILY_TARGET_MINUTES ? 'achieved' : 'missed',
            created_at: new Date(),
            updated_at: new Date(),
          };
          store.upsertTarget(target);
        });

        const upload: BulkExecutionUpload = {
          id: `exec-upload-${Date.now()}`,
          uploaded_by: currentUser.id,
          upload_date: new Date(),
          file_name: file.name,
          rows_processed: importResult.rows_processed,
          rows_successful: importResult.rows_successful,
          rows_failed: importResult.rows_failed,
          error_details: importResult.errors.map((err) => ({
            row: err.row,
            agent_name: err.identifier,
            error: err.error,
          })),
          status: 'completed',
        };

        store.recordBulkExecutionUpload(upload);

        if (onComplete) {
          onComplete();
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Upload Agent Sheet
        </CardTitle>
        <CardDescription>
          Upload a file with Agent Name, Task Name, Number Treated, execution_date.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">File Format:</h4>
          <div className="text-sm text-blue-800 font-mono bg-white p-2 rounded border border-blue-100">
            Agent Name,Task Name,Number Treated,execution_date
            <br />
            Alice Johnson,Sales Calls,45,2025-02-05
            <br />
            Bob Smith,Support Tickets,38,2025-02-05
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv,.txt,.xlsx,.xls"
            onChange={handleFileSelect}
            disabled={isProcessing}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm"
          />
          <Button
            onClick={handleUpload}
            disabled={!file || isProcessing}
            className="min-w-fit"
          >
            {isProcessing ? 'Processing...' : 'Upload'}
          </Button>
        </div>

        {result && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center gap-2">
              {result.success ? (
                <CheckCircle className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600" />
              )}
              <span className="font-semibold">
                {result.rows_successful} of {result.rows_processed} rows imported
              </span>
            </div>

            {result.rows_failed > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <h4 className="font-semibold text-red-900 text-sm mb-2">
                  <XCircle className="inline w-4 h-4 mr-1" />
                  {result.rows_failed} rows with errors:
                </h4>
                <div className="space-y-1 text-sm text-red-800">
                  {result.errors.slice(0, 5).map((err, idx) => (
                    <div key={idx}>
                      Row {err.row}: {err.identifier} - {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  Execution data imported. Daily, weekly, and monthly reports now use 420-minute utilization based on task execution times.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
