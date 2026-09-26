import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Accelerometer,
  Magnetometer,
  type AccelerometerMeasurement,
  type MagnetometerMeasurement,
} from 'expo-sensors';
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
import { getQiblaBearing } from '@/services/prayerTimes';
import { usePrayerSettings } from '@/state/PrayerContext';

export default function QiblaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { settings } = usePrayerSettings();
  const [heading, setHeading] = useState<number | null>(null);
  const [sensorError, setSensorError] = useState<string | null>(null);
  const gravity = useRef<AccelerometerMeasurement>({ x: 0, y: 0, z: 1, timestamp: 0 });
  const styles = createStyles(colors);
  const bearing = getQiblaBearing(
    settings.location.latitude,
    settings.location.longitude,
  );
  const relativeAngle =
    heading === null ? bearing : (bearing - heading + 360) % 360;

  useEffect(() => {
    if (Platform.OS === 'web') {
      setSensorError('البوصلة الحية متاحة على الهاتف. اتجاه القبلة المحسوب أدناه صحيح لموقعك.');
      return;
    }

    let magnetometerSubscription: { remove: () => void } | undefined;
    let accelerometerSubscription: { remove: () => void } | undefined;
    let active = true;

    Promise.all([
      Magnetometer.isAvailableAsync(),
      Accelerometer.isAvailableAsync(),
    ])
      .then(([magnetometerAvailable, accelerometerAvailable]) => {
        if (!active) return;
        if (!magnetometerAvailable) {
          setSensorError('هذا الجهاز لا يحتوي على مستشعر بوصلة.');
          return;
        }

        Accelerometer.setUpdateInterval(150);
        Magnetometer.setUpdateInterval(150);
        if (accelerometerAvailable) {
          accelerometerSubscription = Accelerometer.addListener((sample) => {
            gravity.current = sample;
          });
        }
        magnetometerSubscription = Magnetometer.addListener(
          (sample: MagnetometerMeasurement) => {
            const { x, y, z } = sample;
            const { x: ax, y: ay, z: az } = gravity.current;
            const roll = Math.atan2(ay, az);
            const pitch = Math.atan2(-ax, Math.sqrt(ay * ay + az * az));
            const horizontalX = x * Math.cos(pitch) + z * Math.sin(pitch);
            const horizontalY =
              x * Math.sin(roll) * Math.sin(pitch) +
              y * Math.cos(roll) -
              z * Math.sin(roll) * Math.cos(pitch);
            const degrees =
              ((Math.atan2(-horizontalY, horizontalX) * 180) / Math.PI + 360) %
              360;
            setHeading(degrees);
          },
        );
      })
      .catch(() => {
        if (active) setSensorError('تعذر تشغيل مستشعر البوصلة.');
      });

    return () => {
      active = false;
      magnetometerSubscription?.remove();
      accelerometerSubscription?.remove();
    };
  }, []);

  const stylesArrow = {
    transform: [{ rotate: `${relativeAngle}deg` }],
  };

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
        <Text style={styles.title}>اتجاه القبلة</Text>
        <Text style={styles.subtitle}>وجّه أعلى الهاتف نحو القبلة</Text>
      </View>

      <View style={styles.compassOuter}>
        <View style={styles.compassRing}>
          <Text style={styles.northLabel}>شمال</Text>
          <View style={styles.degreeDot} />
          <View style={[styles.needle, stylesArrow]}>
            <Ionicons name="navigate" size={65} color={colors.primary} />
          </View>
          <View style={styles.centerDot} />
        </View>
      </View>

      <View style={styles.bearingCard}>
        <Text style={styles.bearingCaption}>زاوية القبلة من الشمال</Text>
        <View style={styles.bearingRow}>
          <Text style={styles.degreeValue}>{Math.round(bearing)}°</Text>
          <Ionicons name="location" size={18} color={colors.primary} />
        </View>
        <Text style={styles.locationName}>{settings.location.name}</Text>
      </View>

      {sensorError ? (
        <View style={styles.infoPanel}>
          <Ionicons
            name={Platform.OS === 'web' ? 'phone-portrait-outline' : 'compass-outline'}
            size={19}
            color={colors.primary}
          />
          <Text style={styles.infoText}>{sensorError}</Text>
        </View>
      ) : heading === null ? (
        <View style={styles.infoPanel}>
          <Ionicons name="sync-outline" size={19} color={colors.primary} />
          <Text style={styles.infoText}>جارٍ قراءة مستشعر البوصلة…</Text>
        </View>
      ) : (
        <View style={styles.infoPanel}>
          <Ionicons name="checkmark-circle-outline" size={19} color={colors.primary} />
          <Text style={styles.infoText}>
            اتجاه الجهاز {Math.round(heading)}° — حرّك الهاتف ببطء لمعايرة البوصلة.
          </Text>
        </View>
      )}

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>لأفضل دقة</Text>
        <Text style={styles.tipText}>
          أبعد الهاتف عن المعادن والمغناطيس، واجعله مستويًا. قد تحتاج إلى تحريك
          الهاتف على شكل رقم ٨ لمعايرة المستشعر.
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void Haptics.selectionAsync();
          router.push('/settings');
        }}
        style={styles.locationAction}
      >
        <Ionicons name="location-outline" size={19} color={colors.primary} />
        <Text style={styles.locationActionText}>تغيير الموقع</Text>
        <Ionicons
          name="chevron-back"
          size={17}
          color={colors.mutedForeground}
        />
      </Pressable>
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
      gap: 20,
    },
    header: { alignItems: 'flex-end', gap: 5 },
    title: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 25,
      textAlign: 'right',
    },
    subtitle: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    compassOuter: {
      width: 280,
      height: 280,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 4,
    },
    compassRing: {
      width: 258,
      height: 258,
      borderRadius: 140,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.foreground,
      shadowOpacity: 0.07,
      shadowRadius: 22,
      shadowOffset: { width: 0, height: 8 },
      elevation: 3,
    },
    northLabel: {
      position: 'absolute',
      top: 16,
      color: colors.mutedForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 11,
    },
    degreeDot: {
      position: 'absolute',
      top: 45,
      width: 5,
      height: 5,
      borderRadius: 5,
      backgroundColor: colors.accent,
    },
    needle: {
      width: 74,
      height: 100,
      alignItems: 'center',
      justifyContent: 'flex-start',
      paddingTop: 3,
    },
    centerDot: {
      position: 'absolute',
      width: 11,
      height: 11,
      borderRadius: 8,
      backgroundColor: colors.accent,
      borderWidth: 2,
      borderColor: colors.card,
    },
    bearingCard: {
      borderRadius: 22,
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      alignItems: 'center',
      paddingVertical: 16,
      gap: 5,
    },
    bearingCaption: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
    },
    bearingRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    degreeValue: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 31,
    },
    locationName: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    infoPanel: {
      minHeight: 52,
      borderRadius: 16,
      backgroundColor: colors.secondary,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      paddingHorizontal: 14,
      gap: 10,
    },
    infoText: {
      flex: 1,
      color: colors.secondaryForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 18,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    tipCard: {
      borderRadius: 18,
      backgroundColor: colors.card,
      padding: 15,
      gap: 7,
    },
    tipTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 13,
      textAlign: 'right',
    },
    tipText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      lineHeight: 19,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    locationAction: {
      minHeight: 53,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 13,
      borderRadius: 16,
      backgroundColor: colors.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    locationActionText: {
      flex: 1,
      color: colors.foreground,
      fontFamily: 'Inter_500Medium',
      fontSize: 13,
      textAlign: 'right',
    },
  });
}