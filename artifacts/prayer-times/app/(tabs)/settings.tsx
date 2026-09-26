import { Ionicons } from '@expo/vector-icons';
import {
  setAudioModeAsync,
  useAudioPlayer,
  useAudioPlayerStatus,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardTypeOptions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { useColors } from '@/hooks/useColors';
import {
  CALCULATION_METHODS,
  type CalculationMethodId,
  type MadhabId,
} from '@/services/prayerTimes';
import { ADHAN_VOICES, getAdhanVoice } from '@/services/adhanAudio';
import { usePrayerSettings } from '@/state/PrayerContext';

type SettingsColors = ReturnType<typeof useColors>;

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    settings,
    isLocating,
    locationError,
    locationPermissionBlocked,
    notificationError,
    updateSettings,
    updateLocation,
    useCurrentLocation,
    openLocationSettings,
    setRemindersEnabled,
  } = usePrayerSettings();
  const [editingLocation, setEditingLocation] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const selectedVoice = getAdhanVoice(settings.adhanVoiceId);
  const adhanPlayer = useAudioPlayer(selectedVoice.url, {
    downloadFirst: true,
    updateInterval: 500,
  });
  const adhanStatus = useAudioPlayerStatus(adhanPlayer);
  const styles = createStyles(colors);

  useEffect(() => {
    void setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });

    return () => {
      adhanPlayer.pause();
      adhanPlayer.setActiveForLockScreen(false);
    };
  }, [adhanPlayer]);

  const beginEditLocation = () => {
    setLocationName(
      settings.location.source === 'sample' ? '' : settings.location.name,
    );
    setLatitude(String(settings.location.latitude));
    setLongitude(String(settings.location.longitude));
    setEditingLocation(true);
  };

  const saveLocation = () => {
    const lat = Number(latitude.replace(',', '.'));
    const lon = Number(longitude.replace(',', '.'));
    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lon) ||
      lat < -90 ||
      lat > 90 ||
      lon < -180 ||
      lon > 180
    ) {
      Alert.alert('إحداثيات غير صحيحة', 'أدخل خط عرض بين -90 و90 وخط طول بين -180 و180.');
      return;
    }
    updateLocation({
      name: locationName.trim() || 'موقع يدوي',
      latitude: lat,
      longitude: lon,
      source: 'manual',
    });
    setEditingLocation(false);
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const chooseMethod = (method: CalculationMethodId) => {
    void Haptics.selectionAsync();
    updateSettings({ calculationMethod: method });
  };

  const toggleAdhanPreview = (voiceId = settings.adhanVoiceId) => {
    const voice = getAdhanVoice(voiceId);
    if (adhanStatus.playing) {
      adhanPlayer.pause();
      adhanPlayer.setActiveForLockScreen(false);
      return;
    }

    if (voiceId !== settings.adhanVoiceId) {
      adhanPlayer.replace(voice.url);
    }
    adhanPlayer.setActiveForLockScreen(true, {
      title: `أذان ${voice.name}`,
      artist: 'مواقيت الصلاة',
      albumTitle: 'أصوات الأذان',
    });
    adhanPlayer.play();
  };

  return (
    <KeyboardAwareScrollViewCompat
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: insets.top + (Platform.OS === 'web' ? 67 : 14),
          paddingBottom: insets.bottom + (Platform.OS === 'web' ? 34 : 28),
        },
      ]}
      bottomOffset={24}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heading}>
        <Text style={styles.title}>الإعدادات</Text>
        <Text style={styles.subtitle}>خصّص المواقيت والتنبيهات حسب تفضيلك</Text>
      </View>

      <View style={styles.section}>
        <SectionTitle icon="location-outline" title="الموقع" colors={colors} />
        <View style={styles.locationCard}>
          <View style={styles.locationCurrent}>
            <View style={styles.locationMarker}>
              <Ionicons name="navigate" size={19} color={colors.primary} />
            </View>
            <View style={styles.locationCopy}>
              <Text style={styles.locationName}>{settings.location.name}</Text>
              <Text style={styles.coordinates}>
                {settings.location.latitude.toFixed(4)}°,{' '}
                {settings.location.longitude.toFixed(4)}°
              </Text>
              <Text style={styles.sourceLabel}>
                {settings.location.source === 'gps'
                  ? 'محدّد من الجهاز'
                  : settings.location.source === 'manual'
                    ? 'موقع يدوي'
                    : 'بيانات تجريبية'}
              </Text>
            </View>
          </View>
          <View style={styles.locationActions}>
            <Pressable
              accessibilityRole="button"
              disabled={isLocating}
              onPress={() => void useCurrentLocation()}
              style={[styles.actionButton, isLocating && styles.disabledButton]}
            >
              {isLocating ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Ionicons
                  name="locate-outline"
                  size={17}
                  color={colors.primaryForeground}
                />
              )}
              <Text style={styles.actionButtonText}>
                {isLocating ? 'جارٍ تحديد الموقع' : 'استخدم موقعي'}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={beginEditLocation}
              style={styles.secondaryButton}
            >
              <Ionicons
                name="create-outline"
                size={17}
                color={colors.primary}
              />
              <Text style={styles.secondaryButtonText}>إدخال يدوي</Text>
            </Pressable>
          </View>
          {locationError ? (
            <View style={styles.inlineError}>
              <Text style={styles.errorText}>{locationError}</Text>
              {locationPermissionBlocked ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => void openLocationSettings()}
                >
                  <Text style={styles.errorAction}>فتح إعدادات الجهاز</Text>
                </Pressable>
              ) : null}
            </View>
          ) : null}
          {editingLocation ? (
            <View style={styles.locationForm}>
              <Text style={styles.formTitle}>أدخل اسم المكان وإحداثياته</Text>
              <SettingsInput
                label="اسم المكان"
                value={locationName}
                onChangeText={setLocationName}
                placeholder="مثال: صفاقس"
                keyboardType="default"
                colors={colors}
              />
              <View style={styles.coordinateInputs}>
                <SettingsInput
                  label="خط الطول"
                  value={longitude}
                  onChangeText={setLongitude}
                  placeholder="10.7600"
                  keyboardType="decimal-pad"
                  colors={colors}
                />
                <SettingsInput
                  label="خط العرض"
                  value={latitude}
                  onChangeText={setLatitude}
                  placeholder="34.7400"
                  keyboardType="decimal-pad"
                  colors={colors}
                />
              </View>
              <View style={styles.formActions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={saveLocation}
                  style={styles.actionButton}
                >
                  <Text style={styles.actionButtonText}>حفظ الموقع</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setEditingLocation(false)}
                  style={styles.cancelButton}
                >
                  <Text style={styles.cancelButtonText}>إلغاء</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle
          icon="calculator-outline"
          title="طريقة الحساب"
          colors={colors}
        />
        <View style={styles.optionList}>
          {CALCULATION_METHODS.map((method) => {
            const selected = settings.calculationMethod === method.id;
            return (
              <Pressable
                key={method.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => chooseMethod(method.id)}
                style={styles.methodRow}
              >
                <View
                  style={[
                    styles.radioOuter,
                    selected && styles.radioOuterSelected,
                  ]}
                >
                  {selected ? <View style={styles.radioInner} /> : null}
                </View>
                <View style={styles.methodCopy}>
                  <Text style={styles.methodName}>{method.label}</Text>
                  <Text style={styles.methodDescription}>
                    {method.description}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.asrCard}>
          <Text style={styles.asrTitle}>طريقة حساب العصر</Text>
          <View style={styles.asrOptions}>
            {([
              ['shafi', 'شافعي / مالكي / حنبلي'],
              ['hanafi', 'حنفي'],
            ] as [MadhabId, string][]).map(([value, label]) => {
              const selected = settings.madhab === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => updateSettings({ madhab: value })}
                  style={[
                    styles.asrOption,
                    selected && styles.asrOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.asrOptionText,
                      selected && styles.asrOptionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle
          icon="notifications-outline"
          title="التنبيهات"
          colors={colors}
        />
        <View style={styles.settingCard}>
          <View style={styles.settingRow}>
            <Switch
              accessibilityLabel="تفعيل تنبيهات الصلاة"
              value={settings.remindersEnabled}
              onValueChange={(value) => void setRemindersEnabled(value)}
              trackColor={{
                false: colors.border,
                true: colors.primary,
              }}
              thumbColor={colors.card}
            />
            <View style={styles.settingCopy}>
              <Text style={styles.settingTitle}>تنبيهات أوقات الصلاة</Text>
              <Text style={styles.settingDescription}>
                {settings.remindersEnabled
                  ? 'مفعّلة على هذا الجهاز'
                  : 'تبدأ بعد منح إذن الإشعارات'}
              </Text>
            </View>
            <Ionicons
              name="alarm-outline"
              size={19}
              color={colors.primary}
            />
          </View>

          <View style={styles.divider} />
          <Text style={styles.settingTitle}>صوت التنبيه</Text>
          <View style={styles.asrOptions}>
            {([
              ['sound', 'صوت الإشعار'],
              ['silent', 'هادئ'],
            ] as ['sound' | 'silent', string][]).map(([value, label]) => {
              const selected = settings.reminderMode === value;
              return (
                <Pressable
                  key={value}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => updateSettings({ reminderMode: value })}
                  style={[
                    styles.asrOption,
                    selected && styles.asrOptionSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.asrOptionText,
                      selected && styles.asrOptionTextSelected,
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {notificationError ? (
            <View style={styles.inlineError}>
              <Text style={styles.errorText}>{notificationError}</Text>
            </View>
          ) : null}
          <View style={styles.notice}>
            <Ionicons
              name="information-circle-outline"
              size={18}
              color={colors.mutedForeground}
            />
            <Text style={styles.noticeText}>
              تُجدول التنبيهات محليًا لثمانية أيام وتُحدّث عند فتح التطبيق. قد
              يؤخر وضع توفير الطاقة بعض التنبيهات. صوت الإشعار ليس تسجيل أذان
              كاملًا؛ تشغيل الأذان كاملًا بالخلفية يحتاج إعدادًا أصليًا خاصًا،
              كما يقيّد iOS صوت الإشعار المخصص إلى 30 ثانية.
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle
          icon="contrast-outline"
          title="المظهر"
          colors={colors}
        />
        <View style={styles.settingCard}>
          <View style={styles.themeOptions}>
            {([
              ['system', 'تلقائي', 'phone-portrait-outline'],
              ['light', 'فاتح', 'sunny-outline'],
              ['dark', 'داكن', 'moon-outline'],
            ] as ['system' | 'light' | 'dark', string, keyof typeof Ionicons.glyphMap][]).map(
              ([value, label, icon]) => {
                const selected = settings.themeMode === value;
                return (
                  <Pressable
                    key={value}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => updateSettings({ themeMode: value })}
                    style={[
                      styles.themeOption,
                      selected && styles.themeOptionSelected,
                    ]}
                  >
                    <Ionicons
                      name={icon}
                      size={18}
                      color={selected ? colors.primary : colors.mutedForeground}
                    />
                    <Text
                      style={[
                        styles.themeLabel,
                        selected && styles.themeLabelSelected,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              },
            )}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <SectionTitle
          icon="musical-notes-outline"
          title="صوت الأذان"
          colors={colors}
        />
        <View style={styles.settingCard}>
          <Text style={styles.settingDescription}>
            اختر صوتًا من تسجيلات عامة الترخيص. يُنزّل الصوت عند الضغط على
            الاستماع ويمكنه الاستمرار عند قفل الشاشة في النسخة المستقلة.
          </Text>
          <View style={styles.voiceList}>
            {ADHAN_VOICES.map((voice) => {
              const selected = settings.adhanVoiceId === voice.id;
              return (
                <View key={voice.id} style={styles.voiceRow}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    onPress={() => {
                      if (adhanStatus.playing) {
                        adhanPlayer.pause();
                        adhanPlayer.setActiveForLockScreen(false);
                      }
                      updateSettings({ adhanVoiceId: voice.id });
                    }}
                    style={styles.voiceChoice}
                  >
                    <View style={styles.voiceCopy}>
                      <Text style={styles.voiceName}>{voice.name}</Text>
                      <Text style={styles.voiceDescription}>
                        {voice.description} · {voice.duration}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.radioOuter,
                        selected && styles.radioOuterSelected,
                      ]}
                    >
                      {selected ? <View style={styles.radioInner} /> : null}
                    </View>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`استماع إلى أذان ${voice.name}`}
                    onPress={() => {
                      if (!selected) {
                        updateSettings({ adhanVoiceId: voice.id });
                      }
                      toggleAdhanPreview(voice.id);
                    }}
                    style={[
                      styles.previewButton,
                      selected && styles.previewButtonSelected,
                    ]}
                  >
                    <Ionicons
                      name={
                        selected && adhanStatus.playing
                          ? 'pause'
                          : 'play'
                      }
                      size={15}
                      color={
                        selected
                          ? colors.primaryForeground
                          : colors.primary
                      }
                    />
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Text style={styles.sourceNote}>
            المصدر: Internet Archive · Public Domain Mark 1.0. عند إغلاق
            التطبيق بالكامل، يبقى تنبيه النظام احتياطيًا؛ تشغيل ملف طويل
            تلقائيًا يحتاج إعدادًا أصليًا للمنبّه في Android وAlarmKit في iOS.
          </Text>
        </View>
      </View>

      <Text style={styles.footer}>
        تُحسب المواقيت على الجهاز باستخدام مكتبة Adhan. قد تختلف دقيقة أو أكثر
        حسب التقويم المحلي والاعتماد الرسمي في منطقتك.
      </Text>
    </KeyboardAwareScrollViewCompat>
  );
}

function SectionTitle({
  icon,
  title,
  colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  colors: SettingsColors;
}) {
  return (
    <View style={createStyles(colors).sectionTitleRow}>
      <Text style={createStyles(colors).sectionTitle}>{title}</Text>
      <Ionicons name={icon} size={18} color={colors.primary} />
    </View>
  );
}

function SettingsInput({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  colors,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
  keyboardType: KeyboardTypeOptions;
  colors: SettingsColors;
}) {
  const styles = createStyles(colors);
  return (
    <View style={styles.inputWrap}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        autoCapitalize="words"
        style={styles.input}
        textAlign="right"
      />
    </View>
  );
}

function createStyles(colors: SettingsColors) {
  return StyleSheet.create({
    content: {
      width: '100%',
      maxWidth: 560,
      alignSelf: 'center',
      paddingHorizontal: 20,
      gap: 23,
    },
    heading: { alignItems: 'flex-end', gap: 5 },
    title: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 25,
      textAlign: 'right',
    },
    subtitle: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    section: { gap: 11 },
    sectionTitleRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
    },
    sectionTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 16,
      textAlign: 'right',
    },
    locationCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 14,
      gap: 14,
    },
    locationCurrent: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 11,
    },
    locationMarker: {
      width: 42,
      height: 42,
      borderRadius: 14,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationCopy: { flex: 1, alignItems: 'flex-end', gap: 3 },
    locationName: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 14,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    coordinates: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
    },
    sourceLabel: {
      color: colors.primary,
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
    },
    locationActions: { flexDirection: 'row-reverse', gap: 8 },
    actionButton: {
      minHeight: 42,
      flex: 1,
      borderRadius: 13,
      backgroundColor: colors.primary,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 10,
    },
    disabledButton: { opacity: 0.7 },
    actionButtonText: {
      color: colors.primaryForeground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
      textAlign: 'center',
    },
    secondaryButton: {
      minHeight: 42,
      flex: 1,
      borderRadius: 13,
      backgroundColor: colors.secondary,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      paddingHorizontal: 10,
    },
    secondaryButtonText: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
    },
    inlineError: {
      borderRadius: 12,
      backgroundColor: colors.muted,
      padding: 11,
      gap: 7,
    },
    errorText: {
      color: colors.destructive,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      lineHeight: 17,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    errorAction: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
      textAlign: 'right',
    },
    locationForm: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 12,
      gap: 11,
    },
    formTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      textAlign: 'right',
    },
    coordinateInputs: { flexDirection: 'row-reverse', gap: 9 },
    inputWrap: { flex: 1, gap: 5 },
    inputLabel: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
      textAlign: 'right',
    },
    input: {
      minHeight: 42,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.input,
      backgroundColor: colors.background,
      color: colors.foreground,
      paddingHorizontal: 10,
      fontFamily: 'Inter_400Regular',
      fontSize: 13,
      writingDirection: 'rtl',
    },
    formActions: { flexDirection: 'row-reverse', gap: 8 },
    cancelButton: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 42,
      borderRadius: 13,
      backgroundColor: colors.secondary,
    },
    cancelButtonText: {
      color: colors.secondaryForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
    },
    optionList: {
      overflow: 'hidden',
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: 13,
    },
    methodRow: {
      minHeight: 67,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    methodCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
    methodName: {
      color: colors.foreground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    methodDescription: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    radioOuter: {
      width: 19,
      height: 19,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    radioOuterSelected: { borderColor: colors.primary },
    radioInner: {
      width: 9,
      height: 9,
      borderRadius: 7,
      backgroundColor: colors.primary,
    },
    asrCard: {
      backgroundColor: colors.card,
      borderRadius: 18,
      padding: 13,
      gap: 10,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    asrTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
      textAlign: 'right',
    },
    asrOptions: { flexDirection: 'row-reverse', gap: 8 },
    asrOption: {
      flex: 1,
      minHeight: 39,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: colors.secondary,
      paddingHorizontal: 7,
    },
    asrOptionSelected: { backgroundColor: colors.primary },
    asrOptionText: {
      color: colors.secondaryForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
      textAlign: 'center',
      writingDirection: 'rtl',
    },
    asrOptionTextSelected: {
      color: colors.primaryForeground,
      fontFamily: 'Inter_600SemiBold',
    },
    settingCard: {
      backgroundColor: colors.card,
      borderRadius: 20,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: 14,
      gap: 12,
    },
    settingRow: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
    },
    settingCopy: { flex: 1, alignItems: 'flex-end', gap: 4 },
    settingTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
      textAlign: 'right',
    },
    settingDescription: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    voiceList: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    voiceRow: {
      minHeight: 62,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    voiceChoice: {
      flex: 1,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 10,
      minHeight: 62,
    },
    voiceCopy: {
      flex: 1,
      alignItems: 'flex-end',
      gap: 3,
    },
    voiceName: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 12,
      textAlign: 'right',
    },
    voiceDescription: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    previewButton: {
      width: 35,
      height: 35,
      borderRadius: 18,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewButtonSelected: {
      backgroundColor: colors.primary,
    },
    sourceNote: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 9,
      lineHeight: 15,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    notice: {
      flexDirection: 'row-reverse',
      alignItems: 'flex-start',
      gap: 8,
      backgroundColor: colors.muted,
      borderRadius: 13,
      padding: 11,
    },
    noticeText: {
      flex: 1,
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    themeOptions: { flexDirection: 'row-reverse', gap: 8 },
    themeOption: {
      flex: 1,
      minHeight: 58,
      borderRadius: 14,
      backgroundColor: colors.secondary,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
    },
    themeOptionSelected: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    themeLabel: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 10,
    },
    themeLabelSelected: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    footer: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      writingDirection: 'rtl',
      paddingHorizontal: 10,
    },
  });
}