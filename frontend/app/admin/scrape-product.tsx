import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator,
  Alert, ScrollView, Image, KeyboardAvoidingView, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { scrapeProduct, createProduct } from '../../src/utils/api';

const CATEGORIES = [
  { id: 'cakes_pastry', name: 'Cakes & Pastry' },
  { id: 'nuts_seeds', name: 'Nuts & Snacks' },
  { id: 'energy_drinks', name: 'Energy Drinks' },
  { id: 'candy', name: 'Candy' },
];

export default function ScrapeProductScreen() {
  const router = useRouter();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scraped, setScraped] = useState<any>(null);

  // Editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState('');
  const [stock, setStock] = useState('100');
  const [category, setCategory] = useState('candy');
  const [imageUrl, setImageUrl] = useState('');
  const [isFlashDeal, setIsFlashDeal] = useState(true);

  const handleScrape = useCallback(async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a product URL');
      return;
    }
    setLoading(true);
    setScraped(null);
    try {
      const res = await scrapeProduct(url.trim());
      const data = res.data;
      setScraped(data);
      setName(data.name || '');
      setDescription(data.description || '');
      setImageUrl(data.image_url || '');
      // Add $2 markup automatically
      const basePrice = data.price || 0;
      setPrice((basePrice + 2).toFixed(2));
      setWholesalePrice(basePrice > 0 ? basePrice.toFixed(2) : '');
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to fetch product info');
    } finally {
      setLoading(false);
    }
  }, [url]);

  const handleSave = useCallback(async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Product name is required');
      return;
    }
    if (!price || isNaN(parseFloat(price))) {
      Alert.alert('Error', 'Valid price is required');
      return;
    }
    setSaving(true);
    try {
      await createProduct({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        price: parseFloat(price),
        wholesale_price: wholesalePrice ? parseFloat(wholesalePrice) : undefined,
        stock: parseInt(stock) || 100,
        image_url: imageUrl.trim() || undefined,
        is_available: true,
        is_flash_deal: isFlashDeal,
        flash_deal_price: isFlashDeal ? parseFloat(price) : undefined,
        unit: 'case',
      });
      Alert.alert('Success ✅', `"${name}" has been added to Today's Deals!`, [
        { text: 'Add Another', onPress: () => { setUrl(''); setScraped(null); } },
        { text: 'Go Back', onPress: () => router.back() },
      ]);
    } catch (e: any) {
      Alert.alert('Error', e?.response?.data?.detail || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  }, [name, description, price, wholesalePrice, stock, category, imageUrl, isFlashDeal]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </Pressable>
        <Text style={styles.headerTitle}>Add Product from URL</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* URL Input */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>🔗 Product URL</Text>
            <Text style={styles.hint}>Paste a link from Amazon, McLane, or any product page</Text>
            <View style={styles.urlRow}>
              <TextInput
                style={styles.urlInput}
                value={url}
                onChangeText={setUrl}
                placeholder="https://www.amazon.com/product..."
                placeholderTextColor={COLORS.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
              <Pressable
                style={[styles.fetchBtn, loading && styles.fetchBtnDisabled]}
                onPress={handleScrape}
                disabled={loading}
              >
                {loading
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Ionicons name="search" size={20} color={COLORS.white} />
                }
              </Pressable>
            </View>
          </View>

          {/* Scraped Result — Editable */}
          {scraped && (
            <>
              {/* Image Preview */}
              {imageUrl ? (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>🖼️ Product Image</Text>
                  <Image source={{ uri: imageUrl }} style={styles.previewImage} resizeMode="contain" />
                  <TextInput
                    style={[styles.input, { marginTop: 8 }]}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="Image URL"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                  />
                </View>
              ) : (
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>🖼️ Image URL (manual)</Text>
                  <TextInput
                    style={styles.input}
                    value={imageUrl}
                    onChangeText={setImageUrl}
                    placeholder="Paste image URL here"
                    placeholderTextColor={COLORS.textMuted}
                    autoCapitalize="none"
                  />
                </View>
              )}

              {/* Product Details */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>📦 Product Details</Text>

                <Text style={styles.label}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Product name"
                  placeholderTextColor={COLORS.textMuted}
                />

                <Text style={styles.label}>Description</Text>
                <TextInput
                  style={[styles.input, styles.multiline]}
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Product description"
                  placeholderTextColor={COLORS.textMuted}
                  multiline
                  numberOfLines={3}
                />

                <Text style={styles.label}>Category</Text>
                <View style={styles.categoryRow}>
                  {CATEGORIES.map(cat => (
                    <Pressable
                      key={cat.id}
                      style={[styles.catChip, category === cat.id && styles.catChipActive]}
                      onPress={() => setCategory(cat.id)}
                    >
                      <Text style={[styles.catChipText, category === cat.id && styles.catChipTextActive]}>
                        {cat.name}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* Pricing */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>💰 Pricing</Text>
                <View style={styles.priceRow}>
                  <View style={{ flex: 1, marginRight: 8 }}>
                    <Text style={styles.label}>Your Price ($) *</Text>
                    <TextInput
                      style={styles.input}
                      value={price}
                      onChangeText={setPrice}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Cost Price ($)</Text>
                    <TextInput
                      style={styles.input}
                      value={wholesalePrice}
                      onChangeText={setWholesalePrice}
                      placeholder="0.00"
                      placeholderTextColor={COLORS.textMuted}
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <Text style={styles.label}>Stock Quantity</Text>
                <TextInput
                  style={styles.input}
                  value={stock}
                  onChangeText={setStock}
                  placeholder="100"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="number-pad"
                />

                {/* Flash Deal Toggle */}
                <Pressable
                  style={[styles.toggleRow, isFlashDeal && styles.toggleRowActive]}
                  onPress={() => setIsFlashDeal(!isFlashDeal)}
                >
                  <Ionicons
                    name={isFlashDeal ? 'flash' : 'flash-outline'}
                    size={20}
                    color={isFlashDeal ? COLORS.white : COLORS.textMuted}
                  />
                  <Text style={[styles.toggleText, isFlashDeal && styles.toggleTextActive]}>
                    Add to Today's Deals
                  </Text>
                  <Ionicons
                    name={isFlashDeal ? 'checkbox' : 'square-outline'}
                    size={22}
                    color={isFlashDeal ? COLORS.white : COLORS.textMuted}
                  />
                </Pressable>
              </View>

              {/* Save Button */}
              <Pressable
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                {saving
                  ? <ActivityIndicator size="small" color={COLORS.white} />
                  : <Ionicons name="checkmark-circle" size={22} color={COLORS.white} />
                }
                <Text style={styles.saveBtnText}>
                  {saving ? 'Saving...' : 'Save Product'}
                </Text>
              </Pressable>
            </>
          )}

          {/* Empty state */}
          {!scraped && !loading && (
            <View style={styles.emptyState}>
              <Ionicons name="link-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Paste a product URL above</Text>
              <Text style={styles.emptySubtitle}>
                The app will automatically fetch the product name, image, and price.
                You can edit everything before saving.
              </Text>
            </View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.primary, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...FONTS.h3, color: COLORS.white, flex: 1, textAlign: 'center' },
  content: { padding: SPACING.md, paddingBottom: 40 },
  card: {
    backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.md, ...SHADOWS.sm,
  },
  sectionTitle: { ...FONTS.h4, color: COLORS.text, marginBottom: 4 },
  hint: { ...FONTS.caption, color: COLORS.textMuted, marginBottom: SPACING.sm },
  label: { ...FONTS.caption, color: COLORS.textSecondary, marginTop: SPACING.sm, marginBottom: 4 },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  urlInput: {
    flex: 1, backgroundColor: COLORS.backgroundAlt, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm, paddingVertical: 10, ...FONTS.body, color: COLORS.text,
  },
  fetchBtn: {
    backgroundColor: COLORS.primary, borderRadius: BORDER_RADIUS.md,
    width: 44, height: 44, justifyContent: 'center', alignItems: 'center',
  },
  fetchBtnDisabled: { opacity: 0.6 },
  input: {
    backgroundColor: COLORS.backgroundAlt, borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.sm, paddingVertical: 10, ...FONTS.body, color: COLORS.text,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  previewImage: { width: '100%', height: 200, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.backgroundAlt },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  catChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    backgroundColor: COLORS.backgroundAlt, borderWidth: 1, borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { ...FONTS.caption, color: COLORS.textSecondary },
  catChipTextActive: { color: COLORS.white },
  priceRow: { flexDirection: 'row' },
  toggleRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: SPACING.sm,
    backgroundColor: COLORS.backgroundAlt, borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm, borderWidth: 1, borderColor: COLORS.border,
  },
  toggleRowActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  toggleText: { ...FONTS.body, color: COLORS.textSecondary, flex: 1 },
  toggleTextActive: { color: COLORS.white },
  saveBtn: {
    backgroundColor: COLORS.success, borderRadius: BORDER_RADIUS.lg,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 14, marginTop: 4,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { ...FONTS.h4, color: COLORS.white },
  emptyState: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: SPACING.lg },
  emptyTitle: { ...FONTS.h3, color: COLORS.textSecondary, marginTop: SPACING.md, textAlign: 'center' },
  emptySubtitle: { ...FONTS.body, color: COLORS.textMuted, marginTop: 8, textAlign: 'center', lineHeight: 22 },
});
