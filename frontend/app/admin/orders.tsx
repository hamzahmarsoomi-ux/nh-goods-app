import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getOrders, updateOrderStatus } from '../../src/utils/api';

export default function AdminOrdersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
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
  
  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      if (newStatus === 'confirmed') {
        Alert.alert('Confirmed!', 'Order confirmed. Invoice sent to customer.');
      } else if (newStatus === 'cancelled') {
        Alert.alert('Rejected', 'Order cancelled. Customer will be notified.');
      }
      loadOrders();
    } catch (error) {
      Alert.alert('Error', 'Failed to update order status');
    }
  };

  const handleContactCustomer = (order: any) => {
    router.push(`/chat?userId=${order.user_id}&userName=${encodeURIComponent(order.user_name)}`);
  };
  
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
  
  const nextStatus = (current: string) => {
    switch (current) {
      case 'pending': return 'confirmed';
      case 'confirmed': return 'delivering';
      case 'delivering': return 'delivered';
      default: return null;
    }
  };
  
  const renderOrder = ({ item }: { item: any }) => {
    const next = nextStatus(item.status);
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={styles.orderNumber}>Order #{item.id.slice(-8).toUpperCase()}</Text>
            <Text style={styles.customerName}>{item.user_name}</Text>
            {item.shop_name && <Text style={styles.shopName}>{item.shop_name}</Text>}
          </View>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
            <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
              {item.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.orderItems}>
          {item.items.slice(0, 3).map((orderItem: any, index: number) => (
            <Text key={index} style={styles.itemText}>
              {orderItem.quantity}x {orderItem.name}
            </Text>
          ))}
          {item.items.length > 3 && (
            <Text style={styles.moreItems}>+{item.items.length - 3} more items</Text>
          )}
        </View>
        
        <View style={styles.orderFooter}>
          <View>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${item.total.toFixed(2)}</Text>
          </View>
          <Text style={styles.orderDate}>
            {format(new Date(item.created_at), 'MMM d, h:mm a')}
          </Text>
        </View>
        
        {item.status === 'pending' && (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.confirmButton}
              onPress={() => {
                Alert.alert('Confirm Order', `Confirm and send invoice to ${item.user_name}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Confirm & Send Invoice', onPress: () => handleStatusChange(item.id, 'confirmed') }
                ]);
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color={COLORS.white} />
              <Text style={styles.confirmButtonText}>Confirm & Invoice</Text>
            </Pressable>
            <Pressable
              style={styles.chatButton}
              onPress={() => handleContactCustomer(item)}
            >
              <Ionicons name="chatbubble" size={18} color={COLORS.royalGold} />
            </Pressable>
            <Pressable
              style={styles.cancelButton}
              onPress={() => {
                Alert.alert('Reject Order', `Reject order from ${item.user_name}?`, [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Reject', style: 'destructive', onPress: () => handleStatusChange(item.id, 'cancelled') }
                ]);
              }}
            >
              <Ionicons name="close-circle" size={18} color={COLORS.error} />
            </Pressable>
          </View>
        )}
        
        {item.status === 'confirmed' && (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.updateButton}
              onPress={() => handleStatusChange(item.id, 'delivering')}
            >
              <Ionicons name="car" size={18} color={COLORS.deepNavy} />
              <Text style={styles.updateButtonText}>Start Delivery</Text>
            </Pressable>
            <Pressable style={styles.chatButton} onPress={() => handleContactCustomer(item)}>
              <Ionicons name="chatbubble" size={18} color={COLORS.royalGold} />
            </Pressable>
          </View>
        )}
        
        {item.status === 'delivering' && (
          <View style={styles.actionRow}>
            <Pressable
              style={styles.updateButton}
              onPress={() => handleStatusChange(item.id, 'delivered')}
            >
              <Ionicons name="checkmark-done-circle" size={18} color={COLORS.deepNavy} />
              <Text style={styles.updateButtonText}>Mark Delivered</Text>
            </Pressable>
            <Pressable style={styles.chatButton} onPress={() => handleContactCustomer(item)}>
              <Ionicons name="chatbubble" size={18} color={COLORS.royalGold} />
            </Pressable>
          </View>
        )}
        
        {item.status === 'cancelled' && (
          <View style={styles.rejectedRow}>
            <Ionicons name="close-circle" size={16} color={COLORS.error} />
            <Text style={styles.rejectedText}>Order Rejected</Text>
            <Pressable style={styles.chatButtonSmall} onPress={() => handleContactCustomer(item)}>
              <Ionicons name="chatbubble-outline" size={14} color={COLORS.royalGold} />
              <Text style={styles.chatSmallText}>Chat</Text>
            </Pressable>
          </View>
        )}
      </View>
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
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('viewOrders')}</Text>
          <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
        </View>
      </View>
      
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
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
            <Ionicons name="receipt-outline" size={60} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>No orders yet</Text>
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
  listContent: {
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
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  customerName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  shopName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.royalGold,
    marginTop: 2
  },
  statusBadge: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm
  },
  statusText: {
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold'
  },
  orderItems: {
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border
  },
  itemText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: 2
  },
  moreItems: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: SPACING.md
  },
  totalLabel: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted
  },
  totalValue: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.royalGold
  },
  orderDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted
  },
  actionRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  updateButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.royalGold,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs
  },
  updateButtonText: {
    color: COLORS.deepNavy,
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    textTransform: 'capitalize'
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.xs
  },
  confirmButtonText: {
    color: COLORS.white,
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold'
  },
  chatButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.royalGold + '20',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.royalGold
  },
  cancelButton: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.error + '20',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error
  },
  rejectedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  rejectedText: {
    flex: 1,
    color: COLORS.error,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600'
  },
  chatButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.royalGold + '20',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm
  },
  chatSmallText: {
    color: COLORS.royalGold,
    fontSize: FONTS.sizes.xs,
    fontWeight: '600'
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
