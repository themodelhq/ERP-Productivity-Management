'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface IdleEvent {
  start: Date;
  end: Date;
  duration: number; // minutes
}

export function IdleDetectionMonitor() {
  const [isIdle, setIsIdle] = useState(false);
  const [idleEvents, setIdleEvents] = useState<IdleEvent[]>([]);
  const [lastActivityTime, setLastActivityTime] = useState(new Date());
  const [idleCount, setIdleCount] = useState(0);

  const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const handleActivity = () => {
      setLastActivityTime(new Date());
      if (isIdle) {
        setIsIdle(false);
      }
    };

    const checkIdle = () => {
      const now = new Date();
      const timeSinceActivity = now.getTime() - lastActivityTime.getTime();

      if (timeSinceActivity > IDLE_THRESHOLD && !isIdle) {
        setIsIdle(true);
        setIdleCount((c) => c + 1);
      }
    };

    const activities = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    activities.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    const idleCheckInterval = setInterval(checkIdle, 10000); // Check every 10 seconds

    return () => {
      activities.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      clearInterval(idleCheckInterval);
    };
  }, [lastActivityTime, isIdle]);

  const totalIdleTime = idleEvents.reduce((sum, event) => sum + event.duration, 0);

  return (
    <Card className={isIdle ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          WFH Idle Detection
        </CardTitle>
        <CardDescription>Real-time activity monitoring for work-from-home</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isIdle ? (
          <Alert className="bg-red-100 border-red-300">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              You have been idle for more than 5 minutes. System lock may trigger soon.
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="bg-green-100 border-green-300">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Your system is active. Keep up the productivity!
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-600 mb-1">Idle Events</p>
            <p className="text-2xl font-bold">{idleCount}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Total Idle (min)</p>
            <p className="text-2xl font-bold">{Math.round(totalIdleTime)}</p>
          </div>
        </div>

        <div className="p-3 bg-white rounded-lg border">
          <p className="text-xs font-semibold text-gray-900 mb-2">
            Last Activity: {lastActivityTime.toLocaleTimeString()}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${isIdle ? 'bg-red-500' : 'bg-green-500'}`}
              style={{
                width: `${Math.min(100, (new Date().getTime() - lastActivityTime.getTime()) / IDLE_THRESHOLD * 100)}%`,
              }}
            />
          </div>
        </div>

        <p className="text-xs text-gray-600 text-center">
          💡 Tip: System considers 5+ minutes of no keyboard/mouse activity as idle time.
        </p>
      </CardContent>
    </Card>
  );
}
