export interface AnalyticsEvent {
  name: string;
  timestamp: string;
  properties?: Record<string, any>;
}

const ANALYTICS_STORAGE_KEY = 'opportunitykit_analytics_events';

/**
 * Tracks lightweight events for presentation walkthroughs and user flow audit.
 */
export function trackEvent(name: string, properties?: Record<string, any>): void {
  const event: AnalyticsEvent = {
    name,
    timestamp: new Date().toISOString(),
    properties
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Analytics] 📊 ${name}`, properties || '');
  }

  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(ANALYTICS_STORAGE_KEY);
      const events: AnalyticsEvent[] = raw ? JSON.parse(raw) : [];
      events.push(event);
      // Keep last 50 events
      if (events.length > 50) events.shift();
      sessionStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(events));
    } catch {
      // Ignore sessionStorage errors
    }
  }
}

/**
 * Retrieves tracked session events for demo auditing.
 */
export function getRecentEvents(): AnalyticsEvent[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(ANALYTICS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
