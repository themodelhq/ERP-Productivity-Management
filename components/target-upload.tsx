'use client';

import React from "react"

import { useState } from 'react';
import { parseExcelFile, type TargetImportRow, type ImportResult } from '@/lib/excel-parser';
import { getStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { ProductivityTarget, BulkTargetUpload } from '@/lib/db-schema';

interface TargetUploadProps {
  onComplete?: () => void;
}

export function TargetUpload({ onComplete }: TargetUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult<TargetImportRow> | null>(null);

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
      const importResult = await parseExcelFile(file);
      setResult(importResult);

      if (importResult.success) {
        const store = getStore();
        const currentUser = store.getAllUsers().find((u) => u.role === 'admin') || store.getAllUsers()[0];

        // Import targets
        importResult.imported_data.forEach((row) => {
          const user = store.getUserByEmail(row.email);
          if (user) {
            const target: ProductivityTarget = {
              id: `target-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              user_id: user.id,
              target_date: row.target_date,
              target_minutes: row.target_minutes,
              target_executions: row.target_executions,
              status: 'pending',
              created_at: new Date(),
              updated_at: new Date(),
            };

            store.upsertTarget(target);
          }
        });

        // Record bulk upload
        const upload: BulkTargetUpload = {
          id: `target-upload-${Date.now()}`,
          uploaded_by: currentUser?.id || 'unknown',
          upload_date: new Date(),
          file_name: file.name,
          rows_processed: importResult.rows_processed,
          rows_successful: importResult.rows_successful,
          rows_failed: importResult.rows_failed,
          error_details: importResult.errors,
          status: 'completed',
        };

        store.recordBulkUpload(upload);

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
          Upload Productivity Targets
        </CardTitle>
        <CardDescription>
          Upload a CSV file with productivity targets (email, date, minutes)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">File Format:</h4>
          <div className="text-sm text-blue-800 font-mono bg-white p-2 rounded border border-blue-100">
            email,target_date,target_minutes,target_executions (optional)
            <br />
            alice@company.com,2025-02-05,420,45
            <br />
            bob@company.com,2025-02-05,420,38
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
                  All targets have been successfully imported and assigned to agents.
                </p>
              </div>
            )}

            {/* Summary */}
            {result.imported_data.length > 0 && (
              <div className="bg-slate-50 rounded-lg p-3">
                <h4 className="font-semibold text-slate-900 text-sm mb-2">Recent Imports:</h4>
                <div className="space-y-2 text-sm">
                  {result.imported_data.slice(0, 5).map((row, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700">
                      <span>{row.email} ({row.target_date})</span>
                      <span className="font-semibold">{row.target_minutes}m</span>
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
