import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator,
  RefreshControl, Alert, Modal, TextInput, ScrollView, Image, Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../src/utils/theme';
import { useAuthStore } from '../src/store/authStore';
import { getListings, createListing, deleteListing } from '../src/utils/api';

export default function MarketplaceScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [form, setForm] = useState({ product_name: '', description: '', price: '', quantity: '' });
  const [posting, setPosting] = useState(false);
  const [tab, setTab] = useState<'all' | 'mine'>('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { const res = await getListings(); setListings(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, base64: true, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      setImageBase64(result.assets[0].base64 || null);
      setImageUri(result.assets[0].uri);
    }
  };

  const handlePost = async () => {
    if (!form.product_name || !form.price || !form.quantity) { Alert.alert('Error', 'Fill product name, price & quantity'); return; }
    setPosting(true);
    try {
      await createListing({
        product_name: form.product_name, description: form.description,
        price: parseFloat(form.price), quantity: parseInt(form.quantity),
        image_base64: imageBase64 || undefined
      });
      setShowAdd(false); setForm({ product_name: '', description: '', price: '', quantity: '' });
      setImageBase64(null); setImageUri(null);
      Alert.alert('Posted!', 'Your surplus is now visible to nearby stores');
      load();
    } catch (e) { Alert.alert('Error', 'Failed to post'); }
    finally { setPosting(false); }
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Remove this listing?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteListing(id); load(); } }
    ]);
  };

  const handleContact = (phone: string) => Linking.openURL(`tel:${phone}`);

  const filtered = tab === 'mine' ? listings.filter(l => l.seller_id === user?.id) : listings;

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
          <Text style={s.headerTitle}>Neighbor Exchange</Text>
          <Text style={s.headerSub}>Download the app, we promote for you!</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <Pressable style={[s.tab, tab === 'all' && s.tabActive]} onPress={() => setTab('all')}>
          <Ionicons name="storefront" size={16} color={tab === 'all' ? COLORS.deepNavy : COLORS.textMuted} />
          <Text style={[s.tabText, tab === 'all' && s.tabTextActive]}>All Stores</Text>
        </Pressable>
        <Pressable style={[s.tab, tab === 'mine' && s.tabActive]} onPress={() => setTab('mine')}>
          <Ionicons name="person" size={16} color={tab === 'mine' ? COLORS.deepNavy : COLORS.textMuted} />
          <Text style={[s.tabText, tab === 'mine' && s.tabTextActive]}>My Listings</Text>
        </Pressable>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.royalGold} />}
        renderItem={({ item }) => (
          <View style={s.card}>
            {item.image_base64 && (
              <Image source={{ uri: `data:image/jpeg;base64,${item.image_base64}` }} style={s.cardImage} resizeMode="cover" />
            )}
            <View style={s.cardBody}>
              <View style={s.cardTop}>
                <Text style={s.cardProduct}>{item.product_name}</Text>
                <Text style={s.cardPrice}>${item.price.toFixed(2)}</Text>
              </View>
              {item.description && <Text style={s.cardDesc}>{item.description}</Text>}
              <Text style={s.cardQty}>Qty: {item.quantity} available</Text>
              <View style={s.sellerRow}>
                <Ionicons name="storefront-outline" size={14} color={COLORS.royalGold} />
                <Text style={s.sellerName}>{item.seller_name} {item.shop_name ? `• ${item.shop_name}` : ''}</Text>
              </View>
              <Text style={s.cardTime}>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</Text>
              <View style={s.cardActions}>
                {item.seller_id !== user?.id ? (
                  <Pressable style={s.contactBtn} onPress={() => handleContact(item.seller_phone)}>
                    <Ionicons name="call" size={16} color={COLORS.deepNavy} />
                    <Text style={s.contactBtnText}>Contact Seller</Text>
                  </Pressable>
                ) : (
                  <Pressable style={s.deleteListBtn} onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash" size={16} color={COLORS.error} />
                    <Text style={s.deleteBtnText}>Remove</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="swap-horizontal" size={60} color={COLORS.textMuted} />
            <Text style={s.emptyTitle}>{tab === 'mine' ? 'No listings yet' : 'No surplus available'}</Text>
            <Text style={s.emptyText}>Download the app and list your surplus.{'\n'}We help you find buyers and promote your products!</Text>
          </View>
        }
      />

      {/* FAB */}
      <Pressable testID="add-listing-btn" style={s.fab} onPress={() => setShowAdd(true)}>
        <Ionicons name="add" size={28} color={COLORS.deepNavy} />
      </Pressable>

      {/* Add Modal */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Sell Surplus</Text>
              <Pressable onPress={() => setShowAdd(false)}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Pressable style={s.imagePicker} onPress={pickImage}>
                {imageUri ? <Image source={{ uri: imageUri }} style={s.pickerImg} resizeMode="cover" /> : (
                  <View style={s.pickerEmpty}><Ionicons name="camera" size={32} color={COLORS.royalGold} /><Text style={s.pickerText}>Add Photo</Text></View>
                )}
              </Pressable>
              <TextInput style={s.input} placeholder="Product Name *" placeholderTextColor={COLORS.textMuted} value={form.product_name} onChangeText={(t) => setForm({ ...form, product_name: t })} />
              <TextInput style={s.input} placeholder="Description (optional)" placeholderTextColor={COLORS.textMuted} value={form.description} onChangeText={(t) => setForm({ ...form, description: t })} />
              <View style={s.row}>
                <TextInput style={[s.input, s.half]} placeholder="Price $ *" placeholderTextColor={COLORS.textMuted} value={form.price} onChangeText={(t) => setForm({ ...form, price: t })} keyboardType="decimal-pad" />
                <TextInput style={[s.input, s.half]} placeholder="Quantity *" placeholderTextColor={COLORS.textMuted} value={form.quantity} onChangeText={(t) => setForm({ ...form, quantity: t })} keyboardType="number-pad" />
              </View>
              <Pressable style={[s.postBtn, posting && s.postBtnDisabled]} onPress={handlePost} disabled={posting}>
                {posting ? <ActivityIndicator color={COLORS.deepNavy} /> : <Text style={s.postBtnText}>Post Listing</Text>}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.sm },
  backBtn: { padding: SPACING.sm, marginRight: SPACING.sm },
  headerText: { flex: 1 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: SPACING.xl, marginBottom: SPACING.md, backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.md, padding: 4 },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sm, gap: SPACING.xs },
  tabActive: { backgroundColor: COLORS.royalGold },
  tabText: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted, fontWeight: '600' },
  tabTextActive: { color: COLORS.deepNavy },
  list: { paddingHorizontal: SPACING.xl, paddingBottom: 80 },
  card: { backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.md, ...SHADOWS.small },
  cardImage: { width: '100%', height: 160 },
  cardBody: { padding: SPACING.lg },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xs },
  cardProduct: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.textPrimary, flex: 1 },
  cardPrice: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.royalGold },
  cardDesc: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  cardQty: { fontSize: FONTS.sizes.sm, color: COLORS.success, fontWeight: '600', marginBottom: SPACING.sm },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, marginBottom: SPACING.xs },
  sellerName: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted },
  cardTime: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginBottom: SPACING.sm },
  cardActions: { flexDirection: 'row' },
  contactBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.royalGold, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sm, gap: SPACING.xs },
  contactBtnText: { color: COLORS.deepNavy, fontWeight: 'bold', fontSize: FONTS.sizes.sm },
  deleteListBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.error + '20', paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.sm, gap: SPACING.xs },
  deleteBtnText: { color: COLORS.error, fontWeight: '600', fontSize: FONTS.sizes.sm },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: 'bold', marginTop: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: SPACING.sm, textAlign: 'center' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 56, height: 56, borderRadius: 28, backgroundColor: COLORS.royalGold, alignItems: 'center', justifyContent: 'center', ...SHADOWS.medium },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.textPrimary },
  imagePicker: { marginBottom: SPACING.lg, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  pickerImg: { width: '100%', height: 160 },
  pickerEmpty: { width: '100%', height: 120, backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.royalGold + '30', borderStyle: 'dashed' },
  pickerText: { color: COLORS.textMuted, marginTop: SPACING.xs },
  input: { backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, fontSize: FONTS.sizes.md, color: COLORS.textPrimary, marginBottom: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.md },
  half: { flex: 1 },
  postBtn: { backgroundColor: COLORS.royalGold, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginBottom: SPACING.xl },
  postBtnDisabled: { opacity: 0.7 },
  postBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.md, fontWeight: 'bold' }
});
