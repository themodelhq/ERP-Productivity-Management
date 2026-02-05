// Excel parsing utilities for bulk target and execution uploads

import type { TaskTargetDefinition } from './db-schema';

export interface TargetImportRow extends Omit<TaskTargetDefinition, 'owner_id'> {}

export interface ExecutionImportRow {
  agent_name: string;
  task_name: string;
  number_treated: number;
  execution_date: string;
}

export interface ImportResult<T = TargetImportRow> {
  success: boolean;
  rows_processed: number;
  rows_successful: number;
  rows_failed: number;
  errors: Array<{
    row: number;
    identifier: string;
    error: string;
  }>;
  imported_data: T[];
}

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}

async function fileToRows(file: File): Promise<string[][]> {
  const extension = file.name.toLowerCase().split('.').pop();

  if (extension === 'xlsx' || extension === 'xls') {
    throw new Error(
      'Excel parsing requires an optional parser dependency that is blocked in this deployment. Please upload CSV for now.',
    );
  }

  const text = await file.text();
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
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
    const rows = await fileToRows(file);
    if (rows.length === 0) {
      result.errors.push({ row: 0, identifier: 'unknown', error: 'File is empty' });
      return result;
    }

    const headerIndexMap = rows[0].reduce<Record<string, number>>((acc, header, idx) => {
      acc[normalizeHeader(header)] = idx;
      return acc;
    }, {});

    const agentNameIndex = headerIndexMap.agent_name;
    const taskNameIndex = headerIndexMap.task_name;
    const numberTreatedIndex = headerIndexMap.number_treated;
    const executionDateIndex = headerIndexMap.execution_date;

    if (
      agentNameIndex === undefined ||
      taskNameIndex === undefined ||
      numberTreatedIndex === undefined ||
      executionDateIndex === undefined
    ) {
      result.errors.push({
        row: 1,
        identifier: 'header',
        error: 'Invalid header. Expected columns: Agent Name, Task Name, Number Treated, execution_date',
      });
      return result;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      result.rows_processed++;

      const agentName = row[agentNameIndex] || '';
      const taskName = row[taskNameIndex] || '';
      const numberTreated = parseInt(row[numberTreatedIndex] || '', 10);
      const executionDate = row[executionDateIndex] || getTodayDateString();

      if (!agentName || !taskName) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          identifier: agentName || 'N/A',
          error: 'Missing agent name or task name',
        });
        continue;
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(executionDate)) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          identifier: agentName,
          error: 'Invalid date format (use YYYY-MM-DD)',
        });
        continue;
      }

      if (isNaN(numberTreated) || numberTreated < 0) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          identifier: agentName,
          error: 'Invalid Number Treated value',
        });
        continue;
      }

      result.rows_successful++;
      result.imported_data.push({
        agent_name: agentName,
        task_name: taskName,
        number_treated: numberTreated,
        execution_date: executionDate,
      });
    }

    result.success = result.rows_failed === 0;
    return result;
  } catch (error) {
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
    const rows = await fileToRows(file);
    if (rows.length === 0) {
      result.errors.push({ row: 0, identifier: 'unknown', error: 'File is empty' });
      return result;
    }

    const headerIndexMap = rows[0].reduce<Record<string, number>>((acc, header, idx) => {
      acc[normalizeHeader(header)] = idx;
      return acc;
    }, {});

    const taskNameIndex = headerIndexMap.tasks;
    const avgUnitTimeIndex = headerIndexMap.average_unit_execution_time_in_minutes;
    const targetDailyIndex = headerIndexMap.target_daily;

    if (taskNameIndex === undefined || avgUnitTimeIndex === undefined || targetDailyIndex === undefined) {
      result.errors.push({
        row: 1,
        identifier: 'header',
        error:
          'Invalid header. Expected columns: Tasks, Average Unit Execution Time in Minutes, Target Daily',
      });
      return result;
    }

    for (let i = 1; i < rows.length; i++) {
      const row = rows[i];
      result.rows_processed++;

      const taskName = row[taskNameIndex] || '';
      const avgUnitTime = parseFloat(row[avgUnitTimeIndex] || '');
      const targetDaily = parseFloat(row[targetDailyIndex] || '');

      if (!taskName) {
        result.rows_failed++;
        result.errors.push({ row: i + 1, identifier: 'N/A', error: 'Missing task name' });
        continue;
      }

      if (isNaN(avgUnitTime) || avgUnitTime <= 0) {
        result.rows_failed++;
        result.errors.push({
          row: i + 1,
          identifier: taskName,
          error: 'Average Unit Execution Time in Minutes must be > 0',
        });
        continue;
      }

      if (isNaN(targetDaily) || targetDaily <= 0) {
        result.rows_failed++;
        result.errors.push({ row: i + 1, identifier: taskName, error: 'Target Daily must be > 0' });
        continue;
      }

      result.rows_successful++;
      result.imported_data.push({
        task_name: taskName,
        average_unit_execution_time_minutes: avgUnitTime,
        target_daily: targetDaily,
      });
    }

    result.success = result.rows_failed === 0;
    return result;
  } catch (error) {
    result.errors.push({
      row: 0,
      identifier: 'unknown',
      error: `File parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    });
    return result;
  }
}

export function generateSampleExcel(): string {
  const header = 'Tasks,Average Unit Execution Time in Minutes,Target Daily\n';
  const rows = ['Sales Calls,6,50', 'Support Tickets,8,35', 'Email Follow-up,4,30'];
  return header + rows.join('\n');
}
