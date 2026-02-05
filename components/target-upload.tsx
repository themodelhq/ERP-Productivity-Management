'use client';

import React from "react"

import { useState } from 'react';
import { parseExcelFile, type TargetImportRow, type ImportResult } from '@/lib/excel-parser';
import { getStore } from '@/lib/store';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import type { BulkTargetUpload } from '@/lib/db-schema';

interface TargetUploadProps {
  onComplete?: () => void;
}

export function TargetUpload({ onComplete }: TargetUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ImportResult<TargetImportRow> | null>(null);
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
      const importResult = await parseExcelFile(file);
      setResult(importResult);

      if (importResult.success) {
        const store = getStore();
        if (!session) {
          throw new Error('You must be logged in to upload targets');
        }

        const currentUser = store.getUser(session.user_id);

        store.setTaskTargetDefinitions(session.user_id, importResult.imported_data);

        const upload: BulkTargetUpload = {
          id: `target-upload-${Date.now()}`,
          uploaded_by: currentUser?.id || 'unknown',
          upload_date: new Date(),
          file_name: file.name,
          rows_processed: importResult.rows_processed,
          rows_successful: importResult.rows_successful,
          rows_failed: importResult.rows_failed,
          error_details: importResult.errors.map((err) => ({
            row: err.row,
            email: err.identifier,
            error: err.error,
          })),
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
          Upload Task Targets
        </CardTitle>
        <CardDescription>
          Upload a CSV file with task target definitions used for 420-minute utilization analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 text-sm mb-2">File Format:</h4>
          <div className="text-sm text-blue-800 font-mono bg-white p-2 rounded border border-blue-100">
            Tasks,Average Unit Execution Time in Minutes,Target Daily
            <br />
            Sales Calls,6,50
            <br />
            Support Tickets,8,35
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
                  Task definitions are saved and will be used to compute daily/weekly/monthly utilization.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
