import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getOrders } from '../../src/utils/api';

export default function OrdersScreen() {
  const { t, rtl } = useTranslation();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  
  useEffect(() => {
    loadOrders();
  }, []);
  
  const loadOrders = async () => {
    try {
      const res = await getOrders();
      setOrders(res.data);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadOrders();
  }, []);
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return COLORS.warning;
      case 'confirmed': return COLORS.info;
      case 'delivering': return COLORS.info;
      case 'delivered': return COLORS.success;
      case 'cancelled': return COLORS.error;
      default: return COLORS.textMuted;
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return 'time-outline';
      case 'confirmed': return 'checkmark-circle-outline';
      case 'delivering': return 'car-outline';
      case 'delivered': return 'checkmark-done-circle-outline';
      case 'cancelled': return 'close-circle-outline';
      default: return 'help-circle-outline';
    }
  };
  
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy h:mm a');
    } catch {
      return dateString;
    }
  };
  
  const renderOrder = ({ item }: { item: any }) => {
    const isExpanded = expandedOrder === item.id;
    
    return (
      <Pressable
        style={styles.orderCard}
        onPress={() => setExpandedOrder(isExpanded ? null : item.id)}
      >
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>
              {t('orderNumber')}{item.id.slice(-8).toUpperCase()}
            </Text>
            <Text style={styles.orderDate}>{formatDate(item.created_at)}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Ionicons
              name={getStatusIcon(item.status) as any}
              size={14}
              color={getStatusColor(item.status)}
            />
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {t(item.status)}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderSummary}>
          <Text style={styles.itemCount}>
            {item.items.length} item{item.items.length !== 1 ? 's' : ''}
          </Text>
          <Text style={styles.orderTotal}>${item.total.toFixed(2)}</Text>
        </View>
        
        {isExpanded && (
          <View style={styles.orderDetails}>
            <View style={styles.divider} />
            {item.items.map((orderItem: any, index: number) => (
              <View key={index} style={styles.orderItem}>
                <Text style={styles.orderItemName}>{orderItem.name}</Text>
                <View style={styles.orderItemRight}>
                  <Text style={styles.orderItemQty}>x{orderItem.quantity}</Text>
                  <Text style={styles.orderItemPrice}>
                    ${(orderItem.price * orderItem.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))}
            {item.notes && (
              <View style={styles.notesSection}>
                <Text style={styles.notesLabel}>Notes:</Text>
                <Text style={styles.notesText}>{item.notes}</Text>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.expandIndicator}>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color={COLORS.textMuted}
          />
        </View>
      </Pressable>
    );
  };
  
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.royalGold} />
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('yourOrders')}</Text>
        <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
      </View>
      
      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="receipt-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>{t('noOrders')}</Text>
        </View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrder}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.royalGold}
            />
          }
        />
      )}
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
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.lg,
    marginTop: SPACING.lg
  },
  ordersList: {
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl
  },
  orderCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md
  },
  orderNumber: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold'
  },
  orderDate: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginTop: 2
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    gap: SPACING.xs
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  itemCount: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm
  },
  orderTotal: {
    color: COLORS.royalGold,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold'
  },
  orderDetails: {
    marginTop: SPACING.md
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginBottom: SPACING.md
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  orderItemName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    flex: 1
  },
  orderItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md
  },
  orderItemQty: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm
  },
  orderItemPrice: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    minWidth: 60,
    textAlign: 'right'
  },
  notesSection: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.sm
  },
  notesLabel: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.xs
  },
  notesText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm
  },
  expandIndicator: {
    alignItems: 'center',
    marginTop: SPACING.sm
  }
});
