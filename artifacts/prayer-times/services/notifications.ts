import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PrayerSettings } from '@/state/PrayerContext';
import { getPrayerSchedule } from '@/services/prayerTimes';

const APP_NOTIFICATION_TAG = 'prayer-times-local';
const SOUND_CHANNEL = 'prayer-times-audible';
const SILENT_CHANNEL = 'prayer-times-silent';

export async function requestPrayerNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

export async function cancelPrayerNotifications(): Promise<void> {
  if (Platform.OS === 'web') return;
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  await Promise.all(
    scheduled
      .filter(
        (item) => item.content.data?.appTag === APP_NOTIFICATION_TAG,
      )
      .map((item) =>
        Notifications.cancelScheduledNotificationAsync(item.identifier),
      ),
  );
}

export async function schedulePrayerNotifications(
  settings: PrayerSettings,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(SOUND_CHANNEL, {
      name: 'تنبيهات الصلاة بصوت',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      sound: 'default',
    });
    await Notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
      name: 'تنبيهات الصلاة الهادئة',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 180],
      sound: null,
    });
  }

  await cancelPrayerNotifications();

  const now = new Date();
  const firstDay = new Date(now);
  firstDay.setHours(12, 0, 0, 0);
  const channelId =
    settings.reminderMode === 'silent' ? SILENT_CHANNEL : SOUND_CHANNEL;

  // Eight days creates at most 40 prayer reminders, below iOS's pending limit.
  // Reconcile the rolling window on app launch and whenever it returns to foreground.
  for (let dayOffset = 0; dayOffset < 8; dayOffset += 1) {
    const date = new Date(firstDay);
    date.setDate(firstDay.getDate() + dayOffset);
    const prayers = getPrayerSchedule(settings.location, settings, date).filter(
      (entry) => entry.isPrayer,
    );

    for (const prayer of prayers) {
      if (prayer.time.getTime() <= Date.now() + 15_000) continue;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: `حان وقت صلاة ${prayer.label}`,
          body: `حيّ على الصلاة — ${settings.location.name}`,
          sound: settings.reminderMode === 'silent' ? false : 'default',
          data: {
            appTag: APP_NOTIFICATION_TAG,
            prayer: prayer.key,
            alertMode: settings.reminderMode,
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: prayer.time,
          ...(Platform.OS === 'android' ? { channelId } : {}),
        },
      });
    }
  }
}