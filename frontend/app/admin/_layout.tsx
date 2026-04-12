import React from 'react';
import { Stack } from 'expo-router';
import { COLORS } from '../../src/utils/theme';

export default function AdminLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: COLORS.background },
        animation: 'slide_from_right'
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="presence" />
      <Stack.Screen name="users" />
      <Stack.Screen name="products" />
      <Stack.Screen name="orders" />
      <Stack.Screen name="deals" />
      <Stack.Screen name="activity" />
    </Stack>
  );
}
