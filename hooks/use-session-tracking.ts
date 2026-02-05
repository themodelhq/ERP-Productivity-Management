// Hook for real-time session tracking and idle detection

'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export interface SessionState {
  activeMinutes: number;
  idleMinutes: number;
  totalMinutes: number;
  isIdle: boolean;
  lastActivityTime: Date;
}

const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
const UPDATE_INTERVAL = 1000; // 1 second

export function useSessionTracking(enabled: boolean = true) {
  const [state, setState] = useState<SessionState>({
    activeMinutes: 0,
    idleMinutes: 0,
    totalMinutes: 0,
    isIdle: false,
    lastActivityTime: new Date(),
  });

  const sessionStartRef = useRef<Date>(new Date());
  const lastActivityRef = useRef<Date>(new Date());
  const timerRef = useRef<NodeJS.Timeout>();
  const idleTimerRef = useRef<NodeJS.Timeout>();

  const handleActivity = useCallback(() => {
    lastActivityRef.current = new Date();
    setState((prev) => ({ ...prev, isIdle: false, lastActivityTime: new Date() }));
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Add activity listeners
    const listeners = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    listeners.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Session timer
    timerRef.current = setInterval(() => {
      const now = new Date();
      const elapsedMs = now.getTime() - sessionStartRef.current.getTime();
      const totalMinutes = Math.floor(elapsedMs / 60000);
      const timeSinceActivity = now.getTime() - lastActivityRef.current.getTime();
      const isIdle = timeSinceActivity > IDLE_THRESHOLD;

      setState((prev) => ({
        ...prev,
        totalMinutes,
        isIdle,
        activeMinutes: isIdle ? prev.activeMinutes : prev.activeMinutes + 1 / 60,
        idleMinutes: isIdle ? prev.idleMinutes + 1 / 60 : prev.idleMinutes,
      }));
    }, UPDATE_INTERVAL);

    return () => {
      listeners.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (idleTimerRef.current) {
        clearInterval(idleTimerRef.current);
      }
    };
  }, [enabled, handleActivity]);

  const resetSession = useCallback(() => {
    sessionStartRef.current = new Date();
    lastActivityRef.current = new Date();
    setState({
      activeMinutes: 0,
      idleMinutes: 0,
      totalMinutes: 0,
      isIdle: false,
      lastActivityTime: new Date(),
    });
  }, []);

  return { ...state, resetSession };
}
