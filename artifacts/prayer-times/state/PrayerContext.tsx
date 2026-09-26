import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, Appearance, Linking, Platform } from 'react-native';
import type {
  CalculationMethodId,
  MadhabId,
  PrayerLocation,
} from '@/services/prayerTimes';
import {
  DEFAULT_ADHAN_VOICE_ID,
  ADHAN_VOICES,
  type AdhanVoiceId,
} from '@/services/adhanAudio';
import {
  cancelPrayerNotifications,
  requestPrayerNotificationPermission,
  schedulePrayerNotifications,
} from '@/services/notifications';

export interface PrayerSettings {
  location: PrayerLocation;
  calculationMethod: CalculationMethodId;
  madhab: MadhabId;
  remindersEnabled: boolean;
  reminderMode: 'sound' | 'silent';
  adhanVoiceId: AdhanVoiceId;
  themeMode: 'system' | 'light' | 'dark';
}

interface PrayerContextValue {
  settings: PrayerSettings;
  isHydrated: boolean;
  isLocating: boolean;
  locationError: string | null;
  locationPermissionBlocked: boolean;
  notificationError: string | null;
  updateSettings: (patch: Partial<PrayerSettings>) => void;
  updateLocation: (location: PrayerLocation) => void;
  useCurrentLocation: () => Promise<void>;
  openLocationSettings: () => Promise<void>;
  setRemindersEnabled: (enabled: boolean) => Promise<boolean>;
}

const STORAGE_KEY = 'prayer-times.settings.v1';

export const DEFAULT_SETTINGS: PrayerSettings = {
  location: {
    name: 'تونس — موقع تجريبي',
    latitude: 36.8065,
    longitude: 10.1815,
    source: 'sample',
  },
  calculationMethod: 'MuslimWorldLeague',
  madhab: 'shafi',
  remindersEnabled: false,
  reminderMode: 'sound',
  adhanVoiceId: DEFAULT_ADHAN_VOICE_ID,
  themeMode: 'system',
};

const PrayerContext = createContext<PrayerContextValue | null>(null);

function normalizeSettings(value: unknown): PrayerSettings {
  if (!value || typeof value !== 'object') return DEFAULT_SETTINGS;
  const input = value as Partial<PrayerSettings>;
  const location = input.location;
  const validLocation =
    location &&
    Number.isFinite(location.latitude) &&
    Number.isFinite(location.longitude) &&
    location.latitude >= -90 &&
    location.latitude <= 90 &&
    location.longitude >= -180 &&
    location.longitude <= 180;
  const requestedVoiceId = input.adhanVoiceId;
  const adhanVoiceId =
    requestedVoiceId &&
    ADHAN_VOICES.some((voice) => voice.id === requestedVoiceId)
      ? requestedVoiceId
      : DEFAULT_ADHAN_VOICE_ID;

  return {
    ...DEFAULT_SETTINGS,
    ...input,
    location: validLocation ? location : DEFAULT_SETTINGS.location,
    adhanVoiceId,
  };
}

function getBrowserPosition(): Promise<{ latitude: number; longitude: number }> {
  return new Promise((resolve, reject) => {
    const browserNavigator = globalThis.navigator as
      | (Navigator & {
          geolocation?: {
            getCurrentPosition: (
              success: (position: {
                coords: { latitude: number; longitude: number };
              }) => void,
              failure: (error: { message?: string }) => void,
              options?: { enableHighAccuracy?: boolean; timeout?: number },
            ) => void;
          };
        })
      | undefined;
    const geolocation = browserNavigator?.geolocation;
    if (!geolocation) {
      reject(new Error('الموقع غير متاح في هذا المتصفح.'));
      return;
    }

    geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }),
      (error) => reject(new Error(error.message || 'تعذر تحديد الموقع.')),
      { enableHighAccuracy: true, timeout: 15_000 },
    );
  });
}

export function PrayerProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<PrayerSettings>(DEFAULT_SETTINGS);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPermissionBlocked, setLocationPermissionBlocked] =
    useState(false);
  const [notificationError, setNotificationError] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((saved) => {
        if (active && saved) setSettings(normalizeSettings(JSON.parse(saved)));
      })
      .catch(() => {
        if (active) setNotificationError('تعذر استعادة بعض الإعدادات المحفوظة.');
      })
      .finally(() => {
        if (active) setIsHydrated(true);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isHydrated) return;
    if (Platform.OS !== 'web') {
      Appearance.setColorScheme(
        settings.themeMode === 'system' ? 'unspecified' : settings.themeMode,
      );
    }
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings)).catch(() => {
      setNotificationError('تعذر حفظ الإعدادات على هذا الجهاز.');
    });

    if (!settings.remindersEnabled) {
      void cancelPrayerNotifications();
      return;
    }

    let active = true;
    schedulePrayerNotifications(settings).catch(() => {
      if (active) {
        setNotificationError(
          'تعذرت جدولة التنبيهات. تحقق من إذن الإشعارات ثم حاول مجددًا.',
        );
      }
    });
    return () => {
      active = false;
    };
  }, [isHydrated, settings]);

  useEffect(() => {
    if (!isHydrated || !settings.remindersEnabled) return;
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        schedulePrayerNotifications(settings).catch(() => {
          setNotificationError('تعذر تحديث مواعيد التنبيهات.');
        });
      }
    });
    return () => subscription.remove();
  }, [isHydrated, settings]);

  const updateSettings = useCallback((patch: Partial<PrayerSettings>) => {
    setSettings((current) => ({ ...current, ...patch }));
    setNotificationError(null);
  }, []);

  const updateLocation = useCallback((location: PrayerLocation) => {
    setSettings((current) => ({ ...current, location }));
    setLocationError(null);
  }, []);

  const useCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);
    setLocationPermissionBlocked(false);
    try {
      let coordinates: { latitude: number; longitude: number };
      if (Platform.OS === 'web') {
        coordinates = await getBrowserPosition();
      } else {
        let permission = await Location.getForegroundPermissionsAsync();
        if (!permission.granted) {
          permission = await Location.requestForegroundPermissionsAsync();
        }
        if (!permission.granted) {
          setLocationPermissionBlocked(!permission.canAskAgain);
          throw new Error(
            permission.canAskAgain
              ? 'لم يُمنح إذن الموقع. يمكنك اختيار الموقع يدويًا.'
              : 'إذن الموقع مغلق من إعدادات الجهاز.',
          );
        }
        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      }

      updateLocation({
        name: 'موقعي الحالي',
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        source: 'gps',
      });
    } catch (error) {
      setLocationError(
        error instanceof Error ? error.message : 'تعذر تحديد الموقع الحالي.',
      );
    } finally {
      setIsLocating(false);
    }
  }, [updateLocation]);

  const openLocationSettings = useCallback(async () => {
    try {
      await Linking.openSettings();
    } catch {
      setLocationError('افتح إعدادات التطبيق واسمح بالوصول إلى الموقع.');
    }
  }, []);

  const setRemindersEnabled = useCallback(async (enabled: boolean) => {
    setNotificationError(null);
    if (!enabled) {
      setSettings((current) => ({ ...current, remindersEnabled: false }));
      return true;
    }
    if (Platform.OS === 'web') {
      setNotificationError(
        'تفعيل الإشعارات المحلية متاح عند تشغيل التطبيق على الهاتف.',
      );
      return false;
    }
    try {
      const granted = await requestPrayerNotificationPermission();
      if (!granted) {
        setNotificationError(
          'لم يُمنح إذن الإشعارات. يمكنك تفعيله من إعدادات الجهاز.',
        );
        return false;
      }
      setSettings((current) => ({ ...current, remindersEnabled: true }));
      return true;
    } catch {
      setNotificationError('تعذر طلب إذن الإشعارات من الجهاز.');
      return false;
    }
  }, []);

  const value = useMemo(
    () => ({
      settings,
      isHydrated,
      isLocating,
      locationError,
      locationPermissionBlocked,
      notificationError,
      updateSettings,
      updateLocation,
      useCurrentLocation,
      openLocationSettings,
      setRemindersEnabled,
    }),
    [
      settings,
      isHydrated,
      isLocating,
      locationError,
      locationPermissionBlocked,
      notificationError,
      updateSettings,
      updateLocation,
      useCurrentLocation,
      openLocationSettings,
      setRemindersEnabled,
    ],
  );

  return (
    <PrayerContext.Provider value={value}>{children}</PrayerContext.Provider>
  );
}

export function usePrayerSettings() {
  const context = useContext(PrayerContext);
  if (!context) {
    throw new Error('usePrayerSettings must be used inside PrayerProvider.');
  }
  return context;
}