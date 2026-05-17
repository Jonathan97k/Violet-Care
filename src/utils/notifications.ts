let mealReminderTimers: ReturnType<typeof setTimeout>[] = [];

export function scheduleMealReminders(shiftStart: string, shiftEnd: string): void {
  clearMealReminders();

  const now = new Date();
  const [startH, startM] = shiftStart.split(':').map(Number);
  const [endH, endM] = shiftEnd.split(':').map(Number);

  const start = new Date(now);
  start.setHours(startH, startM, 0, 0);

  const end = new Date(now);
  end.setHours(endH, endM, 0, 0);

  if (end <= start) end.setDate(end.getDate() + 1);

  if (now < start || now > end) return;

  const schedule = (delayMs: number, title: string, body: string) => {
    const t = setTimeout(() => {
      showNotification(title, body);
    }, delayMs);
    mealReminderTimers.push(t);
  };

  const elapsed = now.getTime() - start.getTime();
  const duration = end.getTime() - start.getTime();
  const mid = duration / 2;

  // Every 3 hours: meal reminder
  for (let i = 1; i * 3 * 60 * 60 * 1000 < duration; i++) {
    const delay = i * 3 * 60 * 60 * 1000 - elapsed;
    if (delay > 0) {
      schedule(delay, 'VioletCare 💜', 'Have you eaten today, Violet? 💜');
    }
  }

  // Every 2 hours: break reminder
  for (let i = 1; i * 2 * 60 * 60 * 1000 < duration; i++) {
    const delay = i * 2 * 60 * 60 * 1000 - elapsed;
    if (delay > 0) {
      schedule(delay, 'VioletCare 💜', "Time for a quick break 💜 Even 5 minutes helps.");
    }
  }

  // Once mid-shift: hydration
  const midDelay = mid - elapsed;
  if (midDelay > 0) {
    schedule(midDelay, 'VioletCare 💜', "Drink some water 💜 You always forget.");
  }
}

export function clearMealReminders(): void {
  for (const t of mealReminderTimers) clearTimeout(t);
  mealReminderTimers = [];
}

export function showNotification(title: string, body: string): void {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/icon-192.png' });
  }
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === 'granted';
}
