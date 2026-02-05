// Excel parsing utilities for bulk target and execution uploads

export interface TargetImportRow {
  email: string;
  target_date: string;
  target_minutes: number;
  target_executions?: number;
}

export interface ExecutionImportRow {
  agent_name: string;
  execution_date: string;
  total_executions: number;
  task_type?: string;
}

export interface ImportResult<T = TargetImportRow> {
  success: boolean;
  rows_processed: number;
  rows_successful: number;
  rows_failed: number;
  errors: Array<{
    row: number;
    identifier: string; // email for targets, agent_name for executions
    error: string;
  }>;
  imported_data: T[];
}

export async function parseExecutionFile(file: File): Promise<ImportResult<ExecutionImportRow>> {
  const result: ImportResult<ExecutionImportRow> = {
    success: false,
    rows_processed: 0,
    rows_successful: 0,
    rows_failed: 0,
    errors: [],
    imported_data: [],
  };

  try {
    const text = await file.text();
    const lines = text.split('\n');

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      result.rows_processed++;
      const parts = lines[i].split(',').map((v) => v.trim());
      const agentName = parts[0];
      const executionDate = parts[1];
      const totalExecutions = parseInt(parts[2], 10);
      const taskType = parts[3] || 'general';

      // Validate row
      if (!agentName || !executionDate) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          identifier: agentName || 'N/A',
          error: 'Missing agent name or date',
        });
        continue;
      }

      // Validate date format
      if (!/^\d{4}-\d{2}-\d{2}$/.test(executionDate)) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          identifier: agentName,
          error: 'Invalid date format (use YYYY-MM-DD)',
        });
        continue;
      }

      // Validate executions number
      if (isNaN(totalExecutions) || totalExecutions < 0) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          identifier: agentName,
          error: 'Invalid execution count (must be a positive number)',
        });
        continue;
      }

      result.rows_successful++;
      result.imported_data.push({
        agent_name: agentName,
        execution_date: executionDate,
        total_executions: totalExecutions,
        task_type: taskType,
      });
    }

    result.success = result.rows_failed === 0;
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push({
      row: 0,
      identifier: 'unknown',
      error: `File parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return result;
  }
}

export async function parseExcelFile(file: File): Promise<ImportResult<TargetImportRow>> {
  const result: ImportResult<TargetImportRow> = {
    success: false,
    rows_processed: 0,
    rows_successful: 0,
    rows_failed: 0,
    errors: [],
    imported_data: [],
  };

  try {
    const text = await file.text();
    const lines = text.split('\n');

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      result.rows_processed++;
      const [email, targetDate, targetMinutes] = lines[i].split(',').map((v) => v.trim());

      // Validate row
      if (!email || !targetDate) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          email: email || 'N/A',
          error: 'Missing email or date',
        });
        continue;
      }

      // Validate email format
      if (!email.includes('@')) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          email,
          error: 'Invalid email format',
        });
        continue;
      }

      // Validate date format (YYYY-MM-DD)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          email,
          error: 'Invalid date format (use YYYY-MM-DD)',
        });
        continue;
      }

      const minutes = parseInt(targetMinutes || '420', 10);
      if (isNaN(minutes) || minutes <= 0) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          email,
          error: 'Invalid target minutes',
        });
        continue;
      }

      result.rows_successful++;
      result.imported_data.push({
        email,
        target_date: targetDate,
        target_minutes: parseInt(targetMinutes, 10),
      });
    }

    result.success = result.rows_failed === 0;
    return result;
  } catch (error) {
    result.success = false;
    result.errors.push({
      row: 0,
      identifier: 'unknown',
      error: `File parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return result;
  }
}

export function generateSampleExcel(): string {
  const header = 'email,target_date,target_minutes\n';
  const rows = [
    'agent1@company.com,2025-02-05,420',
    'agent2@company.com,2025-02-05,420',
    'agent3@company.com,2025-02-05,400',
  ];
  return header + rows.join('\n');
}
