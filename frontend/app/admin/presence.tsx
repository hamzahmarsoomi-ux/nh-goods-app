import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Linking,
  Alert,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format, formatDistanceToNow } from 'date-fns';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getCustomerPresence } from '../../src/utils/api';

interface CustomerPresence {
  user_id: string;
  user_name: string;
  phone_number: string;
  shop_name: string | null;
  shop_address: string | null;
  shop_latitude: number | null;
  shop_longitude: number | null;
  is_at_shop: boolean;
  is_online: boolean;
  last_location_update: string | null;
  last_latitude: number | null;
  last_longitude: number | null;
}

export default function PresenceScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerPresence[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  useEffect(() => {
    loadPresence();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      loadPresence(true);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  const loadPresence = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await getCustomerPresence();
      setCustomers(res.data);
      setLastRefresh(new Date());
    } catch (error) {
      console.error('Error loading presence:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadPresence();
  }, []);
  
  const openNavigation = (customer: CustomerPresence) => {
    if (!customer.shop_latitude || !customer.shop_longitude) {
      Alert.alert('No Location', 'This customer does not have registered shop coordinates.');
      return;
    }
    
    const lat = customer.shop_latitude;
    const lng = customer.shop_longitude;
    const label = encodeURIComponent(customer.shop_name || customer.user_name);
    
    // Open in Google Maps or Apple Maps
    const url = Platform.select({
      ios: `maps://app?daddr=${lat},${lng}&q=${label}`,
      android: `google.navigation:q=${lat},${lng}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    });
    
    Linking.openURL(url).catch(() => {
      // Fallback to web URL
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    });
  };
  
  const callCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };
  
  const getTimeAgo = (dateString: string | null) => {
    if (!dateString) return 'Never';
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };
  
  const atShopCount = customers.filter(c => c.is_at_shop).length;
  const onlineCount = customers.filter(c => c.is_online).length;
  
  const renderCustomer = ({ item }: { item: CustomerPresence }) => (
    <View style={[
      styles.customerCard,
      item.is_at_shop && styles.customerCardAtShop
    ]}>
      <View style={styles.customerHeader}>
        <View style={styles.customerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.customerName}>{item.user_name}</Text>
            {item.is_at_shop && (
              <View style={styles.atShopBadge}>
                <View style={styles.pulseDot} />
                <Text style={styles.atShopText}>{t('atShop')}</Text>
              </View>
            )}
            {!item.is_at_shop && item.is_online && (
              <View style={styles.onlineBadge}>
                <Text style={styles.onlineText}>Online</Text>
              </View>
            )}
            {!item.is_online && (
              <View style={styles.offlineBadge}>
                <Text style={styles.offlineText}>Offline</Text>
              </View>
            )}
          </View>
          {item.shop_name && (
            <View style={styles.shopRow}>
              <Ionicons name="storefront-outline" size={14} color={COLORS.royalGold} />
              <Text style={styles.shopName}>{item.shop_name}</Text>
            </View>
          )}
          {item.shop_address && (
            <Text style={styles.shopAddress} numberOfLines={1}>{item.shop_address}</Text>
          )}
          <Text style={styles.lastSeen}>
            Last update: {getTimeAgo(item.last_location_update)}
          </Text>
        </View>
        
        <View style={[
          styles.statusIndicator,
          item.is_at_shop ? styles.statusAtShop : 
          item.is_online ? styles.statusOnline : styles.statusOffline
        ]}>
          <Ionicons
            name={item.is_at_shop ? 'location' : 'location-outline'}
            size={24}
            color={
              item.is_at_shop ? COLORS.success :
              item.is_online ? COLORS.warning : COLORS.textMuted
            }
          />
        </View>
      </View>
      
      <View style={styles.customerActions}>
        <Pressable
          style={[styles.actionButton, styles.navigateButton]}
          onPress={() => openNavigation(item)}
          disabled={!item.shop_latitude}
        >
          <Ionicons name="navigate" size={18} color={COLORS.white} />
          <Text style={styles.navigateButtonText}>{t('navigate')}</Text>
        </Pressable>
        
        <Pressable
          style={[styles.actionButton, styles.callButton]}
          onPress={() => callCustomer(item.phone_number)}
        >
          <Ionicons name="call" size={18} color={COLORS.success} />
        </Pressable>
      </View>
    </View>
  );
  
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.royalGold} />
          <Text style={styles.loadingText}>Loading presence data...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('customerPresence')}</Text>
          <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
        </View>
        <Pressable style={styles.refreshButton} onPress={onRefresh}>
          <Ionicons name="refresh" size={24} color={COLORS.royalGold} />
        </Pressable>
      </View>
      
      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: COLORS.success }]} />
          <Text style={styles.statValue}>{atShopCount}</Text>
          <Text style={styles.statLabel}>{t('atShop')}</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: COLORS.warning }]} />
          <Text style={styles.statValue}>{onlineCount}</Text>
          <Text style={styles.statLabel}>Online</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <View style={[styles.statDot, { backgroundColor: COLORS.textMuted }]} />
          <Text style={styles.statValue}>{customers.length - onlineCount}</Text>
          <Text style={styles.statLabel}>Offline</Text>
        </View>
      </View>
      
      {/* Last Refresh */}
      <View style={styles.refreshInfo}>
        <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
        <Text style={styles.refreshText}>
          Last updated: {format(lastRefresh, 'h:mm:ss a')}
        </Text>
        <Text style={styles.autoRefreshText}>Auto-refresh: 30s</Text>
      </View>
      
      {/* Customer List */}
      <FlatList
        data={customers}
        keyExtractor={(item) => item.user_id}
        renderItem={renderCustomer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.royalGold}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No customers found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  loadingText: {
    color: COLORS.textMuted,
    marginTop: SPACING.md
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
  refreshButton: {
    padding: SPACING.sm
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.xl,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginBottom: SPACING.xs
  },
  statValue: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  statLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border
  },
  refreshInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md,
    gap: SPACING.xs
  },
  refreshText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted
  },
  autoRefreshText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.success,
    marginLeft: SPACING.sm
  },
  listContent: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl
  },
  customerCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.small
  },
  customerCardAtShop: {
    borderColor: COLORS.success,
    borderWidth: 2
  },
  customerHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.md
  },
  customerInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.xs
  },
  customerName: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  atShopBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '20',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success
  },
  atShopText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
    color: COLORS.success
  },
  onlineBadge: {
    backgroundColor: COLORS.warning + '20',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full
  },
  onlineText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold',
    color: COLORS.warning
  },
  offlineBadge: {
    backgroundColor: COLORS.textMuted + '20',
    paddingVertical: 4,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full
  },
  offlineText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted
  },
  shopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2
  },
  shopName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.royalGold,
    fontWeight: '600'
  },
  shopAddress: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.xs
  },
  lastSeen: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted
  },
  statusIndicator: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statusAtShop: {
    backgroundColor: COLORS.success + '20'
  },
  statusOnline: {
    backgroundColor: COLORS.warning + '20'
  },
  statusOffline: {
    backgroundColor: COLORS.textMuted + '20'
  },
  customerActions: {
    flexDirection: 'row',
    gap: SPACING.sm
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs
  },
  navigateButton: {
    flex: 1,
    backgroundColor: COLORS.royalGold
  },
  navigateButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold'
  },
  callButton: {
    width: 48,
    backgroundColor: COLORS.success + '20',
    borderWidth: 1,
    borderColor: COLORS.success
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.md,
    marginTop: SPACING.md
  }
});
