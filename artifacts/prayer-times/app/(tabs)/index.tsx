import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  formatCountdown,
  formatGregorianDate,
  formatHijriDate,
  formatPrayerTime,
  getCurrentPrayerKey,
  getNextPrayer,
  getPrayerSchedule,
} from '@/services/prayerTimes';
import { usePrayerSettings } from '@/state/PrayerContext';

export default function PrayerHomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { settings } = usePrayerSettings();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const todaySchedule = useMemo(
    () => getPrayerSchedule(settings.location, settings, now),
    [
      settings.location,
      settings.calculationMethod,
      settings.madhab,
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ],
  );
  const nextPrayer = useMemo(
    () => getNextPrayer(settings.location, settings, now),
    [
      settings.location,
      settings.calculationMethod,
      settings.madhab,
      Math.floor(now.getTime() / 60_000),
    ],
  );
  const currentPrayer = getCurrentPrayerKey(todaySchedule, now);
  const countdown = formatCountdown(nextPrayer.time.getTime() - now.getTime());
  const styles = createStyles(colors);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 14),
          paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 28),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="إعدادات الموقع"
          onPress={() => router.push('/settings')}
          style={styles.locationButton}
        >
          <Ionicons name="location-outline" size={19} color={colors.primary} />
          <View style={styles.locationText}>
            <Text style={styles.eyebrow}>موقع الصلاة</Text>
            <Text style={styles.locationName} numberOfLines={1}>
              {settings.location.name}
            </Text>
          </View>
          <Ionicons
            name="chevron-down"
            size={16}
            color={colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="اتجاه القبلة"
          onPress={() => router.push('/qibla')}
          style={styles.headerIcon}
        >
          <Ionicons name="compass-outline" size={23} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.dateBlock}>
        <Text style={styles.hijriDate}>{formatHijriDate(now)} هـ</Text>
        <Text style={styles.gregorianDate}>{formatGregorianDate(now)}</Text>
      </View>

      {settings.location.source === 'sample' ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/settings')}
          style={styles.sampleBanner}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.accentForeground}
          />
          <Text style={styles.sampleBannerText}>
            هذه أوقات تجريبية لتونس. حدّد موقعك للحصول على مواقيت دقيقة.
          </Text>
          <Ionicons
            name="chevron-back"
            size={16}
            color={colors.accentForeground}
          />
        </Pressable>
      ) : null}

      <View
        accessibilityLabel={`الصلاة القادمة ${nextPrayer.label} بعد ${countdown}`}
        style={styles.nextCard}
      >
        <View style={styles.cardTopLine}>
          <View style={styles.liveMark} />
          <Text style={styles.nextEyebrow}>الصلاة القادمة</Text>
        </View>
        <View style={styles.nextMain}>
          <View>
            <Text style={styles.nextPrayerName}>{nextPrayer.label}</Text>
            <Text style={styles.nextTime}>
              {formatPrayerTime(nextPrayer.time)}
            </Text>
          </View>
          <View style={styles.countdownBlock}>
            <Text style={styles.countdownLabel}>الوقت المتبقي</Text>
            <Text style={styles.countdown}>{countdown}</Text>
          </View>
        </View>
        <View style={styles.nextFooter}>
          <Ionicons
            name="notifications-outline"
            size={16}
            color={colors.primaryForeground}
          />
          <Text style={styles.nextFooterText}>
            {settings.remindersEnabled
              ? settings.reminderMode === 'silent'
                ? 'التنبيهات مفعّلة — الوضع الهادئ'
                : 'التنبيهات مفعّلة'
              : 'التنبيهات متوقفة — اضغط لتفعيلها'}
          </Text>
          {!settings.remindersEnabled ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="فتح إعدادات التنبيهات"
              onPress={() => router.push('/settings')}
              hitSlop={10}
            >
              <Ionicons
                name="arrow-back-circle-outline"
                size={22}
                color={colors.primaryForeground}
              />
            </Pressable>
          ) : null}
        </View>
      </View>

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>مواقيت اليوم</Text>
        <Text style={styles.methodLabel}>
          {settings.calculationMethod === 'MuslimWorldLeague'
            ? 'رابطة العالم الإسلامي'
            : settings.calculationMethod === 'Egyptian'
              ? 'الهيئة المصرية'
              : settings.calculationMethod === 'UmmAlQura'
                ? 'أم القرى'
                : settings.calculationMethod === 'Karachi'
                  ? 'كراتشي'
                  : settings.calculationMethod === 'NorthAmerica'
                    ? 'ISNA'
                    : 'تركيا'}
        </Text>
      </View>

      <View style={styles.prayerList}>
        {todaySchedule.map((prayer) => {
          const isCurrent = prayer.key === currentPrayer;
          const isNext = prayer.key === nextPrayer.key;
          return (
            <View
              key={prayer.key}
              style={[
                styles.prayerRow,
                (isCurrent || isNext) && styles.activePrayerRow,
              ]}
            >
              <View style={styles.prayerNameGroup}>
                <View
                  style={[
                    styles.prayerDot,
                    (isCurrent || isNext) && styles.activePrayerDot,
                  ]}
                />
                <Text
                  style={[
                    styles.prayerName,
                    (isCurrent || isNext) && styles.activePrayerText,
                    !prayer.isPrayer && styles.sunriseText,
                  ]}
                >
                  {prayer.label}
                </Text>
              </View>
              <View style={styles.prayerTimeGroup}>
                {isCurrent ? (
                  <Text style={styles.nowBadge}>الآن</Text>
                ) : isNext ? (
                  <Text style={styles.nextBadge}>القادمة</Text>
                ) : null}
                <Text
                  style={[
                    styles.prayerTime,
                    (isCurrent || isNext) && styles.activePrayerText,
                  ]}
                >
                  {formatPrayerTime(prayer.time)}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      <View style={styles.quickActions}>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/qibla')}
          style={styles.quickAction}
        >
          <View style={styles.quickIcon}>
            <Ionicons
              name="navigate-outline"
              size={21}
              color={colors.primary}
            />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickTitle}>اتجاه القبلة</Text>
            <Text style={styles.quickSubtitle}>البوصلة من موقعك</Text>
          </View>
          <Ionicons
            name="chevron-back"
            size={17}
            color={colors.mutedForeground}
          />
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/adhkar')}
          style={styles.quickAction}
        >
          <View style={styles.quickIcon}>
            <Ionicons name="book-outline" size={21} color={colors.primary} />
          </View>
          <View style={styles.quickCopy}>
            <Text style={styles.quickTitle}>الأذكار</Text>
            <Text style={styles.quickSubtitle}>الصباح والمساء وبعد الصلاة</Text>
          </View>
          <Ionicons
            name="chevron-back"
            size={17}
            color={colors.mutedForeground}
          />
        </Pressable>
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    content: {
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      paddingHorizontal: 22,
      gap: 18,
    },
    header: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    locationButton: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 9,
      maxWidth: '82%',
    },
    locationText: { alignItems: 'flex-end', gap: 2 },
    eyebrow: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 11,
    },
    locationName: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      maxWidth: 210,
      writingDirection: 'rtl',
    },
    headerIcon: {
      width: 42,
      height: 42,
      alignItems: 'center',
      justifyContent: 'center',
    },
    dateBlock: { alignItems: 'flex-end', gap: 4, marginTop: 3 },
    hijriDate: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 19,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    gregorianDate: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    sampleBanner: {
      minHeight: 48,
      borderRadius: 15,
      backgroundColor: colors.accent,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: 13,
      gap: 9,
    },
    sampleBannerText: {
      flex: 1,
      color: colors.accentForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    nextCard: {
      borderRadius: 25,
      backgroundColor: colors.primary,
      paddingHorizontal: 21,
      paddingTop: 20,
      paddingBottom: 15,
      gap: 19,
    },
    cardTopLine: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
    },
    liveMark: {
      width: 7,
      height: 7,
      borderRadius: 7,
      backgroundColor: colors.accent,
    },
    nextEyebrow: {
      color: colors.primaryForeground,
      opacity: 0.8,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
    },
    nextMain: {
      flexDirection: 'row-reverse',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    },
    nextPrayerName: {
      color: colors.primaryForeground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 25,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    nextTime: {
      color: colors.primaryForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 18,
      opacity: 0.8,
      marginTop: 5,
    },
    countdownBlock: { alignItems: 'flex-end', paddingBottom: 2 },
    countdownLabel: {
      color: colors.primaryForeground,
      opacity: 0.75,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      marginBottom: 4,
    },
    countdown: {
      color: colors.primaryForeground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 24,
      letterSpacing: 0.3,
    },
    nextFooter: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.primaryForeground,
      opacity: 0.88,
      paddingTop: 12,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
    },
    nextFooterText: {
      flex: 1,
      color: colors.primaryForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    sectionHeading: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 2,
    },
    sectionTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 18,
      textAlign: 'right',
    },
    methodLabel: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      textAlign: 'right',
      writingDirection: 'rtl',
      maxWidth: 175,
    },
    prayerList: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 22,
      paddingHorizontal: 14,
      overflow: 'hidden',
    },
    prayerRow: {
      minHeight: 53,
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    activePrayerRow: {
      marginHorizontal: -14,
      paddingHorizontal: 14,
      backgroundColor: colors.secondary,
    },
    prayerNameGroup: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
    },
    prayerDot: {
      width: 7,
      height: 7,
      borderRadius: 8,
      backgroundColor: colors.border,
    },
    activePrayerDot: { backgroundColor: colors.primary },
    prayerName: {
      color: colors.foreground,
      fontFamily: 'Inter_500Medium',
      fontSize: 15,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    sunriseText: { color: colors.mutedForeground, fontSize: 13 },
    activePrayerText: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    prayerTimeGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    prayerTime: {
      color: colors.foreground,
      fontFamily: 'Inter_500Medium',
      fontSize: 14,
      minWidth: 48,
      textAlign: 'left',
    },
    nowBadge: {
      color: colors.primary,
      backgroundColor: colors.card,
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 9,
    },
    nextBadge: {
      color: colors.accentForeground,
      backgroundColor: colors.accent,
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 9,
    },
    quickActions: { gap: 10 },
    quickAction: {
      minHeight: 64,
      paddingHorizontal: 12,
      borderRadius: 18,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 11,
    },
    quickIcon: {
      width: 40,
      height: 40,
      borderRadius: 14,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickCopy: { flex: 1, alignItems: 'flex-end', gap: 3 },
    quickTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      textAlign: 'right',
    },
    quickSubtitle: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
  });
}