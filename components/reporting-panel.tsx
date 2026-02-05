'use client';

import { useState } from 'react';
import {
  generateDailyReport,
  generateWeeklyReport,
  generateMonthlyReport,
  exportReportAsCSV,
  exportReportAsJSON,
  type ReportPeriodType,
} from '@/lib/reporting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';

interface ReportingPanelProps {
  managerEmail?: string;
}

export function ReportingPanel({ managerEmail = 'manager@company.com' }: ReportingPanelProps) {
  const [report, setReport] = useState<any>(null);
  const [periodType, setPeriodType] = useState<ReportPeriodType>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));

  const handleGenerateReport = () => {
    const generatedReport =
      periodType === 'daily'
        ? generateDailyReport(selectedDate)
        : periodType === 'weekly'
          ? generateWeeklyReport(selectedDate)
          : generateMonthlyReport(selectedMonth);

    setReport(generatedReport);
  };

  const downloadContent = (content: string, fileName: string) => {
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(content));
    element.setAttribute('download', fileName);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Generate Reports
        </CardTitle>
        <CardDescription>Export daily, weekly, and monthly team performance reports</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <select
            value={periodType}
            onChange={(e) => setPeriodType(e.target.value as ReportPeriodType)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>

          {periodType === 'monthly' ? (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          ) : (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
          )}

          <Button onClick={handleGenerateReport}>Generate Report</Button>
        </div>

        {report && (
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-lg border">
              <h3 className="font-semibold text-sm mb-2">Report Summary ({report.period_type})</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Total Users</p>
                  <p className="font-bold text-lg">{report.total_users}</p>
                </div>
                <div>
                  <p className="text-gray-600">Avg Achievement</p>
                  <p className="font-bold text-lg">{report.department_summary.avg_achievement}%</p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => downloadContent(exportReportAsCSV(report), `report-${report.period_type}.csv`)}
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={() => downloadContent(exportReportAsJSON(report), `report-${report.period_type}.json`)}
                variant="outline"
                size="sm"
                className="flex-1 bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
