'use client';

import { useState, useEffect } from 'react';
import { generateAIInsights, predictFuturePerformance } from '@/lib/ai-insights';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp, Zap, AlertCircle } from 'lucide-react';
import type { AIInsight } from '@/lib/ai-insights';

interface AIInsightsPanelProps {
  userId: string;
}

const categoryIcons = {
  performance: '📊',
  behavior: '🎯',
  wellbeing: '💪',
  team_dynamics: '👥',
  anomaly: '⚠️',
};

const categoryColors = {
  performance: 'bg-blue-50 border-blue-200',
  behavior: 'bg-purple-50 border-purple-200',
  wellbeing: 'bg-green-50 border-green-200',
  team_dynamics: 'bg-amber-50 border-amber-200',
  anomaly: 'bg-red-50 border-red-200',
};

export function AIInsightsPanel({ userId }: AIInsightsPanelProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [prediction, setPrediction] = useState<any>(null);

  useEffect(() => {
    const aiInsights = generateAIInsights(userId);
    setInsights(aiInsights);

    const futurePrediction = predictFuturePerformance(userId);
    setPrediction(futurePrediction);
  }, [userId]);

  if (!insights.length) {
    return null;
  }

  const byCategory = insights.reduce((acc, insight) => {
    if (!acc[insight.category]) {
      acc[insight.category] = [];
    }
    acc[insight.category].push(insight);
    return acc;
  }, {} as Record<string, AIInsight[]>);

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-blue-600" />
          AI-Powered Insights
        </CardTitle>
        <CardDescription>Personalized recommendations based on your performance data</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue={Object.keys(byCategory)[0]} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            {Object.keys(byCategory).map((category) => (
              <TabsTrigger key={category} value={category} className="text-xs">
                {categoryIcons[category as keyof typeof categoryIcons]} {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(byCategory).map(([category, categoryInsights]) => (
            <TabsContent key={category} value={category} className="space-y-4 mt-4">
              {categoryInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg border-l-4 ${categoryColors[category as keyof typeof categoryColors]}`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-sm">{insight.title}</h4>
                    <div className="flex items-center gap-1 px-2 py-1 bg-white rounded text-xs">
                      <Zap className="w-3 h-3 text-amber-500" />
                      {insight.confidence}%
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mb-3">{insight.description}</p>

                  <div className="bg-white rounded-lg p-3 mb-3">
                    <h5 className="text-xs font-semibold text-gray-900 mb-2">
                      Action Steps:
                    </h5>
                    <ul className="space-y-1">
                      {insight.actionable_steps.map((step, stepIdx) => (
                        <li key={stepIdx} className="flex items-start gap-2 text-xs text-gray-700">
                          <span className="text-blue-600 font-bold mt-0.5">•</span>
                          {step}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {insight.predicted_outcome && (
                    <div className="flex items-start gap-2 p-2 bg-white rounded border border-gray-200">
                      <TrendingUp className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">Predicted Outcome</p>
                        <p className="text-xs text-gray-700">{insight.predicted_outcome}</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </TabsContent>
          ))}
        </Tabs>

        {prediction && (
          <div className="mt-6 p-4 bg-white border border-gray-200 rounded-lg">
            <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              30-Day Performance Forecast
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Predicted Achievement</p>
                <div className="text-3xl font-bold text-blue-600">
                  {prediction.predicted_achievement_rate}%
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">Confidence</p>
                <div className="text-3xl font-bold text-green-600">
                  {prediction.confidence}%
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 mb-1">Time to Target</p>
                <p className="font-semibold text-sm">{prediction.estimated_time_to_target}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-600 mb-1">Trend</p>
                <p className="font-semibold capitalize text-sm text-indigo-600">
                  {prediction.trend_direction.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
