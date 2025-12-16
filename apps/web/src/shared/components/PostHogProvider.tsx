'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider } from 'posthog-js/react';
import { useEffect } from 'react';

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
    const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST;

    if (posthogKey && posthogHost) {
      posthog.init(posthogKey, {
        api_host: posthogHost,
        person_profiles: 'identified_only',
        capture_pageview: true,
        capture_pageleave: true,
        // Session Replay
        disable_session_recording: false,
        session_recording: {
          maskAllInputs: false,
          maskInputFn: (text, element) => {
            // Only mask password and email fields
            const type = element?.getAttribute('type');
            if (type === 'password' || type === 'email') {
              return '*'.repeat(text.length);
            }
            return text;
          },
        },
        // Enable Surveys (requires feature flags to work)
        enable_heatmaps: true,
      });
    }
  }, []);

  const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  if (!posthogKey) {
    // PostHog not configured, just render children
    return <>{children}</>;
  }

  return <PHProvider client={posthog}>{children}</PHProvider>;
}
