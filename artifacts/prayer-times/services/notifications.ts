import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { PrayerSettings } from '@/state/PrayerContext';
import { getPrayerSchedule } from '@/services/prayerTimes';
import { ADHAN_VOICES, getAdhanVoice, type AdhanVoiceId } from '@/services/adhanAudio';

const APP_NOTIFICATION_TAG = 'prayer-times-local';
const SILENT_CHANNEL = 'prayer-times-silent';

// One Android notification channel per adhan voice, each locked to that
// voice's bundled sound file. Android makes channel settings (including
// sound) immutable after first creation, so we don't try to "update" a
// channel's sound later — we just pick the right pre-made channel per voice.
// If you ever swap which audio file a voice points to, bump this prefix
// (e.g. -v2) so a fresh channel is created instead of reusing the old one.
const CHANNEL_VERSION = 'v1';
function soundChannelId(voiceId: AdhanVoiceId): string {
  return `prayer-times-adhan-${voiceId}-${CHANNEL_VERSION}`;
}

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

/**
 * Creates (or no-ops if already created) one HIGH-importance Android channel
 * per adhan voice — each with that voice's real audio file as the channel
 * sound — plus one silent channel. Safe to call on every app launch.
 */
export async function ensurePrayerNotificationChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync(SILENT_CHANNEL, {
    name: 'تنبيهات الصلاة الهادئة',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 180],
    sound: null,
  });

  for (const voice of ADHAN_VOICES) {
    await Notifications.setNotificationChannelAsync(soundChannelId(voice.id), {
      name: `أذان — ${voice.name}`,
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      // Filename must match a sound registered via the expo-notifications
      // config plugin (app.json) and copied into assets/sounds/. Android
      // strips the extension when it looks this up in res/raw.
      sound: voice.soundFile,
      bypassDnd: false,
      lockscreenVisibility:
        Notifications.AndroidNotificationVisibility.PUBLIC,
    });
  }
}

export async function schedulePrayerNotifications(
  settings: PrayerSettings,
): Promise<void> {
  if (Platform.OS === 'web') return;
  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  await ensurePrayerNotificationChannels();
  await cancelPrayerNotifications();

  const now = new Date();
  const firstDay = new Date(now);
  firstDay.setHours(12, 0, 0, 0);

  const isSilent = settings.reminderMode === 'silent';
  const voice = getAdhanVoice(settings.adhanVoiceId);
  const channelId = isSilent ? SILENT_CHANNEL : soundChannelId(voice.id);
  // content.sound only matters on iOS/web — Android sound comes from the
  // channel above. iOS truncates local-notification sounds to ~30s unless
  // the app has the (Apple-gated) Critical Alerts entitlement, so this is a
  // shorter azan cue on iOS even though Android plays the full recording.
  const iosSound = isSilent ? false : voice.soundFile;

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
          sound: iosSound,
          data: {
            appTag: APP_NOTIFICATION_TAG,
            prayer: prayer.key,
            alertMode: settings.reminderMode,
            adhanVoiceId: voice.id,
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
