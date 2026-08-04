import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors, fontSize } from '@/constants/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

function tabIcon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.border,
        },
        tabBarLabelStyle: { fontSize: fontSize.xs },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'ホーム', tabBarIcon: tabIcon('home-outline') }}
      />
      <Tabs.Screen
        name="log"
        options={{ title: '記録', tabBarIcon: tabIcon('add-circle-outline') }}
      />
      <Tabs.Screen
        name="exercises"
        options={{ title: '種目', tabBarIcon: tabIcon('barbell-outline') }}
      />
      <Tabs.Screen
        name="calendar"
        options={{ title: 'カレンダー', tabBarIcon: tabIcon('calendar-outline') }}
      />
      <Tabs.Screen
        name="recovery"
        options={{ title: '回復', tabBarIcon: tabIcon('pulse-outline') }}
      />
    </Tabs>
  );
}
