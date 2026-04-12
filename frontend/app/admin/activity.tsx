import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import api from '../../src/utils/api';

export default function AnalyticsScreen() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await api.get('/admin/analytics-summary'); setData(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

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
          <Text style={s.headerTitle}>Customer Analytics</Text>
          <Text style={s.headerSub}>NH QUALITY GOODS LLC</Text>
        </View>
      </View>

      <FlatList
        data={data}
        keyExtractor={(item) => item.user_id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.royalGold} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            {/* Customer Header */}
            <View style={s.cardHeader}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
              </View>
              <View style={s.cardInfo}>
                <Text style={s.cardName}>{item.name}</Text>
                {item.shop_name && <Text style={s.cardShop}>{item.shop_name}</Text>}
                <Text style={s.cardPhone}>{item.phone}</Text>
              </View>
            </View>

            {/* Stats Grid */}
            <View style={s.statsGrid}>
              <View style={s.stat}>
                <Ionicons name="log-in-outline" size={18} color={COLORS.info} />
                <Text style={s.statValue}>{item.today_logins}</Text>
                <Text style={s.statLabel}>Today</Text>
              </View>
              <View style={s.stat}>
                <Ionicons name="calendar-outline" size={18} color={COLORS.royalGold} />
                <Text style={s.statValue}>{item.total_logins}</Text>
                <Text style={s.statLabel}>Total Logins</Text>
              </View>
              <View style={s.stat}>
                <Ionicons name="cart-outline" size={18} color={COLORS.success} />
                <Text style={s.statValue}>{item.cart_adds}</Text>
                <Text style={s.statLabel}>Added</Text>
              </View>
              <View style={s.stat}>
                <Ionicons name="trash-outline" size={18} color={COLORS.error} />
                <Text style={s.statValue}>{item.cart_removes}</Text>
                <Text style={s.statLabel}>Removed</Text>
              </View>
              <View style={s.stat}>
                <Ionicons name="receipt-outline" size={18} color={COLORS.warning} />
                <Text style={s.statValue}>{item.total_orders}</Text>
                <Text style={s.statLabel}>Orders</Text>
              </View>
            </View>

            {/* Cart Behavior Indicator */}
            {item.cart_removes > 0 && (
              <View style={s.alertRow}>
                <Ionicons name="alert-circle" size={16} color={COLORS.warning} />
                <Text style={s.alertText}>
                  Removed {item.cart_removes} item{item.cart_removes > 1 ? 's' : ''} from cart
                </Text>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={
          <View style={s.center}>
            <Ionicons name="analytics-outline" size={60} color={COLORS.textMuted} />
            <Text style={s.emptyText}>No customer data yet</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 100 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  backBtn: { padding: SPACING.sm, marginRight: SPACING.sm },
  headerText: { flex: 1 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xl },
  card: { backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.md, ...SHADOWS.small },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.royalGold, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  avatarText: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.deepNavy },
  cardInfo: { flex: 1 },
  cardName: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.textPrimary },
  cardShop: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  cardPhone: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  stat: { alignItems: 'center', backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.md, paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, minWidth: 60 },
  statValue: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.textPrimary, marginTop: 2 },
  statLabel: { fontSize: 9, color: COLORS.textMuted, marginTop: 2 },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginTop: SPACING.md, backgroundColor: COLORS.warning + '15', padding: SPACING.sm, borderRadius: BORDER_RADIUS.sm },
  alertText: { fontSize: FONTS.sizes.xs, color: COLORS.warning },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, marginTop: SPACING.md }
});
