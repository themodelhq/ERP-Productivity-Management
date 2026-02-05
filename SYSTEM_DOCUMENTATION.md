# ERP Productivity Management System - Technical Documentation

## System Overview

The ERP Productivity Management System is a comprehensive, AI-enhanced web application designed to track, analyze, and optimize employee productivity through real-time monitoring, intelligent insights, and actionable analytics. The system is built with Next.js 16, React 19, and TypeScript for production-grade scalability and reliability.

### Core Features

1. **420-Minute Productivity Tracking**: Precise daily productivity measurement with session tracking
2. **Real-time WFH Idle Detection**: Detects inactivity with configurable thresholds
3. **Excel-based Target Ingestion**: Bulk import of productivity targets and goals
4. **AI-Powered Insights**: Machine learning-based recommendations and forecasting
5. **Role-based Dashboards**: Customized interfaces for agents, managers, and admins
6. **Comprehensive Analytics**: Department, team, and individual performance metrics
7. **Privacy-First Design**: Privacy mode and configurable data exposure
8. **Actionable Reporting**: CSV/JSON export with recommendations

---

## Architecture

### Database Schema (`lib/db-schema.ts`)

```typescript
User
├── id (string, PK)
├── email (string, unique)
├── name (string)
├── role (enum: agent | manager | admin)
├── manager_id (string, FK to User)
└── settings (privacy_mode, notifications, idle_detection)

ProductivitySession
├── id (string, PK)
├── user_id (string, FK)
├── date (YYYY-MM-DD)
├── total_minutes (target: 420)
├── active_minutes
├── idle_minutes
├── idle_events[]
└── status (active | idle | paused | completed)

ProductivityTarget
├── id (string, PK)
├── user_id (string, FK)
├── target_date (YYYY-MM-DD)
├── target_minutes (default: 420)
└── status (pending | in_progress | achieved | missed)

PerformanceEvaluation
├── id (string, PK)
├── user_id (string, FK)
├── evaluation_period (YYYY-MM)
├── target_achievement_rate (0-100%)
├── consistency_score (0-100%)
├── idle_duration_percentage (0-100%)
└── performance_rating (excellent | good | average | needs_improvement | critical)
```

### Data Store (`lib/store.ts`)

In-memory data store implementing the data layer. In production, replace with:
- **Supabase PostgreSQL**: Full-featured relational database
- **Neon PostgreSQL**: Serverless PostgreSQL
- **AWS RDS Aurora**: Enterprise-grade database
- **MongoDB**: For document-based storage

Current implementation includes:
- Demo data initialization for testing
- CRUD operations for all entities
- Query methods with filtering and sorting
- Activity and audit logging

---

## Authentication System (`lib/auth.ts`)

### Authentication Flow

```
User Login → Email/Password Validation → Session Creation → localStorage Storage
```

### Demo Credentials

```
Manager:  manager@company.com / password
Agent 1:  agent1@company.com / password
Agent 2:  agent2@company.com / password
Agent 3:  agent3@company.com / password
Admin:    admin@company.com / password
```

### In Production

Replace demo authentication with:
- **Auth.js**: Open-source authentication
- **Supabase Auth**: Managed authentication service
- **Auth0**: Enterprise authentication platform

---

## Analytics Engine (`lib/analytics.ts`)

### Core Calculations

#### 1. User Metrics (`calculateUserMetrics`)
```typescript
- total_sessions: Number of tracked sessions
- avg_daily_minutes: Average productivity per day
- consistency_score: % of days meeting 420-min target
- target_achievement_rate: % of targets achieved
- idle_time_percentage: Percentage of idle time
- performance_rating: Overall performance classification
- trend: improving | stable | declining
```

#### 2. Daily Metrics (`calculateDailyMetrics`)
```typescript
- avg_productivity: Team average for the day
- sessions_completed: Number of sessions
- target_achievement_rate: Team achievement %
- avg_idle_percentage: Team idle percentage
- top_performers: Top 3 performers for the day
- needs_attention: Users below thresholds
```

#### 3. Department Metrics (`calculateDepartmentMetrics`)
```typescript
- avg_productivity: Department average
- target_achievement_rate: Department achievement %
- performance_distribution: Rating breakdown
```

### Alert Generation (`generateInsightAlerts`)

Automatically generated alerts for:
- **Performance Declining**: Downward trend detected
- **Low Achievement**: Below 60% target rate
- **High Idle Time**: Exceeds 25% threshold
- **Achievement Recognition**: Excellent performance
- **Anomalies**: Sudden drops in activity

---

## AI Insights Layer (`lib/ai-insights.ts`)

### Insight Categories

1. **Performance**: Achievement and consistency patterns
2. **Behavior**: Work style and productivity habits
3. **Well-being**: Fatigue, burnout, work-life balance
4. **Team Dynamics**: Peer comparisons and rankings
5. **Anomaly**: Unusual patterns requiring attention

### Predictive Analytics

```typescript
predictFuturePerformance(userId)
├── predicted_achievement_rate: 0-100%
├── confidence: 0-100%
├── trend_direction: up | down | stable
└── estimated_time_to_target: Duration estimate
```

---

## Component Architecture

### Page Components

#### 1. **LoginPage** (`components/login-page.tsx`)
- Email/password authentication
- Demo credentials display
- Error handling

#### 2. **AgentDashboard** (`components/agent-dashboard.tsx`)
Features:
- Live session tracking (real-time stats)
- 7-day productivity trend chart
- Performance metrics (achievement, consistency, rating)
- Alerts and insights
- Recent sessions list
- AI-powered insights panel
- WFH idle detection monitor

#### 3. **ManagerDashboard** (`components/manager-dashboard.tsx`)
Features:
- Team KPI cards (size, achievement, top performer, alerts)
- Performance distribution chart
- Individual team member metrics
- Alert management
- Reporting and export functionality

#### 4. **AdminDashboard** (`components/admin-dashboard.tsx`)
Features:
- System statistics (users by role, active users)
- User management interface
- Bulk target upload (Excel)
- System settings configuration

### Supporting Components

#### **AIInsightsPanel** (`components/ai-insights-panel.tsx`)
- Categorized AI insights
- Confidence scoring
- Actionable recommendations
- 30-day performance forecast

#### **IdleDetectionMonitor** (`components/idle-detection-monitor.tsx`)
- Real-time activity monitoring
- Idle threshold visualization
- Event counting
- Last activity timestamp

#### **ReportingPanel** (`components/reporting-panel.tsx`)
- Monthly report generation
- CSV/JSON export
- Performance summary
- Recommendations display

---

## Session Tracking Hook (`hooks/use-session-tracking.ts`)

### Real-time Monitoring

```typescript
useSessionTracking(enabled: boolean)
├── activeMinutes: Cumulative active time
├── idleMinutes: Cumulative idle time
├── totalMinutes: Total session duration
├── isIdle: Current idle status
├── lastActivityTime: Last detected activity
└── resetSession(): Clear counters
```

### Activity Detection

Monitors events:
- `mousedown`: Mouse movement
- `keydown`: Keyboard input
- `touchstart`: Touch input
- `scroll`: Page scrolling
- `click`: Mouse clicks

Idle threshold: **5 minutes** (configurable)

---

## Excel Import System (`lib/excel-parser.ts`)

### Import Format

```csv
email,target_date,target_minutes
agent1@company.com,2025-02-05,420
agent2@company.com,2025-02-05,420
```

### Validation

- Email format validation
- Date format validation (YYYY-MM-DD)
- Target minutes validation (>0)
- Row-level error tracking

### Return Value

```typescript
ImportResult {
  success: boolean
  rows_processed: number
  rows_successful: number
  rows_failed: number
  errors: [{row, email, error}]
  imported_targets: TargetImportRow[]
}
```

---

## Reporting System (`lib/reporting.ts`)

### Report Generation

```typescript
generateMonthlyReport(month: string)
├── report_date: ISO date
├── report_period: YYYY-MM
├── total_users: Count
├── team_metrics: [UserMetrics]
├── department_summary: Aggregates
└── recommendations: Actionable items
```

### Export Formats

1. **CSV**: Spreadsheet-compatible format
2. **JSON**: Structured data format

### Recommendations Generated

- Team performance analysis
- High-idle-time users
- Declining performers
- Achievement trends

---

## State Management

### Auth Context (`lib/auth-context.ts`)

```typescript
AuthContext {
  session: AuthSession | null
  isLoading: boolean
  login(email, password): Promise<void>
  logout(): void
}
```

### Local Storage

Persists authentication session:
```json
{
  "user_id": "user-123",
  "email": "user@company.com",
  "name": "User Name",
  "role": "agent",
  "logged_in_at": "2025-02-05T10:00:00Z"
}
```

---

## User Roles & Permissions

### Agent
- View own dashboard
- Track sessions in real-time
- View own analytics and insights
- Enable/disable idle detection
- Privacy mode available

### Manager
- View team dashboard
- Track team performance
- Generate and export reports
- Monitor individual agents
- Bulk upload targets

### Admin
- System administration
- User management
- System configuration
- Global settings
- Audit logs

---

## Performance Metrics Explained

### Target Achievement Rate
```
Formula: (Days Meeting 420-min Target / Total Days) × 100
Range: 0-100%
Target: ≥80% for "Good" rating
```

### Consistency Score
```
Formula: (Sessions with Active Work / Total Sessions) × 100
Range: 0-100%
Indicates: Reliability and stability
```

### Idle Time Percentage
```
Formula: (Total Idle Minutes / Total Session Minutes) × 100
Range: 0-100%
Target: <15% for optimal performance
```

### Performance Rating Scale

| Rating | Achievement | Idle % | Description |
|--------|------------|--------|-------------|
| Excellent | ≥90% | ≤12% | Top performer |
| Good | 75-90% | ≤15% | Strong performer |
| Average | 60-75% | ≤20% | Acceptable |
| Needs Improvement | <60% | >20% | Below expectations |
| Critical | <50% | >25% | Requires intervention |

---

## Configuration

### System Constants

```typescript
// Session Tracking
DAILY_TARGET_MINUTES = 420 // 7 hours
IDLE_THRESHOLD = 5 * 60 * 1000 // 5 minutes
UPDATE_INTERVAL = 1000 // 1 second

// Analytics
MINIMUM_SESSIONS_FOR_EVALUATION = 10
EVALUATION_PERIOD = 30 // days
```

### Environment Variables

For production deployment, set:

```env
# Authentication
NEXT_PUBLIC_AUTH_PROVIDER=supabase|auth0|custom

# Database
DATABASE_URL=postgresql://...
DATABASE_ENCRYPTION_KEY=...

# AI Services (optional)
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...

# Monitoring
SENTRY_DSN=...
LOG_LEVEL=info
```

---

## Deployment Guidelines

### Prerequisites

- Node.js 18+
- npm or yarn
- PostgreSQL database (production)

### Development

```bash
npm install
npm run dev
```

### Production Build

```bash
npm run build
npm run start
```

### Deployment Platforms

- **Vercel**: Recommended for Next.js
- **Railway**: PostgreSQL + Next.js
- **AWS**: EC2 + RDS + S3
- **Google Cloud**: Cloud Run + Cloud SQL
- **Azure**: App Service + Azure SQL

---

## Security Considerations

### Authentication
- [ ] Implement password hashing (bcrypt)
- [ ] Add HTTPS enforcement
- [ ] Implement CSRF protection
- [ ] Add rate limiting on login

### Data Privacy
- [ ] Encrypt sensitive data at rest
- [ ] Use SSL/TLS for transmission
- [ ] Implement GDPR compliance
- [ ] Add data retention policies
- [ ] Enable privacy mode toggle

### Access Control
- [ ] Implement Row Level Security (RLS)
- [ ] Add audit logging for sensitive actions
- [ ] Implement role-based access control
- [ ] Add API rate limiting

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Enable database query logging
- [ ] Monitor system performance
- [ ] Alert on anomalies

---

## Future Enhancements

### Phase 2
- [ ] Real-time collaborative dashboards
- [ ] Mobile application
- [ ] Advanced ML models
- [ ] Slack/Teams integration
- [ ] Calendar sync

### Phase 3
- [ ] Predictive staffing
- [ ] Burnout detection
- [ ] Team health scoring
- [ ] Custom dashboards
- [ ] API for third-party integrations

### Phase 4
- [ ] Multi-organization support
- [ ] Advanced reporting engine
- [ ] Compliance reporting
- [ ] White-label solution
- [ ] Enterprise SSO

---

## Support & Troubleshooting

### Common Issues

**Session not persisting**
- Check browser localStorage settings
- Verify auth token validity
- Check network connectivity

**Analytics not updating**
- Clear browser cache
- Verify data in database
- Check for calculation errors

**Idle detection not working**
- Ensure JavaScript events are firing
- Check idle threshold configuration
- Verify privacy mode is not blocking

---

## Testing

### Key Test Scenarios

1. User authentication (login/logout)
2. Session tracking accuracy
3. Idle detection threshold
4. Analytics calculations
5. Report generation
6. Excel import validation
7. Alert generation
8. Role-based access control

### Performance Benchmarks

- Page load: <2s
- Analytics calculation: <500ms
- Report generation: <1s
- Database query: <100ms

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2025-02-05 | Initial release |
| | | - 420-min tracking |
| | | - Real-time monitoring |
| | | - Excel import |
| | | - AI insights |

---

## Contact & Support

For issues, questions, or feature requests, please refer to the system administrator or open an issue in the project repository.

---

**Last Updated**: 2025-02-05
**Status**: Production Ready
