import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  TextInput,
  RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useCartStore } from '../../src/store/cartStore';
import { useAuthStore } from '../../src/store/authStore';
import { getProducts, getCategories } from '../../src/utils/api';

export default function CatalogScreen() {
  const { t, rtl, language } = useTranslation();
  const params = useLocalSearchParams<{ category?: string }>();
  const addItem = useCartStore((state) => state.addItem);
  const user = useAuthStore((state) => state.user);
  const canSeePrices = user?.can_see_prices !== false;
  
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(params.category || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  useEffect(() => {
    loadCategories();
  }, []);
  
  useEffect(() => {
    loadProducts();
  }, [selectedCategory]);
  
  const loadCategories = async () => {
    try {
      const res = await getCategories();
      setCategories(res.data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };
  
  const loadProducts = async () => {
    setLoading(true);
    try {
      const res = await getProducts(selectedCategory || undefined);
      setProducts(res.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = () => {
    setRefreshing(true);
    loadProducts();
  };
  
  const handleAddToCart = (product: any) => {
    addItem({
      product_id: product.id,
      name: getLocalizedName(product),
      price: product.wholesale_price || product.price,
      image_base64: product.image_base64
    });
  };
  
  const getLocalizedName = (product: any) => {
    const langKey = `name_${language}`;
    return product[langKey] || product.name;
  };
  
  const getLocalizedDescription = (product: any) => {
    const langKey = `description_${language}`;
    return product[langKey] || product.description || '';
  };
  
  const getCategoryName = (cat: any) => {
    const langKey = `name_${language}`;
    return cat[langKey] || cat.name;
  };
  
  const filteredProducts = products.filter(p => {
    const name = getLocalizedName(p).toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });
  
  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <View style={styles.productImageContainer}>
        {item.image_base64 ? (
          <View style={styles.productImage} />
        ) : (
          <View style={styles.productImagePlaceholder}>
            <Ionicons name="cube-outline" size={40} color={COLORS.textMuted} />
          </View>
        )}
        {item.stock > 0 ? (
          <View style={styles.stockBadge}>
            <Text style={styles.stockText}>{t('inStock')}</Text>
          </View>
        ) : (
          <View style={[styles.stockBadge, styles.outOfStock]}>
            <Text style={styles.stockText}>{t('outOfStock')}</Text>
          </View>
        )}
      </View>
      
      <View style={styles.productInfo}>
        <Text style={[styles.productName, rtl && styles.rtlText]} numberOfLines={2}>
          {getLocalizedName(item)}
        </Text>
        {getLocalizedDescription(item) && (
          <Text style={[styles.productDescription, rtl && styles.rtlText]} numberOfLines={2}>
            {getLocalizedDescription(item)}
          </Text>
        )}
        
        <View style={styles.priceRow}>
          <View>
            {canSeePrices ? (
              <Text style={styles.wholesalePrice}>
                ${(item.wholesale_price || item.price).toFixed(2)}
              </Text>
            ) : (
              <Text style={styles.contactPrice}>Contact for price</Text>
            )}
          </View>
        </View>
        
        {canSeePrices ? (
          <Pressable
            style={[styles.addButton, item.stock === 0 && styles.addButtonDisabled]}
            onPress={() => handleAddToCart(item)}
            disabled={item.stock === 0}
          >
            <Ionicons name="cart-outline" size={18} color={COLORS.deepNavy} />
            <Text style={styles.addButtonText}>{t('addToCart')}</Text>
          </Pressable>
        ) : (
          <View style={styles.viewOnlyBadge}>
            <Ionicons name="eye-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.viewOnlyText}>View Only</Text>
          </View>
        )}
      </View>
    </View>
  );
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('catalog')}</Text>
        <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
      </View>
      
      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={COLORS.textMuted} />
        <TextInput
          style={[styles.searchInput, rtl && styles.rtlText]}
          placeholder={t('search')}
          placeholderTextColor={COLORS.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={COLORS.textMuted} />
          </Pressable>
        )}
      </View>
      
      {/* Categories */}
      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: null, name: t('allCategories') }, ...categories]}
          keyExtractor={(item) => item.id || 'all'}
          contentContainerStyle={styles.categoriesList}
          renderItem={({ item }) => (
            <Pressable
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === item.id && styles.categoryChipTextActive
              ]}>
                {item.id ? getCategoryName(item) : item.name}
              </Text>
            </Pressable>
          )}
        />
      </View>
      
      {/* Products */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.royalGold} />
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          contentContainerStyle={styles.productsList}
          numColumns={2}
          columnWrapperStyle={styles.productsRow}
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
              <Ionicons name="cube-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>{t('noResults')}</Text>
            </View>
          }
        />
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
    paddingBottom: SPACING.sm
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    marginHorizontal: SPACING.xl,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md
  },
  searchInput: {
    flex: 1,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary
  },
  categoriesContainer: {
    marginBottom: SPACING.md
  },
  categoriesList: {
    paddingHorizontal: SPACING.xl
  },
  categoryChip: {
    backgroundColor: COLORS.cardBackground,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  categoryChipActive: {
    backgroundColor: COLORS.royalGold,
    borderColor: COLORS.royalGold
  },
  categoryChipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm
  },
  categoryChipTextActive: {
    color: COLORS.deepNavy,
    fontWeight: 'bold'
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  productsList: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl
  },
  productsRow: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small
  },
  productImageContainer: {
    position: 'relative'
  },
  productImage: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.inputBackground
  },
  productImagePlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: COLORS.inputBackground,
    alignItems: 'center',
    justifyContent: 'center'
  },
  stockBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    backgroundColor: COLORS.success,
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm
  },
  outOfStock: {
    backgroundColor: COLORS.error
  },
  stockText: {
    color: COLORS.white,
    fontSize: 9,
    fontWeight: 'bold'
  },
  productInfo: {
    padding: SPACING.md
  },
  productName: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    marginBottom: SPACING.xs
  },
  productDescription: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs,
    marginBottom: SPACING.sm
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm
  },
  wholesaleLabel: {
    color: COLORS.textMuted,
    fontSize: 9
  },
  wholesalePrice: {
    color: COLORS.royalGold,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold'
  },
  retailLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    textAlign: 'right'
  },
  retailPrice: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    textDecorationLine: 'line-through'
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.royalGold,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs
  },
  addButtonDisabled: {
    backgroundColor: COLORS.textMuted,
    opacity: 0.5
  },
  addButtonText: {
    color: COLORS.deepNavy,
    fontSize: FONTS.sizes.xs,
    fontWeight: 'bold'
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
  },
  rtlText: {
    textAlign: 'right'
  },
  contactPrice: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    fontStyle: 'italic'
  },
  viewOnlyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBackground,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs
  },
  viewOnlyText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.xs
  }
});
