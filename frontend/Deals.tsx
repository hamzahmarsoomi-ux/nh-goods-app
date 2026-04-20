import React, { useEffect, useState } from 'react';
import {
  View, Text, FlatList, Image, StyleSheet,
  ActivityIndicator, TouchableOpacity, SafeAreaView, StatusBar,
} from 'react-native';

const imageMap: { [key: string]: any } = {
  skinnypop: require('./assets/images/deals/skinnypop.jpg'),
  reeses_pretzels: require('./assets/images/deals/reeses_pretzels.jpg'),
  sour_strips: require('./assets/images/deals/sour_strips.jpg'),
  twizzlers: require('./assets/images/deals/twizzlers.jpg'),
  shaq_xl: require('./assets/images/deals/shaq_xl.jpg'),
  jolly_ropes_wm: require('./assets/images/deals/jolly_ropes_wm.jpg'),
  jolly_hard: require('./assets/images/deals/jolly_hard.jpg'),
  dots_honey: require('./assets/images/deals/dots_honey.jpg'),
  payday_std: require('./assets/images/deals/payday_std.jpg'),
  payday_king: require('./assets/images/deals/payday_king.jpg'),
  mounds: require('./assets/images/deals/mounds.jpg'),
  almond_joy: require('./assets/images/deals/almond_joy.jpg'),
  hersheys_dipped_pretzels: require('./assets/images/deals/hersheys_dipped_pretzels.jpg'),
  reeses_fastbreak: require('./assets/images/deals/reeses_fastbreak.jpg'),
  hersheys_king: require('./assets/images/deals/hersheys_king.jpg'),
  reeses_cups_box: require('./assets/images/deals/reeses_cups_box.jpg'),
};

interface DealItem {
  name: string;
  pack: string;
  category: string;
  price: number;
  original_price: number;
  image: string;
  tag: string;
}

const DealsPage = () => {
  const [items, setItems] = useState<DealItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDeals = () => {
    setLoading(true);
    setError(null);
    fetch('https://sweet-balance-production-89a6.up.railway.app/api/deals')
      .then(res => res.json())
      .then(data => { setItems(data); setLoading(false); })
      .catch(() => { setError('Failed to load deals. Please try again.'); setLoading(false); });
  };

  useEffect(() => { loadDeals(); }, []);

  const renderItem = ({ item }: { item: DealItem }) => {
    const imgSource = imageMap[item.image];
    return (
      <View style={styles.card}>
        <View style={styles.imageContainer}>
          {imgSource
            ? <Image source={imgSource} style={styles.productImage} resizeMode="contain" />
            : <Text style={{ fontSize: 40 }}>🛒</Text>}
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.dealBadge}>
            <Text style={styles.dealBadgeText}>{item.tag}</Text>
          </View>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.packInfo}>{item.pack}</Text>
          <View style={styles.priceRow}>
            <Text style={styles.ourPrice}>${item.price?.toFixed(2)}</Text>
            <Text style={styles.originalPrice}>${item.original_price?.toFixed(2)}</Text>
            <View style={styles.saveBadge}>
              <Text style={styles.saveText}>Save $2</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.addButton} activeOpacity={0.8}>
            <Text style={styles.addButtonText}>🛒  Add to Order</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading) return (
    <SafeAreaView style={styles.centerContainer}>
      <ActivityIndicator size="large" color="#1a1a1a" />
      <Text style={styles.loadingText}>Loading Today's Deals...</Text>
    </SafeAreaView>
  );

  if (error) return (
    <SafeAreaView style={styles.centerContainer}>
      <Text style={{ fontSize: 48, marginBottom: 12 }}>⚠️</Text>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={loadDeals}>
        <Text style={styles.retryText}>Try Again</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Today's Deals</Text>
        <Text style={styles.headerSubtitle}>
          Premium selections for our Manchester partners at NH Quality Goods
        </Text>
        <View style={styles.headerBadge}>
          <Text style={styles.headerBadgeText}>{items.length} deals available</Text>
        </View>
      </View>
      <FlatList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.name}-${index}`}
        numColumns={2}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={styles.row}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fdfdfd', padding: 20 },
  header: { backgroundColor: '#1a1a1a', paddingVertical: 24, paddingHorizontal: 20, alignItems: 'center' },
  headerTitle: { fontSize: 26, fontWeight: '700', color: '#ffffff', letterSpacing: -0.5, marginBottom: 6 },
  headerSubtitle: { fontSize: 13, color: '#aaaaaa', textAlign: 'center', marginBottom: 12 },
  headerBadge: { backgroundColor: '#f0c040', paddingHorizontal: 14, paddingVertical: 4, borderRadius: 20 },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#1a1a1a' },
  listContent: { padding: 12, paddingBottom: 30 },
  row: { justifyContent: 'space-between' },
  card: {
    backgroundColor: '#ffffff', borderRadius: 14, marginBottom: 14,
    width: '48.5%', overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
  },
  imageContainer: { backgroundColor: '#f9f9f9', height: 140, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  productImage: { width: '90%', height: '90%' },
  categoryBadge: { position: 'absolute', top: 8, left: 8, backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  categoryText: { color: '#fff', fontSize: 10, fontWeight: '600' },
  cardBody: { padding: 12 },
  dealBadge: { backgroundColor: '#ff3b30', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginBottom: 8 },
  dealBadgeText: { color: '#fff', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  productName: { fontSize: 12, fontWeight: '600', color: '#1a1a1a', lineHeight: 17, marginBottom: 4 },
  packInfo: { fontSize: 11, color: '#888', marginBottom: 10 },
  priceRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  ourPrice: { fontSize: 16, fontWeight: '700', color: '#2c7a2c' },
  originalPrice: { fontSize: 12, color: '#bbb', textDecorationLine: 'line-through' },
  saveBadge: { backgroundColor: '#e8f5e9', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  saveText: { fontSize: 10, color: '#2c7a2c', fontWeight: '700' },
  addButton: { backgroundColor: '#1a1a1a', borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  loadingText: { marginTop: 12, fontSize: 15, color: '#666' },
  errorText: { fontSize: 15, color: '#cc0000', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#1a1a1a', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 10 },
  retryText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default DealsPage;
