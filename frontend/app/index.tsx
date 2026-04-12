import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/store/authStore';
import { COLORS, FONTS, SPACING } from '../src/utils/theme';
import { seedDatabase } from '../src/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import LogoWatermark from '../src/components/LogoWatermark';

export default function SplashScreen() {
  const router = useRouter();
  const { user, token, loadStoredAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    initializeApp();
  }, []);
  
  const initializeApp = async () => {
    try {
      // Seed database with initial data
      await seedDatabase();
    } catch (error) {
      console.log('Seed error (might already be seeded):', error);
    }
    
    await loadStoredAuth();
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (!isLoading) {
      // Navigate based on auth state
      if (token && user) {
        router.replace('/(tabs)');
      }
    }
  }, [isLoading, token, user]);
  
  const handleGetStarted = () => {
    router.push('/(auth)/login');
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <LogoWatermark />
      <View style={styles.content}>
        {/* Logo Area */}
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>NH</Text>
          </View>
          <Text style={styles.appName}>NH GOODS</Text>
          <Text style={styles.companyName}>NH QUALITY GOODS LLC</Text>
          <Text style={styles.tagline}>Vision & Faith</Text>
          <Text style={styles.arabicTagline}>الرؤية والإيمان</Text>
        </View>
        
        {/* Badges */}
        <View style={styles.badgesContainer}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>FREE DELIVERY</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>NO MINIMUM ORDER</Text>
          </View>
        </View>
        
        {isLoading ? (
          <ActivityIndicator size="large" color={COLORS.royalGold} style={styles.loader} />
        ) : (
          <Pressable style={styles.getStartedButton} onPress={handleGetStarted}>
            <Text style={styles.getStartedText}>Get Started</Text>
          </Pressable>
        )}
        
        {/* Footer */}
        <Text style={styles.footer}>Wholesale Distribution</Text>
        <Text style={styles.footerSub}>New Hampshire & Massachusetts</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xxxl
  },
  logoCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.navyBlue,
    borderWidth: 3,
    borderColor: COLORS.royalGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    shadowColor: COLORS.royalGold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10
  },
  logoText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: COLORS.royalGold
  },
  appName: {
    fontSize: FONTS.sizes.header,
    fontWeight: 'bold',
    color: COLORS.royalGold,
    marginBottom: SPACING.xs
  },
  companyName: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm
  },
  tagline: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textPrimary,
    fontWeight: '600'
  },
  arabicTagline: {
    fontSize: FONTS.sizes.xl,
    color: COLORS.royalGold,
    marginTop: SPACING.xs
  },
  badgesContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xxxl
  },
  badge: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.royalGold
  },
  badgeText: {
    color: COLORS.royalGold,
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold'
  },
  loader: {
    marginBottom: SPACING.xxxl
  },
  getStartedButton: {
    backgroundColor: COLORS.royalGold,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xxxl * 2,
    borderRadius: 30,
    marginBottom: SPACING.xxxl
  },
  getStartedText: {
    color: COLORS.deepNavy,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold'
  },
  footer: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted,
    marginTop: 'auto'
  },
  footerSub: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.lg
  }
});
