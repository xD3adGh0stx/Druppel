import { LocalNotifications } from '@capacitor/local-notifications';
import type { Subscription } from '../types';
import { daysUntilNextPayment } from './calculations';
import { formatCurrency } from './calculations';

export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  } catch {
    return false;
  }
}

export async function schedulePaymentNotifications(subscriptions: Subscription[], notifyDaysBefore: number[] = [1, 3]): Promise<void> {
  const NOTIFY_DAYS_BEFORE = notifyDaysBefore.filter(d => d > 0).sort((a, b) => b - a);
  try {
    // Cancel all previously scheduled notifications first
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({ notifications: pending.notifications });
    }

    const notifications: Parameters<typeof LocalNotifications.schedule>[0]['notifications'] = [];
    let idCounter = 1;

    for (const sub of subscriptions) {
      if (!sub.active) continue;

      const daysLeft = daysUntilNextPayment(sub.nextPaymentDate);

      for (const daysBefore of NOTIFY_DAYS_BEFORE) {
        if (daysLeft < daysBefore) continue; // Already past this threshold

        const scheduleAt = new Date();
        scheduleAt.setDate(scheduleAt.getDate() + (daysLeft - daysBefore));
        scheduleAt.setHours(9, 0, 0, 0); // 09:00 on that day

        const title = daysBefore === 1
          ? `${sub.name} – betaling morgen`
          : `${sub.name} – betaling over ${daysBefore} dagen`;

        notifications.push({
          id: idCounter++,
          title,
          body: `${formatCurrency(sub.price)} wordt afgeschreven`,
          schedule: { at: scheduleAt },
          smallIcon: 'ic_launcher',
          channelId: 'payments',
        });
      }
    }

    if (notifications.length === 0) return;

    // Create notification channel (Android 8+)
    await LocalNotifications.createChannel({
      id: 'payments',
      name: 'Betalingsherinneringen',
      description: 'Meldingen voor aankomende abonnementsbetalingen',
      importance: 3,
      visibility: 1,
    });

    await LocalNotifications.schedule({ notifications });
  } catch {
    // Silently fail on web/desktop where notifications aren't supported
  }
}
