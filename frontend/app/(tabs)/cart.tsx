import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCartStore } from '../../src/store/cartStore';
import { createOrder } from '../../src/utils/api';

const PAYMENT_METHODS = [
  { id: 'bank_check', label: 'Bank Check', labelAr: 'شيك بنكي', icon: 'document-text-outline', desc: 'Mail check to NH QUALITY GOODS LLC' },
  { id: 'check_photo', label: 'Send Check Photo', labelAr: 'إرسال صورة الشيك', icon: 'camera-outline', desc: 'Take a clear photo of both sides' }
];

export default function CartScreen() {
  const { t, rtl } = useTranslation();
  const router = useRouter();
  const { items, updateQuantity, removeItem, getTotal, clearCart } = useCartStore();

  const [notes, setNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [isOrdering, setIsOrdering] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  const [lastOrderId, setLastOrderId] = useState('');

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;

    setIsOrdering(true);
    try {
      const orderItems = items.map(item => ({
        product_id: item.product_id, name: item.name,
        price: item.price, quantity: item.quantity
      }));

      const res = await createOrder({
        items: orderItems,
        notes: notes || undefined,
        payment_method: paymentMethod
      });

      setLastOrderTotal(getTotal());
      setLastOrderId(res.data?.id?.slice(-8)?.toUpperCase() || '');
      clearCart();
      setShowSuccess(true);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to place order. Please try again.');
    } finally {
      setIsOrdering(false);
    }
  };

  const total = getTotal();

  const renderCartItem = ({ item }: { item: any }) => (
    <View style={s.cartItem}>
      <View style={s.itemIcon}>
        <Ionicons name="cube-outline" size={24} color={COLORS.textMuted} />
      </View>
      <View style={s.itemInfo}>
        <Text style={[s.itemName, rtl && s.rtl]} numberOfLines={2}>{item.name}</Text>
        <Text style={s.itemPrice}>${item.price.toFixed(2)} each</Text>
      </View>
      <View style={s.qtyContainer}>
        <Pressable testID={`qty-minus-${item.product_id}`} style={s.qtyBtn} onPress={() => updateQuantity(item.product_id, item.quantity - 1)}>
          <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
        </Pressable>
        <Text style={s.qtyText}>{item.quantity}</Text>
        <Pressable testID={`qty-plus-${item.product_id}`} style={s.qtyBtn} onPress={() => updateQuantity(item.product_id, item.quantity + 1)}>
          <Ionicons name="add" size={16} color={COLORS.textPrimary} />
        </Pressable>
      </View>
      <View style={s.itemTotalCol}>
        <Text style={s.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
        <Pressable testID={`remove-${item.product_id}`} style={s.removeBtn} onPress={() => removeItem(item.product_id)}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
        </Pressable>
      </View>
    </View>
  );

  // Success Confirmation Screen
  if (showSuccess) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.successScreen}>
          <View style={s.successIcon}>
            <Ionicons name="checkmark-circle" size={80} color={COLORS.success} />
          </View>
          <Text style={s.successTitle}>Thank you for your order!</Text>
          <Text style={s.successSubtitle}>
            Your invoice has been generated and saved to your Invoice Vault.
          </Text>
          <View style={s.successCard}>
            <Text style={s.successLabel}>Order #{lastOrderId}</Text>
            <Text style={s.successTotal}>${lastOrderTotal.toFixed(2)}</Text>
            <Text style={s.successPayment}>
              Payment: {paymentMethod === 'bank_check' ? 'Bank Check (شيك بنكي)' : 'Check Photo (صورة الشيك)'}
            </Text>
          </View>
          {paymentMethod === 'check_photo' && (
            <View style={s.checkInstructions}>
              <Ionicons name="camera" size={20} color={COLORS.royalGold} />
              <Text style={s.checkInstructionsTitle}>Send check photo via Messages</Text>
              <Text style={s.checkInstructionsText}>
                Make check payable to:{'\n'}
                <Text style={s.checkCompanyName}>NH QUALITY GOODS LLC</Text>{'\n'}
                Hamzah Marsoomi{'\n'}
                Hooksett, NH{'\n\n'}
                Take a clear photo of BOTH sides and send via Messages.
              </Text>
            </View>
          )}
          <Text style={s.successMessage}>
            We will process your delivery from our Hooksett warehouse shortly.
          </Text>
          <View style={s.successCompany}>
            <Text style={s.successCompanyName}>NH QUALITY GOODS LLC</Text>
            <Text style={s.successCompanyTag}>Vision & Faith | الرؤية والإيمان</Text>
          </View>
          <Pressable testID="success-home-btn" style={s.successBtn} onPress={() => { setShowSuccess(false); router.push('/orders'); }}>
            <Text style={s.successBtnText}>View Orders</Text>
          </Pressable>
          <Pressable style={s.successBtnSec} onPress={() => { setShowSuccess(false); router.push('/catalog'); }}>
            <Text style={s.successBtnSecText}>Continue Shopping</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.headerTitle}>{t('yourCart')}</Text>
        <Text style={s.headerSub}>NH QUALITY GOODS LLC</Text>
      </View>

      {items.length === 0 ? (
        <View style={s.emptyContainer}>
          <Ionicons name="cart-outline" size={80} color={COLORS.textMuted} />
          <Text style={s.emptyText}>{t('cartEmpty')}</Text>
          <Pressable testID="browse-btn" style={s.browseBtn} onPress={() => router.push('/catalog')}>
            <Text style={s.browseBtnText}>Browse Catalog</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Cart Items */}
          {items.map((item) => (
            <View key={item.product_id} style={{ paddingHorizontal: SPACING.xl }}>
              {renderCartItem({ item })}
            </View>
          ))}

          {/* Notes */}
          <View style={s.sectionPad}>
            <Text style={s.sectionLabel}>{t('orderNotes')}</Text>
            <TextInput
              style={[s.notesInput, rtl && s.rtl]}
              placeholder="Add any special instructions..."
              placeholderTextColor={COLORS.textMuted}
              value={notes} onChangeText={setNotes}
              multiline numberOfLines={2}
            />
          </View>

          {/* Payment Method */}
          <View style={s.sectionPad}>
            <Text style={s.sectionLabel}>Payment Method</Text>
            {PAYMENT_METHODS.map((pm) => (
              <Pressable
                key={pm.id}
                testID={`payment-${pm.id}`}
                style={[s.paymentOption, paymentMethod === pm.id && s.paymentOptionActive]}
                onPress={() => setPaymentMethod(pm.id)}
              >
                <View style={[s.paymentRadio, paymentMethod === pm.id && s.paymentRadioActive]}>
                  {paymentMethod === pm.id && <View style={s.paymentRadioDot} />}
                </View>
                <Ionicons name={pm.icon as any} size={22} color={paymentMethod === pm.id ? COLORS.royalGold : COLORS.textMuted} />
                <View style={s.paymentTextCol}>
                  <Text style={[s.paymentLabel, paymentMethod === pm.id && s.paymentLabelActive]}>{pm.label}</Text>
                  <Text style={s.paymentLabelAr}>{pm.labelAr}</Text>
                  <Text style={s.paymentDesc}>{pm.desc}</Text>
                </View>
              </Pressable>
            ))}
          </View>

          {/* Summary */}
          <View style={s.summary}>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>{t('subtotal')}</Text>
              <Text style={s.summaryValue}>${total.toFixed(2)}</Text>
            </View>
            <View style={s.summaryRow}>
              <Text style={s.summaryLabel}>Delivery</Text>
              <Text style={[s.summaryValue, s.freeText]}>FREE</Text>
            </View>
            <View style={s.divider} />
            <View style={s.summaryRow}>
              <Text style={s.totalLabel}>Grand Total</Text>
              <Text style={s.totalValue}>${total.toFixed(2)}</Text>
            </View>

            <Pressable
              testID="place-order-btn"
              style={[s.checkoutBtn, isOrdering && s.checkoutBtnDisabled]}
              onPress={handlePlaceOrder} disabled={isOrdering}
            >
              {isOrdering ? <ActivityIndicator color={COLORS.deepNavy} /> : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.deepNavy} />
                  <Text style={s.checkoutBtnText}>{t('placeOrder')} | أدفع</Text>
                </>
              )}
            </Pressable>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.lg, marginTop: SPACING.lg, marginBottom: SPACING.xl },
  browseBtn: { backgroundColor: COLORS.royalGold, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl, borderRadius: BORDER_RADIUS.md },
  browseBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  cartItem: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm, ...SHADOWS.small
  },
  itemIcon: { width: 44, height: 44, backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.sm, alignItems: 'center', justifyContent: 'center' },
  itemInfo: { flex: 1, marginLeft: SPACING.sm },
  itemName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  itemPrice: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  qtyContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.sm, marginHorizontal: SPACING.sm },
  qtyBtn: { padding: SPACING.sm },
  qtyText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, fontWeight: 'bold', minWidth: 20, textAlign: 'center' },
  itemTotalCol: { alignItems: 'flex-end' },
  itemTotal: { color: COLORS.royalGold, fontSize: FONTS.sizes.sm, fontWeight: 'bold' },
  removeBtn: { padding: SPACING.xs, marginTop: 4 },
  sectionPad: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.md },
  sectionLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600', marginBottom: SPACING.sm },
  notesInput: {
    backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    color: COLORS.textPrimary, fontSize: FONTS.sizes.md, minHeight: 60, textAlignVertical: 'top'
  },
  paymentOption: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border, gap: SPACING.md
  },
  paymentOptionActive: { borderColor: COLORS.royalGold, backgroundColor: COLORS.royalGold + '10' },
  paymentRadio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: COLORS.textMuted, alignItems: 'center', justifyContent: 'center' },
  paymentRadioActive: { borderColor: COLORS.royalGold },
  paymentRadioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.royalGold },
  paymentTextCol: { flex: 1 },
  paymentLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  paymentLabelActive: { fontWeight: 'bold', color: COLORS.royalGold },
  paymentLabelAr: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  paymentDesc: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginTop: 2 },
  summary: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.xl, ...SHADOWS.medium },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  summaryLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  summaryValue: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  freeText: { color: COLORS.success, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.md },
  totalLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: 'bold' },
  totalValue: { color: COLORS.royalGold, fontSize: FONTS.sizes.xxl, fontWeight: 'bold' },
  checkoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.royalGold, paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md, marginTop: SPACING.lg, gap: SPACING.sm
  },
  checkoutBtnDisabled: { opacity: 0.7 },
  checkoutBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.lg, fontWeight: 'bold' },
  rtl: { textAlign: 'right' },

  // Success Screen
  successScreen: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  successIcon: { marginBottom: SPACING.lg },
  successTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary, textAlign: 'center', marginBottom: SPACING.sm },
  successSubtitle: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xl },
  successCard: {
    backgroundColor: COLORS.cardBackground, padding: SPACING.xl, borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center', width: '100%', marginBottom: SPACING.xl,
    borderWidth: 1, borderColor: COLORS.royalGold + '40'
  },
  successLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xs },
  successTotal: { color: COLORS.royalGold, fontSize: 36, fontWeight: 'bold', marginBottom: SPACING.sm },
  successPayment: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  successMessage: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, textAlign: 'center', marginBottom: SPACING.xl },
  successCompany: { alignItems: 'center', marginBottom: SPACING.xxl },
  successCompanyName: { color: COLORS.royalGold, fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  successCompanyTag: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 4 },
  successBtn: { backgroundColor: COLORS.royalGold, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxxl * 2, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md },
  successBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  successBtnSec: { paddingVertical: SPACING.md },
  successBtnSecText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  checkInstructions: { alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: SPACING.xl, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.xl, width: '100%', borderWidth: 1, borderColor: COLORS.royalGold + '30' },
  checkInstructionsTitle: { color: COLORS.royalGold, fontSize: FONTS.sizes.md, fontWeight: 'bold', marginTop: SPACING.sm, marginBottom: SPACING.sm },
  checkInstructionsText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, textAlign: 'center', lineHeight: 22 },
  checkCompanyName: { color: COLORS.royalGold, fontWeight: 'bold', fontSize: FONTS.sizes.md }
});
