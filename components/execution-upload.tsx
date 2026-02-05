'use client';

import React from "react"

import { useState } from 'react';
import { parseExecutionFile, type ExecutionImportRow, type ImportResult } from '@/lib/excel-parser';
import { getStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { AgentExecution, BulkExecutionUpload } from '@/lib/db-schema';

interface ExecutionUploadProps {
  onComplete?: () => void;
}

export function ExecutionUpload({ onComplete }: ExecutionUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult<ExecutionImportRow> | null>(null);

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
        const currentUser = store.getAllUsers()[0]; // Get current user context
        
        // Find users by agent name and create executions
        importResult.imported_data.forEach((row) => {
          // Find user matching agent name
          const matchingUser = store.getAllUsers().find((u) =>
            u.name.toLowerCase() === row.agent_name.toLowerCase()
          );

          if (matchingUser) {
            const execution: AgentExecution = {
              id: `exec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              user_id: matchingUser.id,
              agent_name: row.agent_name,
              execution_date: row.execution_date,
              total_executions: row.total_executions,
              executions_by_type: row.task_type ? { [row.task_type]: row.total_executions } : undefined,
              created_at: new Date(),
              updated_at: new Date(),
            };

            store.upsertExecution(execution);
          }
        });

        // Record bulk upload
        const upload: BulkExecutionUpload = {
          id: `exec-upload-${Date.now()}`,
          uploaded_by: currentUser?.id || 'unknown',
          upload_date: new Date(),
          file_name: file.name,
          rows_processed: importResult.rows_processed,
          rows_successful: importResult.rows_successful,
          rows_failed: importResult.rows_failed,
          error_details: importResult.errors,
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
          Upload Agent Execution Data
        </CardTitle>
        <CardDescription>
          Upload a CSV file with agent execution data (name, date, total executions)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">File Format:</h4>
          <div className="text-sm text-blue-800 font-mono bg-white p-2 rounded border border-blue-100">
            agent_name,execution_date,total_executions,task_type (optional)
            <br />
            Alice Johnson,2025-02-05,45,sales_calls
            <br />
            Bob Smith,2025-02-05,38,support_tickets
          </div>
        </div>

        {/* File Input */}
        <div className="flex items-center gap-3">
          <input
            type="file"
            accept=".csv,.txt"
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

        {/* Results */}
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
                  {result.errors.length > 5 && (
                    <div className="text-slate-600 italic">
                      +{result.errors.length - 5} more errors
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  All execution data has been successfully imported and matched to agents.
                </p>
              </div>
            )}

            {/* Summary */}
            {result.imported_data.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">Recent Uploads:</h4>
                <div className="space-y-2 text-sm">
                  {result.imported_data.slice(0, 5).map((row, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{row.agent_name} ({row.execution_date})</span>
                      <span className="font-semibold">{row.total_executions} executions</span>
                    </div>
                  ))}
                  {result.imported_data.length > 5 && (
                    <div className="text-slate-600 italic">
                      +{result.imported_data.length - 5} more entries
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
