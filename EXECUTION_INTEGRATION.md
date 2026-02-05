# Execution Tracking - Integration & Developer Guide

## Architecture Overview

The execution tracking system is designed as a modular, scalable addition to the core ERP productivity management system. It follows the existing patterns and integrates seamlessly with all components.

## System Components

### 1. Data Layer (`lib/`)

#### db-schema.ts
```typescript
export interface AgentExecution {
  id: string;
  user_id: string;           // Links to User
  agent_name: string;         // For display/matching
  execution_date: string;     // YYYY-MM-DD
  total_executions: number;   // Sum of all task types
  executions_by_type?: Record<string, number>;  // Breakdown
  created_at: Date;
  updated_at: Date;
}

export interface BulkExecutionUpload {
  id: string;
  uploaded_by: string;        // Admin/Manager ID
  upload_date: Date;
  file_name: string;
  rows_processed: number;
  rows_successful: number;
  rows_failed: number;
  error_details?: Array<{...}>;
  status: 'processing' | 'completed' | 'failed';
}
```

#### store.ts
```typescript
// Execution retrieval methods
getExecution(id: string): AgentExecution | undefined
getExecutionsByUser(userId: string): AgentExecution[]
getExecutionsByDate(date: string): AgentExecution[]
getExecutionsByUserAndMonth(userId: string, month: string): AgentExecution[]
getExecutionsByAgentName(agentName: string): AgentExecution[]

// Execution storage
upsertExecution(execution: AgentExecution): AgentExecution
recordBulkExecutionUpload(upload: BulkExecutionUpload): BulkExecutionUpload
getBulkExecutionUploads(): BulkExecutionUpload[]
```

#### excel-parser.ts
```typescript
export interface ExecutionImportRow {
  agent_name: string;
  execution_date: string;
  total_executions: number;
  task_type?: string;
}

export async function parseExecutionFile(
  file: File
): Promise<ImportResult<ExecutionImportRow>>
```

### 2. Analytics Layer (`lib/analytics.ts`)

Enhanced `UserMetrics` interface:
```typescript
export interface UserMetrics {
  // ... existing fields ...
  
  // New execution fields
  execution_achievement_rate?: number;  // 0-100%
  total_executions?: number;            // Actual count
  target_executions?: number;           // Target count
}
```

Calculation logic:
```typescript
// In calculateUserMetrics()
const executions = store.getExecutionsByUserAndMonth(userId, month);
totalExecutions = executions.reduce((sum, e) => sum + e.total_executions, 0);
executionAchievementRate = (totalExecutions / targetExecutions) * 100;
```

### 3. UI Components

#### ExecutionUpload Component
```tsx
<ExecutionUpload onComplete={() => void} />
```
- Handles file selection and upload
- Displays validation results
- Shows success/error messages
- Triggers data refresh callback

#### TargetUpload Component
```tsx
<TargetUpload onComplete={() => void} />
```
- Refactored to use common ImportResult type
- Maintains backward compatibility
- Handles both productivity and execution targets

### 4. Dashboard Integration

#### Agent Dashboard
```tsx
// New card in performance metrics grid
<Card>
  <CardTitle>Execution Target</CardTitle>
  <div className="text-4xl font-bold">
    {metrics.execution_achievement_rate ?? 0}%
  </div>
  <p className="text-xs text-slate-600">
    {metrics.total_executions ?? 0} / {metrics.target_executions ?? 0} tasks
  </p>
</Card>
```

#### Manager Dashboard
```tsx
// Added to team member metrics
{member.execution_achievement_rate ?? 0}%
{member.total_executions && member.target_executions && (
  <span>({member.total_executions}/{member.target_executions} tasks)</span>
)}

// Added to alerts
<p className="text-sm text-red-800">
  Executions: {member.execution_achievement_rate ?? 0}%
  ({member.total_executions}/{member.target_executions} tasks)
</p>
```

#### Admin Dashboard
```tsx
<Tabs>
  <TabsContent value="executions">
    <ExecutionUpload />
  </TabsContent>
</Tabs>
```

## Data Flow Diagrams

### Upload & Processing Flow
```
CSV File
   ↓
[parseExecutionFile()]
   ↓
Validates format, dates, numbers
   ↓
Returns ImportResult {
   - Row count
   - Success/failure details
   - Parsed data array
}
   ↓
Component iterates over imported_data
   ↓
Find matching user by agent_name
   ↓
Create AgentExecution records
   ↓
store.upsertExecution()
   ↓
Recorded in BulkExecutionUpload audit
   ↓
Triggers dashboard refresh
```

### Metrics Calculation Flow
```
User ID → calculateUserMetrics()
   ↓
Get all executions for user (past 30 days)
   ↓
Get all targets for user (current month)
   ↓
Sum: totalExecutions = Σ(execution.total_executions)
   ↓
Sum: targetExecutions = Σ(target.target_executions)
   ↓
Calculate: achievementRate = (total / target) × 100
   ↓
Return in UserMetrics object
   ↓
Dashboard displays real-time
```

### Performance Evaluation Flow
```
UserMetrics (productivity + execution)
   ↓
Combined Score = (productivityAchievement + executionAchievement) / 2
   ↓
Determine Rating:
   - ≥ 90% → "excellent"
   - ≥ 75% → "good"
   - 50-75% → "average"
   - 30-50% → "needs_improvement"
   - < 30% → "critical"
   ↓
Return rating + insights
```

## Extending the System

### Adding New Task Types

Currently: `total_executions` = sum of all types

To add task-type-specific tracking:

1. **Update Schema**
```typescript
export interface ProductivityTarget {
  // ... existing fields ...
  target_executions_by_type?: Record<string, number>;
}

export interface AgentExecution {
  // ... existing fields ...
  executions_by_type?: Record<string, number>;
}
```

2. **Update Parser**
```typescript
// Parse different task types from columns
const taskType = row.split(',')[3];
const taskCount = parseInt(row.split(',')[4]);

execution.executions_by_type = {
  ...(execution.executions_by_type || {}),
  [taskType]: taskCount
};
```

3. **Update Analytics**
```typescript
export interface UserMetrics {
  // ... existing fields ...
  execution_breakdown?: Record<string, {
    target: number;
    actual: number;
    achievement_rate: number;
  }>;
}
```

### Adding Execution Forecasting

Create `lib/execution-forecast.ts`:
```typescript
export function forecastExecutions(
  userId: string,
  days_ahead: number = 7
): { date: string; forecast: number; confidence: number }[] {
  // Get historical execution data
  const history = store.getExecutionsByUser(userId);
  
  // Calculate trend
  // Apply ML model (or simple moving average)
  // Return forecast with confidence
}
```

### Adding External Integration

Create `lib/integrations/hubspot.ts`:
```typescript
export async function syncExecutionsToHubSpot(userId: string) {
  // Get executions for user
  const executions = store.getExecutionsByUser(userId);
  
  // Transform to HubSpot format
  const payload = executions.map(e => ({
    contact_id: getUserHubSpotId(userId),
    property_executions_today: e.total_executions,
    date: e.execution_date
  }));
  
  // POST to HubSpot API
  await hubspotClient.batchUpdate(payload);
}
```

## Error Handling

### Parsing Errors
```typescript
// Handle missing agent name
if (!agentName) {
  result.errors.push({
    row: i + 1,
    identifier: 'N/A',
    error: 'Missing agent name'
  });
}

// Handle invalid date
if (!/^\d{4}-\d{2}-\d{2}$/.test(executionDate)) {
  result.errors.push({
    row: i + 1,
    identifier: agentName,
    error: 'Invalid date format (use YYYY-MM-DD)'
  });
}

// Handle invalid number
if (isNaN(totalExecutions) || totalExecutions < 0) {
  result.errors.push({
    row: i + 1,
    identifier: agentName,
    error: 'Invalid execution count'
  });
}
```

### Matching Errors
```typescript
// Agent not found
const matchingUser = store.getAllUsers().find(u =>
  u.name.toLowerCase() === row.agent_name.toLowerCase()
);

if (!matchingUser) {
  console.error(`Agent "${row.agent_name}" not found in system`);
  // Execution record created anyway with temp user reference
  // Can be matched manually later
}
```

## Testing

### Unit Test Example
```typescript
import { parseExecutionFile } from '@/lib/excel-parser';

describe('parseExecutionFile', () => {
  it('should parse valid CSV file', async () => {
    const file = new File(
      ['agent_name,execution_date,total_executions,task_type\nAlice,2025-02-05,45,calls'],
      'test.csv'
    );
    
    const result = await parseExecutionFile(file);
    
    expect(result.success).toBe(true);
    expect(result.rows_successful).toBe(1);
    expect(result.imported_data[0].agent_name).toBe('Alice');
  });

  it('should handle invalid dates', async () => {
    const file = new File(
      ['agent_name,execution_date,total_executions\nAlice,02-05-2025,45'],
      'test.csv'
    );
    
    const result = await parseExecutionFile(file);
    
    expect(result.success).toBe(false);
    expect(result.rows_failed).toBe(1);
  });
});
```

### Integration Test Example
```typescript
describe('Execution Dashboard Integration', () => {
  it('should display execution metrics after upload', async () => {
    // Setup
    const file = createTestCSV([
      { agent_name: 'Alice', execution_date: '2025-02-05', total_executions: 45 }
    ]);
    
    // Upload
    await uploadExecutionFile(file);
    
    // Verify
    const metrics = calculateUserMetrics('agent-1');
    expect(metrics.execution_achievement_rate).toBeGreaterThan(0);
    expect(metrics.total_executions).toBe(45);
  });
});
```

## Performance Considerations

### Query Optimization
```typescript
// Current: O(n) search for each upload
const user = store.getAllUsers().find(u => u.name === name);

// Optimized: O(1) with caching
const nameIndex = new Map(
  store.getAllUsers().map(u => [u.name.toLowerCase(), u])
);
const user = nameIndex.get(name.toLowerCase());
```

### Bulk Upload Optimization
```typescript
// Process 1000s of rows efficiently
const executions = [];
for (const row of data) {
  executions.push(createExecution(row));
}
// Batch insert instead of individual upserts
store.batchInsertExecutions(executions);
```

## Monitoring & Logging

### Key Metrics to Monitor
```typescript
// Execution upload success rate
uploadSuccessRate = successfulRows / totalRows

// Agent matching rate
matchingRate = matchedAgents / uniqueAgents

// Achievement rate distribution
avgAchievementRate = mean(allAchievementRates)
achievementVariance = std(allAchievementRates)
```

### Logging Strategy
```typescript
logger.info('Execution upload started', {
  upload_id: uploadId,
  file_name: fileName,
  estimated_rows: estimatedRowCount
});

logger.debug('Processing row', {
  row_number: i,
  agent_name: agentName,
  execution_count: totalExecutions
});

logger.error('Agent matching failed', {
  agent_name: agentName,
  all_agents: store.getAllUsers().map(u => u.name)
});
```

## Migration Guide

### From Existing System

If migrating from an existing execution tracking system:

1. **Export existing data** in CSV format:
```
agent_name,execution_date,total_executions,task_type
```

2. **Validate mapping**:
   - Ensure agent names match system records
   - Convert dates to YYYY-MM-DD format
   - Verify execution counts

3. **Upload in batches**:
   - Upload 6 months of historical data first
   - Verify metrics calculations
   - Then switch to daily uploads

4. **Verify accuracy**:
   - Compare reported metrics with old system
   - Reconcile any discrepancies
   - Document any data transformations

## Support & Troubleshooting

See `EXECUTION_TRACKING_GUIDE.md` for end-user documentation and common issues.

---

**For Developers**: This integration guide covers architecture, extension points, and implementation details for the execution tracking system.
