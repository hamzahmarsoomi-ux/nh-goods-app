import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCartStore } from '../../src/store/cartStore';
import { createOrder } from '../../src/utils/api';

export default function CartScreen() {
  const { t, rtl } = useTranslation();
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();
  
  const [notes, setNotes] = useState('');
  const [isOrdering, setIsOrdering] = useState(false);
  
  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      Alert.alert('Error', 'Your cart is empty');
      return;
    }
    
    setIsOrdering(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }));
      
      await createOrder({
        items: orderItems,
        notes: notes || undefined
      });
      
      clearCart();
      Alert.alert(
        t('success'),
        'Your order has been placed successfully!',
        [{ text: 'OK', onPress: () => router.push('/orders') }]
      );
    } catch (error) {
      console.error('Error placing order:', error);
      Alert.alert(t('error'), 'Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };
  
  const renderCartItem = ({ item }: { item: any }) => (
    <View style={styles.cartItem}>
      <View style={styles.itemImagePlaceholder}>
        <Ionicons name="cube-outline" size={30} color={COLORS.textMuted} />
      </View>
      
      <View style={styles.itemInfo}>
        <Text style={[styles.itemName, rtl && styles.rtlText]} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)} each</Text>
      </View>
      
      <View style={styles.quantityContainer}>
        <Pressable
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
        >
          <Ionicons name="remove" size={18} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={styles.quantityText}>{item.quantity}</Text>
        <Pressable
          style={styles.quantityButton}
          onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
        >
          <Ionicons name="add" size={18} color={COLORS.textPrimary} />
        </Pressable>
      </View>
      
      <View style={styles.itemTotal}>
        <Text style={styles.itemTotalPrice}>
          ${(item.price * item.quantity).toFixed(2)}
        </Text>
        <Pressable
          style={styles.removeButton}
          onPress={() => removeItem(item.product_id)}
        >
          <Ionicons name="trash-outline" size={18} color={COLORS.error} />
        </Pressable>
      </View>
    </View>
  );
  
  const total = getTotal();
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('yourCart')}</Text>
        <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
      </View>
      
      {items.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={COLORS.textMuted} />
          <Text style={styles.emptyText}>{t('cartEmpty')}</Text>
          <Pressable
            style={styles.shopButton}
            onPress={() => router.push('/catalog')}
          >
            <Text style={styles.shopButtonText}>Browse Catalog</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => item.product_id}
            renderItem={renderCartItem}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />
          
          {/* Notes */}
          <View style={styles.notesContainer}>
            <Text style={styles.notesLabel}>{t('orderNotes')}</Text>
            <TextInput
              style={[styles.notesInput, rtl && styles.rtlText]}
              placeholder="Add any special instructions..."
              placeholderTextColor={COLORS.textMuted}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
          </View>
          
          {/* Summary */}
          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{t('subtotal')}</Text>
              <Text style={styles.summaryValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Delivery</Text>
              <Text style={[styles.summaryValue, styles.freeText]}>FREE</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>{t('total')}</Text>
              <Text style={styles.totalValue}>${total.toFixed(2)}</Text>
            </View>
            
            <Pressable
              style={[styles.checkoutButton, isOrdering && styles.checkoutButtonDisabled]}
              onPress={handlePlaceOrder}
              disabled={isOrdering}
            >
              {isOrdering ? (
                <ActivityIndicator color={COLORS.deepNavy} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={COLORS.deepNavy} />
                  <Text style={styles.checkoutButtonText}>{t('placeOrder')}</Text>
                </>
              )}
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
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
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.lg,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xl
  },
  shopButton: {
    backgroundColor: COLORS.royalGold,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.md
  },
  shopButtonText: {
    color: COLORS.deepNavy,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold'
  },
  cartList: {
    paddingHorizontal: SPACING.xl
  },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    ...SHADOWS.small
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center'
  },
  itemInfo: {
    flex: 1,
    marginLeft: SPACING.md
  },
  itemName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs
  },
  itemPrice: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.md
  },
  quantityButton: {
    padding: SPACING.sm
  },
  quantityText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    minWidth: 24,
    textAlign: 'center'
  },
  itemTotal: {
    alignItems: 'flex-end'
  },
  itemTotalPrice: {
    color: COLORS.royalGold,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    marginBottom: SPACING.xs
  },
  removeButton: {
    padding: SPACING.xs
  },
  notesContainer: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.md
  },
  notesLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.sm
  },
  notesInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md,
    minHeight: 80,
    textAlignVertical: 'top'
  },
  summaryContainer: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.medium
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm
  },
  summaryLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md
  },
  freeText: {
    color: COLORS.success,
    fontWeight: 'bold'
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: SPACING.md
  },
  totalLabel: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold'
  },
  totalValue: {
    color: COLORS.royalGold,
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold'
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.royalGold,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
    gap: SPACING.sm
  },
  checkoutButtonDisabled: {
    opacity: 0.7
  },
  checkoutButtonText: {
    color: COLORS.deepNavy,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold'
  },
  rtlText: {
    textAlign: 'right'
  }
});
