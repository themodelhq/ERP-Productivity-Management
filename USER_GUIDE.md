# ERP Productivity Manager - User Guide

## Getting Started

### Login

1. Navigate to the application homepage
2. Enter your email and password
3. Click "Sign in"

**Demo Credentials**:
```
Manager:  manager@company.com / password
Agent:    agent1@company.com / password
Admin:    admin@company.com / password
```

---

## Agent Dashboard

### Overview

The Agent Dashboard shows your real-time productivity metrics and personalized insights.

### Components

#### 1. Live Session Stats
- **Total Minutes**: Cumulative minutes worked today
- **Active**: Minutes with detected activity
- **Idle**: Minutes with no detected activity
- **Status**: Current activity status (Active/Idle)

#### 2. Performance Metrics

**Target Achievement**
- Percentage of days meeting the 420-minute target
- Visual progress bar shows current achievement
- Goal: ≥80% for excellent performance

**Consistency Score**
- Measures how reliably you meet targets
- Calculated over the past 30 days
- Higher is better (0-100%)

**Performance Rating**
- ⭐ Excellent: 90%+ achievement, <12% idle
- ✓ Good: 75-90% achievement, <15% idle
- – Average: 60-75% achievement
- ⚠ Needs Improvement: <60% achievement
- ✕ Critical: <50% achievement, >25% idle

#### 3. 7-Day Productivity Trend
- Bar chart showing active vs. idle minutes
- Blue bars: Active productive time
- Orange bars: Idle time
- Helps identify productivity patterns

#### 4. Alerts & Insights
- ✅ Achievements: Recognition for good performance
- ⚠️ Warnings: Areas needing attention
- 💡 Tips: Actionable recommendations

#### 5. AI-Powered Insights
- Performance analysis with confidence scoring
- Personalized recommendations
- 30-day performance forecast
- Trend analysis (improving/stable/declining)

#### 6. WFH Idle Detection Monitor
- Real-time activity tracking
- Shows idle event count
- Last activity timestamp
- Visual idle threshold indicator

#### 7. Recent Sessions
- Last 7 days of productivity data
- Shows target achievement for each day
- Green ✓ = Target met
- Orange ⚠ = Below target

### Tips for Better Productivity

1. **Minimize Idle Time**
   - Keep your hands on keyboard/mouse during work
   - Take scheduled breaks instead of sudden idle periods
   - Lock screen manually rather than relying on auto-lock

2. **Meet Daily Targets**
   - Aim for 420 minutes (7 hours) of productive work
   - Break into focused work blocks
   - Track your progress throughout the day

3. **Use Insights**
   - Review AI recommendations daily
   - Act on flagged issues
   - Celebrate achievements

---

## Manager Dashboard

### Overview

The Manager Dashboard provides team performance analytics and management tools.

### Team KPIs

- **Team Size**: Number of active agents
- **Avg Achievement**: Team's average target achievement rate
- **Top Performer**: Best performing agent
- **Needs Attention**: Agents below 60% achievement

### Performance Analysis

#### Overview Tab
1. **Performance Distribution Pie Chart**
   - Shows team breakdown by rating
   - Green = Excellent (90%+)
   - Blue = Good (75-90%)
   - Orange = Average (60-75%)
   - Red = Critical (<50%)

2. **Achievement vs Consistency Chart**
   - Compares individual metrics
   - Identify high performers
   - Spot consistency issues

#### Team Performance Tab
- List of all team members
- Individual metrics:
  - Achievement rate
  - Consistency score
  - Idle time percentage
  - Performance trend
- Click to expand member details

#### Alerts Tab
- Agents below 60% achievement
- High idle time detection
- Declining performance alerts
- One-click review option

#### Reports Tab
- Generate monthly performance reports
- Export to CSV or JSON
- Download for stakeholder sharing
- Includes recommendations

### Bulk Target Upload

1. Go to Admin Dashboard → Bulk Upload tab
2. Click to select Excel file
3. File format:
   ```csv
   email,target_date,target_minutes
   agent1@company.com,2025-02-05,420
   agent2@company.com,2025-02-05,420
   ```
4. Click "Process File"
5. View results with success/failure counts

### Team Management

#### 1. Monitoring
- Track team productivity daily
- Identify bottlenecks
- Celebrate wins

#### 2. Coaching
- Use insights to have 1-on-1s
- Provide targeted feedback
- Help underperformers improve

#### 3. Reporting
- Generate monthly reports
- Share with leadership
- Document performance trends

---

## Admin Dashboard

### System Management

#### User Management
- View all system users
- Filter by role (Agent/Manager/Admin)
- Check active/inactive status
- Bulk user operations

#### System Configuration
- Set daily target (default: 420 min)
- Configure idle threshold (default: 5 min)
- Enable/disable idle detection
- Enable/disable privacy mode

#### Audit & Logging
- Track system activity
- View user actions
- Export audit logs
- Monitor security

### Bulk Operations

#### Excel Import
- Import multiple targets at once
- Validate email addresses
- Check date formats
- View import results
- Retry on failures

#### Export Data
- Export user lists
- Export performance data
- Generate reports
- Download for analysis

---

## Performance Metrics Explained

### Understanding Your Numbers

**Target Achievement Rate**
- How many days you hit 420-minute goal
- Example: 75% = 23 out of 30 days met target

**Consistency Score**
- How reliable your performance is
- Measures day-to-day stability
- High score = predictable performer

**Idle Time Percentage**
- Portion of your session with no activity
- 15% idle = 63 minutes idle in 7-hour day
- Lower is better

**Performance Trend**
- 📈 Improving: Getting better week-to-week
- ➡️ Stable: Consistent performance
- 📉 Declining: Getting worse week-to-week

---

## AI Insights Explained

### How AI Insights Work

The system analyzes your productivity patterns to provide:

1. **Performance Insights**
   - Your achievement trends
   - Consistency patterns
   - Benchmark vs peers

2. **Behavior Insights**
   - Your work style
   - Peak productivity times
   - Focus patterns

3. **Well-being Insights**
   - Burnout risk detection
   - Fatigue patterns
   - Work-life balance analysis

4. **Team Dynamics**
   - Your performance vs team
   - Growth opportunities
   - Recognition achievements

5. **Anomaly Detection**
   - Unusual activity patterns
   - System issues
   - Data validation

### Using Recommendations

Each insight includes:
- **Description**: What the insight means
- **Confidence**: How confident the system is (0-100%)
- **Actions**: Specific steps you can take
- **Expected Outcome**: What should happen

---

## Idle Detection

### How It Works

1. System monitors for activity:
   - Mouse movement
   - Keyboard input
   - Touch/clicks
   - Page scrolling

2. If NO activity for **5 minutes**:
   - Status changes to "IDLE"
   - Idle counter increments
   - Alert may display

3. Any activity resumes tracking:
   - Status returns to "ACTIVE"
   - Idle event closes
   - Idle period logged

### Tips

- **Don't get frustrated**: Idle detection helps focus
- **Take breaks**: Use them intentionally
- **Check settings**: Adjust if too sensitive
- **Be mobile**: Some WFH activities aren't keyboard/mouse based
- **Discuss**: Talk to manager if settings need adjustment

### Privacy Mode

If enabled:
- Personal data is anonymized
- Managers see only aggregates
- Your name is hidden from reports
- Still shows you performance data

---

## Data Export

### Supported Formats

**CSV (Comma-Separated Values)**
- Open in Excel/Google Sheets
- Easy to manipulate
- Good for presentations
- Example:
  ```csv
  Name,Email,Achievement %,Consistency %
  Alice,alice@company.com,85,90
  Bob,bob@company.com,70,75
  ```

**JSON (JavaScript Object Notation)**
- Machine-readable format
- Structured data
- Good for APIs
- Preserves all details

### Exporting Reports

1. Go to Manager Dashboard → Reports tab
2. Select month you want
3. Click "Generate Report"
4. View summary
5. Click "Export CSV" or "Export JSON"
6. File downloads automatically

---

## Troubleshooting

### Session Not Starting

**Problem**: Timer not counting
- Check browser has JavaScript enabled
- Refresh the page
- Try different browser
- Check system time

### Idle Detection Not Working

**Problem**: System shows active when idle
- Close battery saver mode
- Check for browser extensions interfering
- Verify idle threshold setting
- Restart browser

### Can't Import Excel

**Problem**: File upload fails
- Check file format (.xlsx, .xls, .csv)
- Verify column headers match format
- Check email addresses are valid
- Dates must be YYYY-MM-DD

### Missing Metrics

**Problem**: Analytics not showing
- Need minimum 10 sessions to calculate
- Check date range is correct
- Wait for data to sync
- Try clearing browser cache

---

## Best Practices

### For Agents

✅ DO:
- Track time honestly
- Take intentional breaks
- Review insights daily
- Communicate blockers
- Aim for consistency over speed

❌ DON'T:
- Leave system running when not working
- Try to game idle detection
- Ignore performance warnings
- Work without breaks
- Sit idle for extended periods

### For Managers

✅ DO:
- Check team dashboard daily
- Review insights for coaching opportunities
- Celebrate top performers
- Have one-on-ones with struggling agents
- Use data to support decisions

❌ DON'T:
- Use metrics punitively
- Ignore context in performance
- Set unrealistic targets
- Micromanage based on data
- Ignore well-being signals

---

## FAQ

**Q: Is 420 minutes realistic?**
A: Yes, it's 7 hours. With breaks and meetings, most people work 8 hours/day, so this is reasonable.

**Q: Can I pause my session?**
A: Manual pause available in settings. Paused time doesn't count toward target.

**Q: What if I'm in a meeting?**
A: Meetings with screen activity count as active. Share your calendar for better context.

**Q: How is idle calculated?**
A: Any 5+ minute period with no keyboard/mouse activity. Lock screen starts idle immediately.

**Q: Can managers see my personal apps?**
A: No, the system tracks TIME, not APPLICATION content. Privacy by design.

**Q: What happens if I'm below target?**
A: Nothing punitive. AI suggests improvements. Manager may offer support.

**Q: Can I export my data?**
A: Yes! Full data export available in JSON/CSV format under privacy settings.

**Q: How often is data updated?**
A: Real-time tracking updates every second. Analytics refresh daily.

---

## Support

For technical issues or questions:
1. Check this guide
2. Ask your manager
3. Contact system administrator
4. Open a support ticket

---

**Last Updated**: 2025-02-05
