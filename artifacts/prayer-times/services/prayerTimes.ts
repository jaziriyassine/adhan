import {
  CalculationMethod,
  Coordinates,
  HighLatitudeRule,
  Madhab,
  PrayerTimes,
} from 'adhan';

export type CalculationMethodId =
  | 'MuslimWorldLeague'
  | 'Egyptian'
  | 'UmmAlQura'
  | 'Karachi'
  | 'NorthAmerica'
  | 'Turkey';

export type MadhabId = 'shafi' | 'hanafi';
export type PrayerKey =
  | 'fajr'
  | 'sunrise'
  | 'dhuhr'
  | 'asr'
  | 'maghrib'
  | 'isha';

export interface PrayerLocation {
  latitude: number;
  longitude: number;
  name: string;
  source: 'sample' | 'manual' | 'gps';
}

export interface PrayerSettingsForCalculation {
  calculationMethod: CalculationMethodId;
  madhab: MadhabId;
}

export interface PrayerEntry {
  key: PrayerKey;
  label: string;
  time: Date;
  isPrayer: boolean;
}

export const CALCULATION_METHODS: {
  id: CalculationMethodId;
  label: string;
  description: string;
}[] = [
  {
    id: 'MuslimWorldLeague',
    label: 'رابطة العالم الإسلامي',
    description: 'مناسب لكثير من دول أوروبا وأفريقيا والشرق الأقصى',
  },
  {
    id: 'Egyptian',
    label: 'الهيئة المصرية العامة للمساحة',
    description: 'المعتمد في مصر وبعض الدول المجاورة',
  },
  {
    id: 'UmmAlQura',
    label: 'جامعة أم القرى',
    description: 'المعتمد في المملكة العربية السعودية',
  },
  {
    id: 'Karachi',
    label: 'جامعة العلوم الإسلامية – كراتشي',
    description: 'مستخدم في جنوب آسيا',
  },
  {
    id: 'NorthAmerica',
    label: 'ISNA – أمريكا الشمالية',
    description: 'المعتمد في الولايات المتحدة وكندا',
  },
  {
    id: 'Turkey',
    label: 'رئاسة الشؤون الدينية – تركيا',
    description: 'طريقة الحساب التركية',
  },
];

const METHOD_FACTORIES: Record<
  CalculationMethodId,
  () => ReturnType<typeof CalculationMethod.MuslimWorldLeague>
> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  Egyptian: CalculationMethod.Egyptian,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Karachi: CalculationMethod.Karachi,
  NorthAmerica: CalculationMethod.NorthAmerica,
  Turkey: CalculationMethod.Turkey,
};

const PRAYER_LABELS: Record<PrayerKey, string> = {
  fajr: 'الفجر',
  sunrise: 'الشروق',
  dhuhr: 'الظهر',
  asr: 'العصر',
  maghrib: 'المغرب',
  isha: 'العشاء',
};

export function getPrayerSchedule(
  location: PrayerLocation,
  settings: PrayerSettingsForCalculation,
  date: Date = new Date(),
): PrayerEntry[] {
  const coordinates = new Coordinates(location.latitude, location.longitude);
  const calculationDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    12,
    0,
    0,
  );
  const parameters = METHOD_FACTORIES[settings.calculationMethod]();
  parameters.madhab =
    settings.madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;
  parameters.highLatitudeRule = HighLatitudeRule.recommended(coordinates);

  const times = new PrayerTimes(coordinates, calculationDate, parameters);
  return [
    { key: 'fajr', label: PRAYER_LABELS.fajr, time: times.fajr, isPrayer: true },
    {
      key: 'sunrise',
      label: PRAYER_LABELS.sunrise,
      time: times.sunrise,
      isPrayer: false,
    },
    {
      key: 'dhuhr',
      label: PRAYER_LABELS.dhuhr,
      time: times.dhuhr,
      isPrayer: true,
    },
    { key: 'asr', label: PRAYER_LABELS.asr, time: times.asr, isPrayer: true },
    {
      key: 'maghrib',
      label: PRAYER_LABELS.maghrib,
      time: times.maghrib,
      isPrayer: true,
    },
    { key: 'isha', label: PRAYER_LABELS.isha, time: times.isha, isPrayer: true },
  ];
}

export function getNextPrayer(
  location: PrayerLocation,
  settings: PrayerSettingsForCalculation,
  now: Date = new Date(),
): PrayerEntry {
  for (let dayOffset = 0; dayOffset < 3; dayOffset += 1) {
    const date = new Date(now);
    date.setDate(date.getDate() + dayOffset);
    const upcoming = getPrayerSchedule(location, settings, date).find(
      (entry) => entry.isPrayer && entry.time.getTime() > now.getTime(),
    );
    if (upcoming) return upcoming;
  }

  throw new Error('تعذر حساب الصلاة القادمة لهذا الموقع.');
}

export function getCurrentPrayerKey(
  schedule: PrayerEntry[],
  now: Date = new Date(),
): PrayerKey | null {
  const current = schedule
    .filter((entry) => entry.isPrayer && entry.time.getTime() <= now.getTime())
    .at(-1);
  return current?.key ?? null;
}

export function getQiblaBearing(latitude: number, longitude: number): number {
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const toDegrees = (radians: number) => (radians * 180) / Math.PI;
  const kaabaLatitude = toRadians(21.4225241);
  const kaabaLongitude = toRadians(39.8261818);
  const currentLatitude = toRadians(latitude);
  const longitudeDifference = kaabaLongitude - toRadians(longitude);

  const y = Math.sin(longitudeDifference);
  const x =
    Math.cos(currentLatitude) * Math.tan(kaabaLatitude) -
    Math.sin(currentLatitude) * Math.cos(longitudeDifference);
  return (toDegrees(Math.atan2(y, x)) + 360) % 360;
}

export function formatPrayerTime(date: Date): string {
  return date.toLocaleTimeString('ar-TN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatGregorianDate(date: Date): string {
  return new Intl.DateTimeFormat('ar-TN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function formatHijriDate(date: Date): string {
  try {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date);
  }
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
}