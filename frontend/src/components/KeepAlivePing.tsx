'use client';

import { useEffect, useRef } from 'react';

// Free-tier Render instances spin down after 15 minutes of inactivity.
// Pinging every 4 minutes keeps the backend warm while the user has the app open.
const PING_INTERVAL_MS = 4 * 60 * 1000;

export function KeepAlivePing() {
  const lastPingRef = useRef<number>(0);

  useEffect(() => {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const baseUrl = rawUrl.replace(/\/+$/, '');
    const healthUrl = `${baseUrl}/health`;

    const sendKeepAlivePing = async () => {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const res = await fetch(healthUrl, {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'Accept': 'application/json'
          }
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          lastPingRef.current = Date.now();
        }
      } catch {
        // Backend may be cold-booting or offline; the frontend runs the rule engine locally
        // so silence any network hiccups during keep-alive pings.
      }
    };

    // Initial ping on app mount
    sendKeepAlivePing();

    // Regular interval ping every 4 minutes
    const interval = setInterval(sendKeepAlivePing, PING_INTERVAL_MS);

    // Ping when user returns to tab if > 4 minutes have elapsed
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastPingRef.current;
        if (elapsed > PING_INTERVAL_MS) {
          sendKeepAlivePing();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return null;
}
