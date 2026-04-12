import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useAuthStore } from '../../src/store/authStore';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  
  const adminMenuItems = [
    {
      id: 'presence',
      title: t('customerPresence'),
      subtitle: 'Real-time shop presence tracking',
      icon: 'location',
      color: COLORS.success,
      route: '/admin/presence',
      priority: true
    },
    {
      id: 'users',
      title: t('manageUsers'),
      subtitle: 'Add, edit, or remove customers',
      icon: 'people',
      color: COLORS.info,
      route: '/admin/users'
    },
    {
      id: 'orders',
      title: t('viewOrders'),
      subtitle: 'Manage and update order status',
      icon: 'receipt',
      color: COLORS.warning,
      route: '/admin/orders'
    },
    {
      id: 'deals',
      title: "Today's Deals",
      subtitle: 'Add or remove flash deals',
      icon: 'flash',
      color: COLORS.warning,
      route: '/admin/deals'
    },
    {
      id: 'products',
      title: t('manageProducts'),
      subtitle: 'Add or update inventory',
      icon: 'cube',
      color: COLORS.premiumSnacks,
      route: '/admin/products'
    },
    {
      id: 'activity',
      title: t('activityLog'),
      subtitle: 'Monitor customer activity',
      icon: 'analytics',
      color: COLORS.energyBeverages,
      route: '/admin/activity'
    }
  ];
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </Pressable>
          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>{t('adminPanel')}</Text>
            <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
          </View>
        </View>
        
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.welcomeIcon}>
            <Ionicons name="shield-checkmark" size={32} color={COLORS.royalGold} />
          </View>
          <View style={styles.welcomeText}>
            <Text style={styles.welcomeTitle}>{t('welcome')}, {user?.name}</Text>
            <Text style={styles.welcomeSubtitle}>Vision & Faith | الرؤية والإيمان</Text>
          </View>
        </View>
        
        {/* Priority Action - Presence Detection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority Action</Text>
          <Pressable
            style={styles.priorityCard}
            onPress={() => router.push('/admin/presence')}
          >
            <View style={styles.priorityIconContainer}>
              <View style={[styles.pulseOuter]} />
              <View style={styles.priorityIcon}>
                <Ionicons name="location" size={28} color={COLORS.white} />
              </View>
            </View>
            <View style={styles.priorityContent}>
              <Text style={styles.priorityTitle}>{t('customerPresence')}</Text>
              <Text style={styles.prioritySubtitle}>
                See who's at their shop right now
              </Text>
              <View style={styles.priorityBadge}>
                <View style={styles.liveDot} />
                <Text style={styles.priorityBadgeText}>LIVE TRACKING</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color={COLORS.royalGold} />
          </Pressable>
        </View>
        
        {/* Admin Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Management</Text>
          <View style={styles.menuGrid}>
            {adminMenuItems.filter(item => !item.priority).map((item) => (
              <Pressable
                key={item.id}
                style={styles.menuCard}
                onPress={() => router.push(item.route as any)}
              >
                <View style={[styles.menuIcon, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon as any} size={24} color={item.color} />
                </View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuSubtitle} numberOfLines={2}>{item.subtitle}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        
        {/* Quick Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Info</Text>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Ionicons name="storefront-outline" size={24} color={COLORS.royalGold} />
              <Text style={styles.statValue}>30+</Text>
              <Text style={styles.statLabel}>Gas Stations</Text>
            </View>
            <View style={styles.statCard}>
              <Ionicons name="navigate-outline" size={24} color={COLORS.royalGold} />
              <Text style={styles.statValue}>NH & MA</Text>
              <Text style={styles.statLabel}>Coverage</Text>
            </View>
          </View>
        </View>
        
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm
  },
  headerText: {
    flex: 1
  },
  headerTitle: {
    fontSize: FONTS.sizes.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  headerSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.royalGold,
    marginTop: 2
  },
  welcomeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.royalGold + '30',
    ...SHADOWS.medium
  },
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.royalGold + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.lg
  },
  welcomeText: {
    flex: 1
  },
  welcomeTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  welcomeSubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  priorityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.success,
    ...SHADOWS.large
  },
  priorityIconContainer: {
    position: 'relative',
    marginRight: SPACING.lg
  },
  pulseOuter: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.success + '20'
  },
  priorityIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center'
  },
  priorityContent: {
    flex: 1
  },
  priorityTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  prioritySubtitle: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success
  },
  priorityBadgeText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.success,
    fontWeight: 'bold'
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md
  },
  menuCard: {
    width: '47%',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.small
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm
  },
  menuTitle: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4
  },
  menuSubtitle: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted
  },
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...SHADOWS.small
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginTop: SPACING.sm
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2
  }
});
