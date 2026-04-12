import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../src/utils/theme';
import { useAuthStore } from '../src/store/authStore';
import { getConversations, getUsers } from '../src/utils/api';

export default function MessagesScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [conversations, setConversations] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await getConversations();
      setConversations(res.data);
      if (user?.is_admin) {
        const usersRes = await getUsers();
        setCustomers(usersRes.data.filter((u: any) => !u.is_admin));
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const openChat = (partnerId: string, partnerName: string) => {
    router.push(`/chat?userId=${partnerId}&userName=${encodeURIComponent(partnerName)}`);
  };

  // For admin: show all customers even without conversations
  const allPartners = user?.is_admin ? (() => {
    const convMap = new Map(conversations.map(c => [c.partner_id, c]));
    const list: any[] = [];
    customers.forEach(c => {
      const conv = convMap.get(c.id);
      list.push({
        partner_id: c.id,
        partner_name: c.name,
        partner_shop: c.shop_name,
        last_message: conv?.last_message || null,
        last_time: conv?.last_time || null,
        unread: conv?.unread || 0
      });
    });
    return list;
  })() : conversations;

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
          <Text style={s.headerTitle}>Messages</Text>
          <Text style={s.headerSub}>NH QUALITY GOODS LLC</Text>
        </View>
      </View>

      <FlatList
        data={allPartners}
        keyExtractor={(item) => item.partner_id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.royalGold} />}
        renderItem={({ item }) => (
          <Pressable testID={`chat-${item.partner_id}`} style={s.convCard} onPress={() => openChat(item.partner_id, item.partner_name)}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{item.partner_name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={s.convInfo}>
              <Text style={s.convName}>{item.partner_name}</Text>
              {item.partner_shop && <Text style={s.convShop}>{item.partner_shop}</Text>}
              {item.last_message && <Text style={s.convLast} numberOfLines={1}>{item.last_message}</Text>}
              {!item.last_message && <Text style={s.convEmpty}>No messages yet</Text>}
            </View>
            <View style={s.convRight}>
              {item.last_time && (
                <Text style={s.convTime}>{formatDistanceToNow(new Date(item.last_time), { addSuffix: true })}</Text>
              )}
              {item.unread > 0 && (
                <View style={s.unreadBadge}><Text style={s.unreadText}>{item.unread}</Text></View>
              )}
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={s.center}>
            <Ionicons name="chatbubbles-outline" size={60} color={COLORS.textMuted} />
            <Text style={s.emptyText}>No conversations yet</Text>
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
  list: { paddingHorizontal: SPACING.xl },
  convCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.sm, ...SHADOWS.small },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.royalGold, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  avatarText: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.deepNavy },
  convInfo: { flex: 1 },
  convName: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.textPrimary },
  convShop: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  convLast: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 4 },
  convEmpty: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, marginTop: 4, fontStyle: 'italic' },
  convRight: { alignItems: 'flex-end', gap: SPACING.xs },
  convTime: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  unreadBadge: { backgroundColor: COLORS.royalGold, borderRadius: 10, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  unreadText: { fontSize: 11, fontWeight: 'bold', color: COLORS.deepNavy },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, marginTop: SPACING.md }
});
