import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, ActivityIndicator,
  RefreshControl, Alert, TextInput, Modal, ScrollView, Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getProducts, createProduct, deleteProduct, updateProduct } from '../../src/utils/api';

const CATEGORIES = [
  { id: 'cakes_pastry', name: 'Cakes, Donuts & Pastry' },
  { id: 'nuts_seeds', name: 'Nuts, Seeds & Trail Mix' },
  { id: 'energy_drinks', name: 'Energy Drinks' }
];

const getCategoryColor = (cat: string) => {
  switch (cat) {
    case 'cakes_pastry': return COLORS.cakesSweets;
    case 'nuts_seeds': return COLORS.premiumSnacks;
    case 'energy_drinks': return COLORS.energyBeverages;
    default: return COLORS.royalGold;
  }
};

export default function AdminProductsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '', description: '', category: 'cakes_pastry',
    price: '', wholesale_price: '', stock: '', unit: 'case'
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => { loadProducts(); }, []);

  const loadProducts = async () => {
    try { const res = await getProducts(); setProducts(res.data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadProducts(); }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.6, base64: true, allowsEditing: true
    });
    if (!result.canceled && result.assets[0]) {
      setImageBase64(result.assets[0].base64 || null);
      setImagePreview(result.assets[0].uri);
    }
  };

  const openAddModal = () => {
    setEditingProduct(null);
    setNewProduct({ name: '', description: '', category: 'cakes_pastry', price: '', wholesale_price: '', stock: '', unit: 'case' });
    setImageBase64(null); setImagePreview(null);
    setShowAddModal(true);
  };

  const openEditImage = (product: any) => {
    setEditingProduct(product);
    setImagePreview(product.image_url || null);
    setImageBase64(null);
    setShowAddModal(true);
    setNewProduct({
      name: product.name, description: product.description || '',
      category: product.category, price: String(product.price),
      wholesale_price: String(product.wholesale_price || product.price),
      stock: String(product.stock), unit: product.unit || 'case'
    });
  };

  const handleSave = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Error', 'Name and Price are required'); return;
    }
    setIsCreating(true);
    try {
      const data: any = {
        ...newProduct,
        price: parseFloat(newProduct.price),
        wholesale_price: newProduct.wholesale_price ? parseFloat(newProduct.wholesale_price) : parseFloat(newProduct.price),
        stock: newProduct.stock ? parseInt(newProduct.stock) : 0
      };
      if (imageBase64) data.image_base64 = imageBase64;

      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        Alert.alert('Success', 'Product updated');
      } else {
        await createProduct(data);
        Alert.alert('Success', 'Product created');
      }
      setShowAddModal(false); loadProducts();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed');
    } finally { setIsCreating(false); }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Delete', `Delete "${name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await deleteProduct(id); loadProducts(); }
        catch (e) { Alert.alert('Error', 'Failed'); }
      }}
    ]);
  };

  const renderProduct = ({ item }: { item: any }) => (
    <View style={s.card}>
      <Pressable style={s.imageArea} onPress={() => openEditImage(item)}>
        {item.image_url || item.image_base64 ? (
          <Image
            source={{ uri: item.image_url || `data:image/jpeg;base64,${item.image_base64}` }}
            style={s.productImage} resizeMode="cover"
          />
        ) : (
          <View style={s.imagePlaceholder}>
            <Ionicons name="camera-outline" size={28} color={COLORS.textMuted} />
            <Text style={s.addPhotoText}>Add Photo</Text>
          </View>
        )}
        <View style={s.editImageBadge}>
          <Ionicons name="camera" size={12} color={COLORS.white} />
        </View>
      </Pressable>

      <View style={[s.catBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
        <Text style={[s.catText, { color: getCategoryColor(item.category) }]}>
          {item.category.replace(/_/g, ' ')}
        </Text>
      </View>

      <Text style={s.prodName} numberOfLines={2}>{item.name}</Text>
      {item.description && <Text style={s.prodDesc} numberOfLines={1}>{item.description}</Text>}

      <View style={s.prodFooter}>
        <Text style={s.prodPrice}>${(item.wholesale_price || item.price).toFixed(2)}</Text>
        <Text style={[s.prodStock, item.stock === 0 && s.outOfStock]}>Stock: {item.stock}</Text>
      </View>

      <View style={s.prodActions}>
        <Pressable style={s.editBtn} onPress={() => openEditImage(item)}>
          <Ionicons name="create-outline" size={16} color={COLORS.royalGold} />
          <Text style={s.editBtnText}>Edit</Text>
        </Pressable>
        <Pressable style={s.deleteBtn} onPress={() => handleDelete(item.id, item.name)}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
        </Pressable>
      </View>
    </View>
  );

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
          <Text style={s.headerTitle}>{t('manageProducts')}</Text>
          <Text style={s.headerSub}>NH QUALITY GOODS LLC</Text>
        </View>
        <Pressable style={s.addButton} onPress={openAddModal}>
          <Ionicons name="add" size={24} color={COLORS.deepNavy} />
        </Pressable>
      </View>

      <FlatList data={products} keyExtractor={(item) => item.id} renderItem={renderProduct}
        contentContainerStyle={s.list} numColumns={2} columnWrapperStyle={s.row}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.royalGold} />}
      />

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent onRequestClose={() => setShowAddModal(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>{editingProduct ? 'Edit Product' : t('addProduct')}</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Image Picker */}
              <Pressable testID="pick-product-image" style={s.imagePickerArea} onPress={pickImage}>
                {imagePreview ? (
                  <Image source={{ uri: imagePreview }} style={s.pickerImage} resizeMode="cover" />
                ) : (
                  <View style={s.pickerPlaceholder}>
                    <Ionicons name="camera" size={36} color={COLORS.royalGold} />
                    <Text style={s.pickerText}>Tap to add photo</Text>
                  </View>
                )}
                <View style={s.pickerBadge}>
                  <Ionicons name="image" size={14} color={COLORS.white} />
                  <Text style={s.pickerBadgeText}>{imagePreview ? 'Change' : 'Upload'}</Text>
                </View>
              </Pressable>

              <TextInput style={s.input} placeholder="Product Name *" placeholderTextColor={COLORS.textMuted}
                value={newProduct.name} onChangeText={(t) => setNewProduct({ ...newProduct, name: t })} />
              <TextInput style={[s.input, s.textArea]} placeholder="Description (e.g. 12 Piece)" placeholderTextColor={COLORS.textMuted}
                value={newProduct.description} onChangeText={(t) => setNewProduct({ ...newProduct, description: t })} multiline />

              <Text style={s.inputLabel}>Category</Text>
              <View style={s.catPicker}>
                {CATEGORIES.map((c) => (
                  <Pressable key={c.id} style={[s.catOption, newProduct.category === c.id && s.catOptionActive]}
                    onPress={() => setNewProduct({ ...newProduct, category: c.id })}>
                    <Text style={[s.catOptionText, newProduct.category === c.id && s.catOptionTextActive]}>{c.name}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={s.priceRow}>
                <View style={s.priceInput}>
                  <Text style={s.inputLabel}>Price *</Text>
                  <TextInput style={s.input} placeholder="0.00" placeholderTextColor={COLORS.textMuted}
                    value={newProduct.price} onChangeText={(t) => setNewProduct({ ...newProduct, price: t })} keyboardType="decimal-pad" />
                </View>
                <View style={s.priceInput}>
                  <Text style={s.inputLabel}>Stock</Text>
                  <TextInput style={s.input} placeholder="0" placeholderTextColor={COLORS.textMuted}
                    value={newProduct.stock} onChangeText={(t) => setNewProduct({ ...newProduct, stock: t })} keyboardType="number-pad" />
                </View>
              </View>

              <Pressable style={[s.saveBtn, isCreating && s.saveBtnDisabled]} onPress={handleSave} disabled={isCreating}>
                {isCreating ? <ActivityIndicator color={COLORS.deepNavy} /> :
                  <Text style={s.saveBtnText}>{editingProduct ? 'Update Product' : 'Create Product'}</Text>}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  backBtn: { padding: SPACING.sm, marginRight: SPACING.sm },
  headerText: { flex: 1 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  addButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.royalGold, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: SPACING.xl },
  row: { justifyContent: 'space-between', marginBottom: SPACING.md },
  card: { width: '48%', backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', ...SHADOWS.small },
  imageArea: { position: 'relative' },
  productImage: { width: '100%', height: 100 },
  imagePlaceholder: { width: '100%', height: 100, backgroundColor: COLORS.inputBackground, alignItems: 'center', justifyContent: 'center' },
  addPhotoText: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 4 },
  editImageBadge: { position: 'absolute', bottom: 6, right: 6, width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.royalGold, alignItems: 'center', justifyContent: 'center' },
  catBadge: { alignSelf: 'flex-start', paddingVertical: 2, paddingHorizontal: SPACING.sm, borderRadius: BORDER_RADIUS.sm, marginTop: SPACING.sm, marginLeft: SPACING.sm },
  catText: { fontSize: 8, fontWeight: 'bold', textTransform: 'uppercase' },
  prodName: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.textPrimary, marginHorizontal: SPACING.sm, marginTop: SPACING.xs },
  prodDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginHorizontal: SPACING.sm },
  prodFooter: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: SPACING.sm, marginTop: SPACING.sm },
  prodPrice: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.royalGold },
  prodStock: { fontSize: FONTS.sizes.xs, color: COLORS.success },
  outOfStock: { color: COLORS.error },
  prodActions: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.border, marginTop: SPACING.sm },
  editBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.sm, gap: 4 },
  editBtnText: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, fontWeight: '600' },
  deleteBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderLeftWidth: 1, borderLeftColor: COLORS.border },
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.xl, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.textPrimary },
  imagePickerArea: { position: 'relative', marginBottom: SPACING.lg, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  pickerImage: { width: '100%', height: 180, borderRadius: BORDER_RADIUS.lg },
  pickerPlaceholder: { width: '100%', height: 180, backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.royalGold + '40', borderStyle: 'dashed' },
  pickerText: { color: COLORS.textMuted, marginTop: SPACING.sm, fontSize: FONTS.sizes.sm },
  pickerBadge: { position: 'absolute', bottom: 10, right: 10, flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.royalGold, paddingVertical: 6, paddingHorizontal: 12, borderRadius: BORDER_RADIUS.full },
  pickerBadgeText: { color: COLORS.white, fontSize: FONTS.sizes.xs, fontWeight: 'bold' },
  inputLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, marginBottom: SPACING.xs },
  input: { backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, fontSize: FONTS.sizes.md, color: COLORS.textPrimary, marginBottom: SPACING.md },
  textArea: { minHeight: 60, textAlignVertical: 'top' },
  catPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginBottom: SPACING.md },
  catOption: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.inputBackground },
  catOptionActive: { backgroundColor: COLORS.royalGold },
  catOptionText: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  catOptionTextActive: { color: COLORS.deepNavy, fontWeight: 'bold' },
  priceRow: { flexDirection: 'row', gap: SPACING.md },
  priceInput: { flex: 1 },
  saveBtn: { backgroundColor: COLORS.royalGold, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.md, alignItems: 'center', marginTop: SPACING.md, marginBottom: SPACING.xl },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.md, fontWeight: 'bold' }
});
