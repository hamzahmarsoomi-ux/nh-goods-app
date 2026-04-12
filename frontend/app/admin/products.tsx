import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Alert,
  TextInput,
  Modal,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getProducts, createProduct, deleteProduct } from '../../src/utils/api';

const CATEGORIES = [
  { id: 'cakes_pastry', name: 'Cakes, Donuts & Pastry' },
  { id: 'nuts_seeds', name: 'Nuts, Seeds & Trail Mix' },
  { id: 'energy_drinks', name: 'Energy Drinks' }
];

export default function AdminProductsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    category: 'bakery',
    price: '',
    wholesale_price: '',
    stock: '',
    unit: 'each'
  });
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    loadProducts();
  }, []);
  
  const loadProducts = async () => {
    try {
      const res = await getProducts();
      setProducts(res.data);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadProducts();
  }, []);
  
  const handleCreateProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      Alert.alert('Error', 'Name and Price are required');
      return;
    }
    
    setIsCreating(true);
    try {
      await createProduct({
        ...newProduct,
        price: parseFloat(newProduct.price),
        wholesale_price: newProduct.wholesale_price ? parseFloat(newProduct.wholesale_price) : parseFloat(newProduct.price),
        stock: newProduct.stock ? parseInt(newProduct.stock) : 0
      });
      setShowAddModal(false);
      setNewProduct({
        name: '',
        description: '',
        category: 'bakery',
        price: '',
        wholesale_price: '',
        stock: '',
        unit: 'each'
      });
      loadProducts();
      Alert.alert('Success', 'Product created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create product');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDeleteProduct = (productId: string, productName: string) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete ${productName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProduct(productId);
              loadProducts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete product');
            }
          }
        }
      ]
    );
  };
  
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'bakery': return COLORS.bakery;
      case 'cakes_sweets': return COLORS.cakesSweets;
      case 'premium_snacks': return COLORS.premiumSnacks;
      case 'energy_beverages': return COLORS.energyBeverages;
      default: return COLORS.royalGold;
    }
  };
  
  const renderProduct = ({ item }: { item: any }) => (
    <View style={styles.productCard}>
      <View style={styles.productHeader}>
        <View style={[styles.categoryBadge, { backgroundColor: getCategoryColor(item.category) + '20' }]}>
          <Text style={[styles.categoryText, { color: getCategoryColor(item.category) }]}>
            {item.category.replace('_', ' ')}
          </Text>
        </View>
        <Pressable onPress={() => handleDeleteProduct(item.id, item.name)}>
          <Ionicons name="trash-outline" size={20} color={COLORS.error} />
        </Pressable>
      </View>
      
      <Text style={styles.productName}>{item.name}</Text>
      {item.description && (
        <Text style={styles.productDescription} numberOfLines={2}>{item.description}</Text>
      )}
      
      <View style={styles.productFooter}>
        <View>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.wholesalePrice}>${(item.wholesale_price || item.price).toFixed(2)}</Text>
        </View>
        <View>
          <Text style={styles.priceLabel}>Stock</Text>
          <Text style={[styles.stockText, item.stock === 0 && styles.outOfStock]}>
            {item.stock}
          </Text>
        </View>
      </View>
    </View>
  );
  
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
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{t('manageProducts')}</Text>
          <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.deepNavy} />
        </Pressable>
      </View>
      
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.row}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.royalGold}
          />
        }
      />
      
      {/* Add Product Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('addProduct')}</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>
            
            <ScrollView showsVerticalScrollIndicator={false}>
              <TextInput
                style={styles.input}
                placeholder="Product Name *"
                placeholderTextColor={COLORS.textMuted}
                value={newProduct.name}
                onChangeText={(text) => setNewProduct({ ...newProduct, name: text })}
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor={COLORS.textMuted}
                value={newProduct.description}
                onChangeText={(text) => setNewProduct({ ...newProduct, description: text })}
                multiline
                numberOfLines={3}
              />
              
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryPicker}>
                {CATEGORIES.map((cat) => (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryOption,
                      newProduct.category === cat.id && styles.categoryOptionActive
                    ]}
                    onPress={() => setNewProduct({ ...newProduct, category: cat.id })}
                  >
                    <Text style={[
                      styles.categoryOptionText,
                      newProduct.category === cat.id && styles.categoryOptionTextActive
                    ]}>
                      {cat.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
              
              <View style={styles.priceRow}>
                <View style={styles.priceInput}>
                  <Text style={styles.inputLabel}>Price *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    value={newProduct.price}
                    onChangeText={(text) => setNewProduct({ ...newProduct, price: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
                <View style={styles.priceInput}>
                  <Text style={styles.inputLabel}>Wholesale</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.textMuted}
                    value={newProduct.wholesale_price}
                    onChangeText={(text) => setNewProduct({ ...newProduct, wholesale_price: text })}
                    keyboardType="decimal-pad"
                  />
                </View>
              </View>
              
              <View style={styles.priceRow}>
                <View style={styles.priceInput}>
                  <Text style={styles.inputLabel}>Stock</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="0"
                    placeholderTextColor={COLORS.textMuted}
                    value={newProduct.stock}
                    onChangeText={(text) => setNewProduct({ ...newProduct, stock: text })}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.priceInput}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="each"
                    placeholderTextColor={COLORS.textMuted}
                    value={newProduct.unit}
                    onChangeText={(text) => setNewProduct({ ...newProduct, unit: text })}
                  />
                </View>
              </View>
              
              <Pressable
                style={[styles.createButton, isCreating && styles.createButtonDisabled]}
                onPress={handleCreateProduct}
                disabled={isCreating}
              >
                {isCreating ? (
                  <ActivityIndicator color={COLORS.deepNavy} />
                ) : (
                  <Text style={styles.createButtonText}>Create Product</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg
  },
  backButton: {
    padding: SPACING.sm,
    marginRight: SPACING.sm
  },
  headerText: {
    flex: 1
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
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.royalGold,
    alignItems: 'center',
    justifyContent: 'center'
  },
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xl
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: SPACING.md
  },
  productCard: {
    width: '48%',
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    ...SHADOWS.small
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm
  },
  categoryBadge: {
    paddingVertical: 2,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm
  },
  categoryText: {
    fontSize: 9,
    fontWeight: 'bold',
    textTransform: 'uppercase'
  },
  productName: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.xs
  },
  productDescription: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginBottom: SPACING.sm
  },
  productFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  priceLabel: {
    fontSize: 9,
    color: COLORS.textMuted
  },
  wholesalePrice: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.royalGold
  },
  retailPrice: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary
  },
  stockText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    color: COLORS.success
  },
  outOfStock: {
    color: COLORS.error
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xl
  },
  modalTitle: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  inputLabel: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs
  },
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top'
  },
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md
  },
  categoryOption: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.inputBackground
  },
  categoryOptionActive: {
    backgroundColor: COLORS.royalGold
  },
  categoryOptionText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary
  },
  categoryOptionTextActive: {
    color: COLORS.deepNavy,
    fontWeight: 'bold'
  },
  priceRow: {
    flexDirection: 'row',
    gap: SPACING.md
  },
  priceInput: {
    flex: 1
  },
  createButton: {
    backgroundColor: COLORS.royalGold,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md,
    marginBottom: SPACING.xl
  },
  createButtonDisabled: {
    opacity: 0.7
  },
  createButtonText: {
    color: COLORS.deepNavy,
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold'
  }
});
