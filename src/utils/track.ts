import type { UsageEvent } from '../types';
import { queueUsageEvent, getQueuedUsageEvents, deleteUsageEvent } from './db';
import config from './config';

/*
 GOOGLE APPS SCRIPT UPDATE REQUIRED:
 Add token validation to your Apps Script doPost function.

 In your script, add at the top of doPost:

 var SECRET_TOKEN = "same_token_as_VITE_TRACKING_TOKEN"

 if (data.token !== SECRET_TOKEN) {
   return ContentService
     .createTextOutput(JSON.stringify({
       status: "unauthorized"
     }))
     .setMimeType(ContentService.MimeType.JSON)
 }

 Then redeploy as a new version.
*/

function getTimeOfDay(): 'morning' | 'afternoon' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  return 'night';
}

async function sendEvent(event: UsageEvent): Promise<boolean> {
  if (!config.trackingWebhook) {
    if (config.isDev) {
      console.warn('Tracking webhook URL not configured');
    }
    return false;
  }

  try {
    await fetch(config.trackingWebhook, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...event,
        token: config.trackingToken,
      }),
    });
    return true;
  } catch (error) {
    if (config.isDev) {
      console.error('Failed to send tracking event:', error);
    }
    return false;
  }
}

export async function track(feature: string, action: string): Promise<void> {
  const event: UsageEvent = {
    feature,
    action,
    timestamp: new Date().toISOString(),
    timeOfDay: getTimeOfDay(),
    date: new Date().toLocaleDateString(),
  };

  // Try to send immediately
  const sent = await sendEvent(event);

  // If sending failed or offline, queue for later
  if (!sent) {
    try {
      await queueUsageEvent(event);
    } catch (error) {
      if (config.isDev) {
        console.error('Failed to queue tracking event:', error);
      }
    }
  }
}

export async function flushQueuedEvents(): Promise<void> {
  try {
    const queued = await getQueuedUsageEvents();

    for (const event of queued) {
      const sent = await sendEvent(event);
      if (sent && event.id !== undefined) {
        await deleteUsageEvent(event.id);
      }
    }
  } catch (error) {
    if (config.isDev) {
      console.error('Failed to flush queued events:', error);
    }
  }
}

// Listen for online events to flush queued events
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    flushQueuedEvents();
  });
}

// Also attempt to flush on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Wait a moment before flushing to avoid blocking initial render
    setTimeout(() => {
      flushQueuedEvents();
    }, 2000);
  });
}
