import React from 'react';
import { Platform, useColorScheme } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { Ionicons } from '@expo/vector-icons';
import { isLiquidGlassAvailable } from 'expo-glass-effect';
import { Tabs } from 'expo-router';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon sf={{ default: 'clock', selected: 'clock.fill' }} />
        <NativeTabs.Trigger.Label>الصلاة</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="qibla">
        <NativeTabs.Trigger.Icon sf={{ default: 'location.north', selected: 'location.north.fill' }} />
        <NativeTabs.Trigger.Label>القبلة</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="adhkar">
        <NativeTabs.Trigger.Icon sf={{ default: 'book.closed', selected: 'book.closed.fill' }} />
        <NativeTabs.Trigger.Label>الأذكار</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="settings">
        <NativeTabs.Trigger.Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <NativeTabs.Trigger.Label>الإعدادات</NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  useColorScheme();
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: true,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        headerTitleStyle: { fontFamily: 'Inter_600SemiBold' },
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84, paddingBottom: 28 } : {}),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'مواقيت الصلاة',
          tabBarIcon: ({ color }) =>
            <Ionicons name="time-outline" size={22} color={color} />,
          tabBarLabel: 'الصلاة',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: 'اتجاه القبلة',
          tabBarIcon: ({ color }) => (
            <Ionicons name="navigate-outline" size={21} color={color} />
          ),
          tabBarLabel: 'القبلة',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="adhkar"
        options={{
          title: 'الأذكار',
          tabBarIcon: ({ color }) => (
            <Ionicons name="book-outline" size={21} color={color} />
          ),
          tabBarLabel: 'الأذكار',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'الإعدادات',
          tabBarIcon: ({ color }) => (
            <Ionicons name="settings-outline" size={21} color={color} />
          ),
          tabBarLabel: 'الإعدادات',
          headerShown: false,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
