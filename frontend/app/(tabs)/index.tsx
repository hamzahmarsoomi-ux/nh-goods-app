import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useAuthStore } from '../../src/store/authStore';
import { useCartStore } from '../../src/store/cartStore';
import { getCategories, getProducts, getFlashDeals, getLastOrder, reorder } from '../../src/utils/api';

export default function HomeScreen() {
  const { t, rtl, language } = useTranslation();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const addItem = useCartStore((state) => state.addItem);
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [flashDeals, setFlashDeals] = useState<any[]>([]);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [reordering, setReordering] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [catRes, prodRes, dealsRes, lastOrderRes] = await Promise.all([
        getCategories(),
        getProducts(),
        getFlashDeals().catch(() => ({ data: [] })),
        getLastOrder().catch(() => ({ data: null }))
      ]);
      setCategories(catRes.data);
      setFeaturedProducts(prodRes.data.slice(0, 4));
      setFlashDeals(dealsRes.data || []);
      setLastOrder(lastOrderRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleReorder = async () => {
    if (!lastOrder) return;
    setReordering(true);
    try {
      await reorder(lastOrder.id);
      Alert.alert(t('success'), 'Order placed successfully!', [
        { text: 'OK', onPress: () => router.push('/orders') }
      ]);
    } catch (error) {
      Alert.alert(t('error'), 'Failed to reorder. Please try again.');
    } finally {
      setReordering(false);
    }
  };

  const handleAddDealToCart = (product: any) => {
    addItem({
      product_id: product.id,
      name: product.name,
      price: product.flash_deal_price || product.wholesale_price || product.price
    });
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'bakery': return 'pizza-outline';
      case 'cakes_sweets': return 'ice-cream-outline';
      case 'premium_snacks': return 'fast-food-outline';
      case 'energy_beverages': return 'cafe-outline';
      default: return 'cube-outline';
    }
  };

  const getCategoryColor = (id: string) => {
    switch (id) {
      case 'bakery': return COLORS.bakery;
      case 'cakes_sweets': return COLORS.cakesSweets;
      case 'premium_snacks': return COLORS.premiumSnacks;
      case 'energy_beverages': return COLORS.energyBeverages;
      default: return COLORS.royalGold;
    }
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
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.royalGold} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>{t('welcome')},</Text>
            <Text style={styles.userName}>{user?.name || 'Guest'}</Text>
            {user?.shop_name && <Text style={styles.shopName}>{user.shop_name}</Text>}
          </View>
          {user?.is_admin && (
            <Pressable testID="admin-btn" style={styles.adminButton} onPress={() => router.push('/admin')}>
              <Ionicons name="settings" size={20} color={COLORS.royalGold} />
              <Text style={styles.adminButtonText}>{t('admin')}</Text>
            </Pressable>
          )}
        </View>

        {/* Badges */}
        <View style={styles.badgesRow}>
          <View style={styles.badge}>
            <Ionicons name="car-outline" size={16} color={COLORS.success} />
            <Text style={styles.badgeText}>{t('freeDelivery')}</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle-outline" size={16} color={COLORS.success} />
            <Text style={styles.badgeText}>{t('noMinimum')}</Text>
          </View>
          <Pressable testID="snap-ask-btn" style={styles.snapBadge} onPress={() => router.push('/snap-ask')}>
            <Ionicons name="camera" size={16} color={COLORS.royalGold} />
            <Text style={styles.snapBadgeText}>Snap & Ask</Text>
          </Pressable>
        </View>

        {/* One-Tap Reorder */}
        {lastOrder && (
          <View style={styles.section}>
            <Pressable
              testID="reorder-btn"
              style={styles.reorderCard}
              onPress={handleReorder}
              disabled={reordering}
            >
              <View style={styles.reorderIconWrap}>
                <Ionicons name="repeat" size={24} color={COLORS.royalGold} />
              </View>
              <View style={styles.reorderInfo}>
                <Text style={styles.reorderTitle}>Reorder Last Order</Text>
                <Text style={styles.reorderSubtitle}>
                  {lastOrder.items?.length} items | ${lastOrder.total?.toFixed(2)}
                </Text>
              </View>
              {reordering ? (
                <ActivityIndicator color={COLORS.royalGold} />
              ) : (
                <View style={styles.reorderAction}>
                  <Ionicons name="arrow-forward-circle" size={32} color={COLORS.royalGold} />
                </View>
              )}
            </Pressable>
          </View>
        )}

        {/* Flash Deals */}
        {flashDeals.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.flashHeader}>
                <Ionicons name="flash" size={20} color={COLORS.warning} />
                <Text style={styles.flashTitle}>Flash Deals</Text>
              </View>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dealsScroll}>
              {flashDeals.map((deal) => (
                <View key={deal.id} style={styles.dealCard}>
                  <View style={styles.dealBadge}>
                    <Ionicons name="flash" size={12} color={COLORS.deepNavy} />
                    <Text style={styles.dealBadgeText}>DEAL</Text>
                  </View>
                  <View style={styles.dealImagePlaceholder}>
                    <Ionicons name="cube-outline" size={36} color={COLORS.textMuted} />
                  </View>
                  <Text style={styles.dealName} numberOfLines={2}>{deal.name}</Text>
                  <View style={styles.dealPriceRow}>
                    <Text style={styles.dealPrice}>${(deal.flash_deal_price || deal.wholesale_price).toFixed(2)}</Text>
                    <Text style={styles.dealOriginal}>${deal.price.toFixed(2)}</Text>
                  </View>
                  <Pressable
                    testID={`deal-add-${deal.id}`}
                    style={styles.dealAddBtn}
                    onPress={() => handleAddDealToCart(deal)}
                  >
                    <Ionicons name="cart-outline" size={16} color={COLORS.deepNavy} />
                    <Text style={styles.dealAddText}>Add</Text>
                  </Pressable>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Categories */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('allCategories')}</Text>
          <View style={styles.categoriesGrid}>
            {categories.map((cat) => (
              <Pressable
                key={cat.id}
                testID={`category-${cat.id}`}
                style={styles.categoryCard}
                onPress={() => router.push(`/catalog?category=${cat.id}`)}
              >
                <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(cat.id) + '20' }]}>
                  <Ionicons name={getCategoryIcon(cat.id) as any} size={28} color={getCategoryColor(cat.id)} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Featured Products */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('products')}</Text>
            <Pressable onPress={() => router.push('/catalog')}>
              <Text style={styles.seeAll}>See All</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productsScroll}>
            {featuredProducts.map((product) => (
              <Pressable key={product.id} style={styles.productCard}>
                <View style={styles.productImagePlaceholder}>
                  <Ionicons name="cube-outline" size={40} color={COLORS.textMuted} />
                </View>
                <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
                <Text style={styles.productPrice}>${(product.wholesale_price || product.price).toFixed(2)}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <Pressable testID="messages-btn" style={styles.actionCard} onPress={() => router.push('/messages')}>
              <Ionicons name="chatbubbles-outline" size={24} color={COLORS.royalGold} />
              <Text style={styles.actionText}>Messages</Text>
            </Pressable>
            <Pressable testID="order-history-btn" style={styles.actionCard} onPress={() => router.push('/orders')}>
              <Ionicons name="receipt-outline" size={24} color={COLORS.royalGold} />
              <Text style={styles.actionText}>{t('orderHistory')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollView: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.md
  },
  welcomeText: { fontSize: FONTS.sizes.md, color: COLORS.textSecondary },
  userName: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary },
  shopName: { fontSize: FONTS.sizes.sm, color: COLORS.royalGold, marginTop: SPACING.xs },
  adminButton: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.cardBackground, paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.royalGold
  },
  adminButtonText: { color: COLORS.royalGold, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  badgesRow: {
    flexDirection: 'row', paddingHorizontal: SPACING.xl,
    gap: SPACING.md, marginBottom: SPACING.lg
  },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.cardBackground, paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.full
  },
  badgeText: { color: COLORS.success, fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  snapBadge: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.xs,
    backgroundColor: COLORS.royalGold + '20', paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.full,
    borderWidth: 1, borderColor: COLORS.royalGold
  },
  snapBadgeText: { color: COLORS.royalGold, fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  section: { paddingHorizontal: SPACING.xl, marginBottom: SPACING.xl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: SPACING.md
  },
  sectionTitle: {
    fontSize: FONTS.sizes.lg, fontWeight: 'bold',
    color: COLORS.textPrimary, marginBottom: SPACING.md
  },
  seeAll: { color: COLORS.royalGold, fontSize: FONTS.sizes.sm },

  // Reorder Card
  reorderCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.cardBackground, padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg, borderWidth: 1,
    borderColor: COLORS.royalGold + '40', ...SHADOWS.small
  },
  reorderIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: COLORS.royalGold + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md
  },
  reorderInfo: { flex: 1 },
  reorderTitle: {
    fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.textPrimary
  },
  reorderSubtitle: {
    fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginTop: 2
  },
  reorderAction: { marginLeft: SPACING.sm },

  // Flash Deals
  flashHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  flashTitle: {
    fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.warning
  },
  dealsScroll: { paddingRight: SPACING.xl },
  dealCard: {
    width: 150, backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md,
    marginRight: SPACING.md, borderWidth: 1,
    borderColor: COLORS.warning + '30', ...SHADOWS.small
  },
  dealBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 2,
    backgroundColor: COLORS.warning, alignSelf: 'flex-start',
    paddingVertical: 2, paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm, marginBottom: SPACING.sm
  },
  dealBadgeText: { fontSize: 9, fontWeight: 'bold', color: COLORS.deepNavy },
  dealImagePlaceholder: {
    width: '100%', height: 70, backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.sm, alignItems: 'center',
    justifyContent: 'center', marginBottom: SPACING.sm
  },
  dealName: {
    color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xs
  },
  dealPriceRow: {
    flexDirection: 'row', alignItems: 'center',
    gap: SPACING.sm, marginBottom: SPACING.sm
  },
  dealPrice: { color: COLORS.warning, fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  dealOriginal: {
    color: COLORS.textMuted, fontSize: FONTS.sizes.xs,
    textDecorationLine: 'line-through'
  },
  dealAddBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: COLORS.royalGold, paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm, gap: SPACING.xs
  },
  dealAddText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.xs, fontWeight: 'bold' },

  // Categories
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  categoryCard: {
    width: '47%', backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg,
    alignItems: 'center', ...SHADOWS.small
  },
  categoryIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.sm
  },
  categoryName: {
    color: COLORS.textPrimary, fontSize: FONTS.sizes.sm,
    fontWeight: '600', textAlign: 'center'
  },

  // Products
  productsScroll: { paddingRight: SPACING.xl },
  productCard: {
    width: 140, backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    marginRight: SPACING.md, ...SHADOWS.small
  },
  productImagePlaceholder: {
    width: '100%', height: 80, backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.sm, alignItems: 'center',
    justifyContent: 'center', marginBottom: SPACING.sm
  },
  productName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.xs },
  productPrice: { color: COLORS.royalGold, fontSize: FONTS.sizes.md, fontWeight: 'bold' },

  // Actions
  actionsGrid: { flexDirection: 'row', gap: SPACING.md },
  actionCard: {
    flex: 1, backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md, padding: SPACING.lg,
    alignItems: 'center', gap: SPACING.sm, ...SHADOWS.small
  },
  actionText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm }
});
