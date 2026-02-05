'use client';

import { useState } from 'react';
import { generateMonthlyReport, exportReportAsCSV, exportReportAsJSON } from '@/lib/reporting';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, FileText } from 'lucide-react';

interface ReportingPanelProps {
  managerEmail?: string;
}

export function ReportingPanel({ managerEmail = 'manager@company.com' }: ReportingPanelProps) {
  const [report, setReport] = useState<any>(null);
  const [selectedMonth, setSelectedMonth] = useState(
    new Date().toISOString().substring(0, 7),
  );

  const handleGenerateReport = () => {
    const generatedReport = generateMonthlyReport(selectedMonth);
    setReport(generatedReport);
  };

  const handleExportCSV = () => {
    if (!report) return;
    const csv = exportReportAsCSV(report);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(csv));
    element.setAttribute('download', `report-${selectedMonth}.csv`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportJSON = () => {
    if (!report) return;
    const json = exportReportAsJSON(report);
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(json));
    element.setAttribute('download', `report-${selectedMonth}.json`);
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
        <CardDescription>Export team performance metrics and analysis</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
          />
          <Button onClick={handleGenerateReport}>Generate Report</Button>
        </div>

        {report && (
          <div className="space-y-3">
            <div className="p-4 bg-slate-50 rounded-lg border">
              <h3 className="font-semibold text-sm mb-2">Report Summary</h3>
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

              <div className="mt-3 p-3 bg-white rounded border">
                <p className="text-xs font-semibold text-gray-900 mb-2">Recommendations:</p>
                <ul className="space-y-1">
                  {report.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="text-xs text-gray-700 flex items-start gap-2">
                      <span className="text-blue-600 mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleExportCSV} variant="outline" size="sm" className="flex-1 bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportJSON} variant="outline" size="sm" className="flex-1 bg-transparent">
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
