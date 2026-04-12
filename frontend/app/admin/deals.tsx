import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { getProducts, toggleFlashDeal } from '../../src/utils/api';

export default function DealsScreen() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const handleToggle = async (productId: string, name: string, isDeal: boolean) => {
    try {
      await toggleFlashDeal(productId);
      load();
      Alert.alert('Done', isDeal ? `"${name}" removed from deals` : `"${name}" added to Today's Deals!`);
    } catch (e) {
      Alert.alert('Error', 'Failed to update deal');
    }
  };

  const deals = products.filter(p => p.is_flash_deal);
  const nonDeals = products.filter(p => !p.is_flash_deal);

  if (loading) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}><ActivityIndicator size="large" color={COLORS.royalGold} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Today's Deals</Text>
          <Text style={s.headerSub}>NH QUALITY GOODS LLC</Text>
        </View>
      </View>

      <FlatList
        data={[{ type: 'section', title: `Active Deals (${deals.length})` }, ...deals.map(d => ({ ...d, type: 'deal' })),
               { type: 'section', title: `All Products (${nonDeals.length})` }, ...nonDeals.map(d => ({ ...d, type: 'product' }))]}
        keyExtractor={(item, i) => item.id || `section-${i}`}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.royalGold} />}
        renderItem={({ item }) => {
          if (item.type === 'section') {
            return (
              <View style={s.sectionHeader}>
                {item.title.includes('Active') && <Ionicons name="flash" size={18} color={COLORS.warning} />}
                <Text style={s.sectionTitle}>{item.title}</Text>
              </View>
            );
          }

          const isDeal = item.is_flash_deal;
          return (
            <View style={[s.card, isDeal && s.cardDeal]}>
              <View style={s.cardIcon}>
                <Ionicons name="cube-outline" size={24} color={COLORS.textMuted} />
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{item.name}</Text>
                <Text style={s.cardCategory}>{item.category?.replace('_', ' ')}</Text>
                <View style={s.priceRow}>
                  <Text style={s.cardPrice}>${(item.wholesale_price || item.price)?.toFixed(2)}</Text>
                  {isDeal && item.flash_deal_price && (
                    <Text style={s.dealPrice}>Deal: ${item.flash_deal_price.toFixed(2)}</Text>
                  )}
                </View>
              </View>
              <Pressable
                testID={`toggle-deal-${item.id}`}
                style={[s.toggleBtn, isDeal ? s.removeBtn : s.addBtn]}
                onPress={() => handleToggle(item.id, item.name, isDeal)}
              >
                <Ionicons name={isDeal ? 'close' : 'flash'} size={18} color={isDeal ? COLORS.error : COLORS.warning} />
                <Text style={[s.toggleText, isDeal ? s.removeText : s.addText]}>
                  {isDeal ? 'Remove' : 'Add Deal'}
                </Text>
              </Pressable>
            </View>
          );
        }}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  backBtn: { padding: SPACING.sm, marginRight: SPACING.sm },
  headerText: { flex: 1 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.lg, marginBottom: SPACING.md },
  sectionTitle: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.sm, ...SHADOWS.small },
  cardDeal: { borderWidth: 1, borderColor: COLORS.warning },
  cardIcon: { width: 44, height: 44, backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.sm, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.textPrimary },
  cardCategory: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2, textTransform: 'capitalize' },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginTop: 4 },
  cardPrice: { fontSize: FONTS.sizes.sm, color: COLORS.royalGold, fontWeight: '600' },
  dealPrice: { fontSize: FONTS.sizes.xs, color: COLORS.warning, fontWeight: 'bold' },
  toggleBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  addBtn: { backgroundColor: COLORS.warning + '20' },
  removeBtn: { backgroundColor: COLORS.error + '20' },
  toggleText: { fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  addText: { color: COLORS.warning },
  removeText: { color: COLORS.error }
});
