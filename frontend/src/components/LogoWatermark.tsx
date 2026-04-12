import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';

export default function LogoWatermark() {
  return (
    <View style={s.container} pointerEvents="none">
      <View style={s.logoCircle}>
        <Text style={s.logoText}>NH</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1
  },
  logoCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: COLORS.royalGold + '08',
    alignItems: 'center',
    justifyContent: 'center'
  },
  logoText: {
    fontSize: 80,
    fontWeight: 'bold',
    color: COLORS.royalGold + '06'
  }
});
