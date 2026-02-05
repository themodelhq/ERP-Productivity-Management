# Agent Execution Tracking Guide

## Overview

The ERP Productivity Manager now includes a comprehensive **Agent Execution Tracking System** that evaluates agent performance based on the actual number of tasks/executions completed daily. This system works in conjunction with productivity (time-based) targets to provide a complete performance evaluation framework.

## Key Features

### 1. Dual Performance Metrics

The system tracks TWO key performance indicators for each agent:

- **Productivity Target**: Time-based (420 minutes/day or custom)
- **Execution Target**: Task-based (e.g., 45 calls, 38 tickets, etc.)

### 2. File Upload System

Upload execution data directly from CSV files containing:
- Agent name
- Execution date (YYYY-MM-DD)
- Total executions (sum across all task types)
- Task type (optional - for future breakdown analysis)

### 3. Real-Time Performance Calculation

Automatically calculates:
- **Execution Achievement Rate**: (Actual Executions / Target Executions) × 100
- Compares against daily, weekly, and monthly targets
- Identifies over/under performers automatically

## How to Use

### Step 1: Access Admin Dashboard

1. Log in as an Admin user
2. Navigate to the Admin Dashboard
3. Select the **Executions** tab

### Step 2: Prepare Your Data

Create a CSV file with the following format:

```
agent_name,execution_date,total_executions,task_type
Alice Johnson,2025-02-05,45,sales_calls
Bob Smith,2025-02-05,38,support_tickets
Carol White,2025-02-05,52,inbound_leads
Alice Johnson,2025-02-06,47,sales_calls
```

**Important Notes:**
- `agent_name` must match the agent's name in the system exactly
- `execution_date` must be in YYYY-MM-DD format
- `total_executions` is the total count of all completed tasks
- `task_type` is optional but recommended for future analysis

### Step 3: Upload the File

1. Click on the file input in the Executions tab
2. Select your CSV file
3. Click **Upload** button
4. Review the import results

### Step 4: View Performance Metrics

After uploading execution data:

- **Agent Dashboard**: Agents see their Execution Target Achievement %
- **Manager Dashboard**: Managers see team-wide execution metrics
  - Individual execution achievement rates
  - Execution count breakdown (actual/target)
  - Performance comparison with other team members
- **Admin Dashboard**: Admins see bulk upload history and system-wide execution statistics

## Data Integration

### Automatic Matching

The system automatically matches execution data to agents by:
1. Comparing uploaded agent names with registered agent names
2. Matching execution dates with target dates
3. Calculating achievement rates in real-time

### Error Handling

If an agent name doesn't match:
- The row is flagged as failed
- Error details show the problematic row number
- You can correct and re-upload the data

## Performance Evaluation

### Achievement Rate Calculation

```
Execution Achievement Rate = (Total Executions / Target Executions) × 100

Example:
- Target: 45 executions
- Actual: 42 executions
- Achievement Rate: (42/45) × 100 = 93.3%
```

### Performance Categories

Based on both productivity and execution metrics:

- **Excellent**: 90%+ productivity AND 90%+ execution achievement
- **Good**: 75%+ productivity AND 75%+ execution achievement
- **Average**: 50-75% on either metric
- **Needs Improvement**: 30-50% on either metric
- **Critical**: Below 30% on either metric or excessive idle time

## Manager Reports

Managers can generate reports showing:

### Individual Execution Reports
- Daily execution counts vs targets
- Weekly trends
- Monthly performance summary
- Task type breakdown (if available)

### Team Execution Reports
- Aggregate execution data
- Top/bottom performers
- Team-wide achievement rates
- Variance analysis

### Combined Performance Reports
- Side-by-side productivity vs execution metrics
- Correlation analysis (do better executors also have better productivity?)
- Recommendations for performance improvement

## Best Practices

### 1. Regular Upload Frequency
- **Daily uploads** recommended for real-time tracking
- Upload at end of business day
- Include all agents even if count is zero

### 2. Data Accuracy
- Verify agent names match system records exactly
- Use consistent spelling and capitalization
- Include all task types for comprehensive analysis

### 3. Target Setting
- Set realistic execution targets based on historical data
- Account for agent skill level and experience
- Adjust targets quarterly based on performance trends

### 4. Performance Review
- Review execution metrics alongside productivity
- Consider context (new agent, system outages, etc.)
- Use execution gaps to identify training needs

## Technical Details

### Data Storage

Execution data is stored with:
- Unique execution records per agent per date
- Historical archive for trend analysis
- Automatic timestamp tracking
- Audit trail for admin uploads

### API Endpoints

The system exposes internal APIs for:
- Fetching execution data by agent
- Calculating achievement rates
- Generating performance reports

### Future Enhancements

Planned features:
- Execution target by task type
- Predictive analytics for execution forecasting
- Automated alerts for underperformance
- Integration with external task management systems

## Troubleshooting

### Agent Name Not Matching

**Problem**: Upload shows "Agent not found" error

**Solution**:
1. Check exact spelling and capitalization in system
2. Go to Admin Users tab to verify agent names
3. Update CSV to match exactly
4. Re-upload file

### Missing Execution Data

**Problem**: Executions not appearing in dashboards

**Solution**:
1. Verify upload status shows "completed"
2. Check that date is within current month
3. Confirm agent is active in system
4. Review manager dashboard for data presence

### Wrong Achievement Rates

**Problem**: Execution achievement rate seems incorrect

**Solution**:
1. Verify target executions were set correctly
2. Confirm execution counts match uploaded file
3. Check calculation: (Actual / Target) × 100
4. Review upload history for any corrections

## Reporting Examples

### Daily Execution Report
```
Agent         | Target | Actual | Achievement | Status
Alice Johnson | 45     | 42     | 93%        | Good
Bob Smith     | 38     | 35     | 92%        | Good
Carol White   | 50     | 48     | 96%        | Excellent
```

### Weekly Trend
```
Week  | Mon | Tue | Wed | Thu | Fri | Avg
1     | 89% | 91% | 88% | 92% | 94% | 91%
2     | 85% | 88% | 90% | 89% | 87% | 88%
```

## FAQ

**Q: Can I upload historical execution data?**
A: Yes, as long as the dates match target dates in the system.

**Q: What if an agent completes more than their target?**
A: Achievement rate will show >100%, indicating excellent performance. System recognizes this and highlights as overachiever.

**Q: Can I have different execution targets by task type?**
A: Currently, system tracks total executions. Future versions will support task-type-specific targets.

**Q: How far back does execution history go?**
A: All execution records are stored indefinitely in the audit trail and available for historical analysis.

**Q: Can agents see other agents' execution data?**
A: No, agents only see their own metrics. Managers see their team. Admins see all data.

## Support

For technical issues or feature requests regarding execution tracking:
1. Contact your system administrator
2. Review the main system documentation
3. Check the implementation summary for architecture details
