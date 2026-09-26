import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import React, { useState } from 'react';
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

type DhikrCategory = 'morning' | 'evening' | 'afterPrayer';
interface Dhikr {
  id: string;
  text: string;
  count: number;
  note?: string;
}

const DHIKR: Record<DhikrCategory, Dhikr[]> = {
  morning: [
    {
      id: 'morning-1',
      text: 'أَصْبَحْنَا وَأَصْبَحَ الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
      count: 1,
    },
    {
      id: 'morning-2',
      text: 'اللَّهُمَّ بِكَ أَصْبَحْنَا، وَبِكَ أَمْسَيْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ النُّشُورُ',
      count: 1,
    },
    {
      id: 'morning-3',
      text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      count: 100,
    },
    {
      id: 'morning-4',
      text: 'قُلْ هُوَ اللَّهُ أَحَدٌ، اللَّهُ الصَّمَدُ، لَمْ يَلِدْ وَلَمْ يُولَدْ، وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ',
      count: 3,
      note: 'سورة الإخلاص',
    },
    {
      id: 'morning-5',
      text: 'أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ شَرِّ مَا خَلَقَ',
      count: 3,
    },
  ],
  evening: [
    {
      id: 'evening-1',
      text: 'أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ، وَالْحَمْدُ لِلَّهِ، لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ',
      count: 1,
    },
    {
      id: 'evening-2',
      text: 'اللَّهُمَّ بِكَ أَمْسَيْنَا، وَبِكَ أَصْبَحْنَا، وَبِكَ نَحْيَا، وَبِكَ نَمُوتُ، وَإِلَيْكَ الْمَصِيرُ',
      count: 1,
    },
    {
      id: 'evening-3',
      text: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',
      count: 100,
    },
    {
      id: 'evening-4',
      text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ، مِنْ شَرِّ مَا خَلَقَ، وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ',
      count: 3,
      note: 'سورة الفلق',
    },
    {
      id: 'evening-5',
      text: 'بِسْمِ اللَّهِ الَّذِي لَا يَضُرُّ مَعَ اسْمِهِ شَيْءٌ فِي الْأَرْضِ وَلَا فِي السَّمَاءِ وَهُوَ السَّمِيعُ الْعَلِيمُ',
      count: 3,
    },
  ],
  afterPrayer: [
    {
      id: 'after-1',
      text: 'أَسْتَغْفِرُ اللَّهَ',
      count: 3,
    },
    {
      id: 'after-2',
      text: 'اللَّهُمَّ أَنْتَ السَّلَامُ وَمِنْكَ السَّلَامُ، تَبَارَكْتَ يَا ذَا الْجَلَالِ وَالْإِكْرَامِ',
      count: 1,
    },
    {
      id: 'after-3',
      text: 'سُبْحَانَ اللَّهِ',
      count: 33,
    },
    {
      id: 'after-4',
      text: 'الْحَمْدُ لِلَّهِ',
      count: 33,
    },
    {
      id: 'after-5',
      text: 'اللَّهُ أَكْبَرُ',
      count: 33,
    },
  ],
};

const CATEGORIES: { id: DhikrCategory; label: string }[] = [
  { id: 'morning', label: 'الصباح' },
  { id: 'evening', label: 'المساء' },
  { id: 'afterPrayer', label: 'بعد الصلاة' },
];

export default function AdhkarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<DhikrCategory>('morning');
  const [counts, setCounts] = useState<Record<string, number>>({});
  const styles = createStyles(colors);

  const increment = (item: Dhikr) => {
    void Haptics.selectionAsync();
    setCounts((previous) => {
      const current = previous[item.id] ?? 0;
      return {
        ...previous,
        [item.id]: current >= item.count ? 0 : current + 1,
      };
    });
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
        <View style={styles.headerIcon}>
          <Ionicons name="sparkles-outline" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>الأذكار</Text>
          <Text style={styles.subtitle}>لحظات ذكر وطمأنينة في يومك</Text>
        </View>
      </View>

      <View style={styles.segment}>
        {CATEGORIES.map((item) => {
          const selected = category === item.id;
          return (
            <Pressable
              key={item.id}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => {
                void Haptics.selectionAsync();
                setCategory(item.id);
              }}
              style={[styles.segmentButton, selected && styles.segmentSelected]}
            >
              <Text
                style={[
                  styles.segmentText,
                  selected && styles.segmentTextSelected,
                ]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.collectionHeading}>
        <Text style={styles.collectionTitle}>
          {category === 'morning'
            ? 'أذكار الصباح'
            : category === 'evening'
              ? 'أذكار المساء'
              : 'أذكار بعد الصلاة'}
        </Text>
        <Text style={styles.collectionCount}>{DHIKR[category].length} أذكار</Text>
      </View>

      {DHIKR[category].map((item, index) => {
        const current = counts[item.id] ?? 0;
        const complete = current >= item.count;
        return (
          <View key={item.id} style={styles.dhikrCard}>
            <View style={styles.dhikrTop}>
              <Text style={styles.dhikrNumber}>
                {String(index + 1).padStart(2, '0')}
              </Text>
              {item.note ? (
                <Text style={styles.sourceNote}>{item.note}</Text>
              ) : null}
            </View>
            <Text style={styles.dhikrText}>{item.text}</Text>
            <View style={styles.dhikrBottom}>
              <Text style={styles.repeatHint}>
                {complete ? 'اكتمل الذكر' : `يُقال ${item.count} ${item.count === 1 ? 'مرة' : 'مرات'}`}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`تسجيل الذكر ${current} من ${item.count}`}
                onPress={() => increment(item)}
                style={[
                  styles.counter,
                  complete && styles.counterComplete,
                ]}
              >
                <Text
                  style={[
                    styles.counterText,
                    complete && styles.counterTextComplete,
                  ]}
                >
                  {complete ? 'تم' : `${current} / ${item.count}`}
                </Text>
                <Ionicons
                  name={complete ? 'checkmark' : 'add'}
                  size={17}
                  color={complete ? colors.primaryForeground : colors.primary}
                />
              </Pressable>
            </View>
          </View>
        );
      })}
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
      gap: 15,
    },
    header: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      gap: 13,
      marginBottom: 3,
    },
    headerIcon: {
      width: 45,
      height: 45,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.secondary,
    },
    headerCopy: { alignItems: 'flex-end', gap: 4 },
    title: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 24,
    },
    subtitle: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 12,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    segment: {
      minHeight: 48,
      padding: 4,
      borderRadius: 16,
      backgroundColor: colors.secondary,
      flexDirection: 'row-reverse',
      gap: 3,
    },
    segmentButton: {
      flex: 1,
      borderRadius: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    segmentSelected: {
      backgroundColor: colors.card,
      shadowColor: colors.foreground,
      shadowOpacity: 0.06,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 1,
    },
    segmentText: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_500Medium',
      fontSize: 12,
    },
    segmentTextSelected: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
    },
    collectionHeading: {
      flexDirection: 'row-reverse',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: 5,
    },
    collectionTitle: {
      color: colors.foreground,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 17,
      textAlign: 'right',
    },
    collectionCount: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
    },
    dhikrCard: {
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 15,
      gap: 13,
    },
    dhikrTop: {
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    dhikrNumber: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
    },
    sourceNote: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 10,
      textAlign: 'right',
    },
    dhikrText: {
      color: colors.foreground,
      fontFamily: 'Inter_500Medium',
      fontSize: 17,
      lineHeight: 32,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    dhikrBottom: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      paddingTop: 11,
      flexDirection: 'row-reverse',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    repeatHint: {
      color: colors.mutedForeground,
      fontFamily: 'Inter_400Regular',
      fontSize: 11,
      textAlign: 'right',
      writingDirection: 'rtl',
    },
    counter: {
      minWidth: 88,
      height: 35,
      paddingHorizontal: 10,
      borderRadius: 12,
      backgroundColor: colors.secondary,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 4,
    },
    counterComplete: { backgroundColor: colors.primary },
    counterText: {
      color: colors.primary,
      fontFamily: 'Inter_600SemiBold',
      fontSize: 11,
    },
    counterTextComplete: { color: colors.primaryForeground },
  });
}