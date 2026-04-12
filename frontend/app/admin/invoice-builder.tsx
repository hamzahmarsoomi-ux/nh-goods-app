import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Alert, ActivityIndicator, Modal, FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format } from 'date-fns';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { getUsers, getProducts } from '../../src/utils/api';

interface InvoiceItem {
  name: string;
  qty: string;
  price: string;
}

export default function InvoiceBuilderScreen() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([{ name: '', qty: '1', price: '' }]);
  const [invoiceNote, setInvoiceNote] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadData();
    loadNextInvoiceNumber();
  }, []);

  const loadNextInvoiceNumber = async () => {
    try {
      const stored = await import('@react-native-async-storage/async-storage');
      const lastNum = await stored.default.getItem('last_invoice_number');
      const next = lastNum ? parseInt(lastNum) + 1 : 1;
      setInvoiceNumber(`HM-${String(next).padStart(4, '0')}`);
    } catch { setInvoiceNumber('HM-0001'); }
  };

  const saveInvoiceNumber = async () => {
    try {
      const num = parseInt(invoiceNumber.replace('HM-', '')) || 0;
      const stored = await import('@react-native-async-storage/async-storage');
      await stored.default.setItem('last_invoice_number', String(num));
    } catch {}
  };

  const loadData = async () => {
    try {
      const [usersRes, prodsRes] = await Promise.all([getUsers(), getProducts()]);
      setCustomers(usersRes.data.filter((u: any) => !u.is_admin));
      setProducts(prodsRes.data);
    } catch (e) { console.error(e); }
  };

  const addItem = () => setItems([...items, { name: '', qty: '1', price: '' }]);

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const selectProduct = (product: any) => {
    const price = (product.wholesale_price || product.price).toFixed(2);
    // Check if product already in list
    const existingIndex = items.findIndex(i => i.name === product.name);
    if (existingIndex >= 0) {
      const updated = [...items];
      updated[existingIndex].qty = String((parseInt(updated[existingIndex].qty) || 0) + 1);
      setItems(updated);
    } else {
      setItems([...items.filter(i => i.name !== ''), { name: product.name, qty: '1', price }]);
    }
    setShowProductPicker(false);
  };

  const [activeItemIndex, setActiveItemIndex] = useState(0);

  const getTotal = () => {
    return items.reduce((sum, item) => {
      const qty = parseFloat(item.qty) || 0;
      const price = parseFloat(item.price) || 0;
      return sum + (qty * price);
    }, 0);
  };

  const generatePDF = async () => {
    if (!selectedCustomer) { Alert.alert('Error', 'Select a customer'); return; }
    if (items.some(i => !i.name || !i.price)) { Alert.alert('Error', 'Fill all item details'); return; }

    setGenerating(true);
    try {
      const total = getTotal();
      const date = format(new Date(), 'MMMM d, yyyy');

      const itemRows = items.map((item, i) => {
        const qty = parseFloat(item.qty) || 0;
        const price = parseFloat(item.price) || 0;
        return `<tr>
          <td style="padding:10px;border-bottom:1px solid #1E3A5F;">${i + 1}</td>
          <td style="padding:10px;border-bottom:1px solid #1E3A5F;">${item.name}</td>
          <td style="padding:10px;border-bottom:1px solid #1E3A5F;text-align:center;">${qty}</td>
          <td style="padding:10px;border-bottom:1px solid #1E3A5F;text-align:right;">$${price.toFixed(2)}</td>
          <td style="padding:10px;border-bottom:1px solid #1E3A5F;text-align:right;font-weight:bold;">$${(qty * price).toFixed(2)}</td>
        </tr>`;
      }).join('');

      const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <style>
        body{font-family:Arial,sans-serif;margin:0;padding:30px;color:#fff;background:#05101F;}
        .header{display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;padding-bottom:20px;border-bottom:3px solid #D4AF37;}
        .logo{font-size:32px;font-weight:bold;color:#D4AF37;}
        .company{font-size:12px;color:#A0B4C8;margin-top:4px;}
        .tagline{font-size:11px;color:#D4AF37;margin-top:2px;}
        .invoice-title{font-size:24px;color:#D4AF37;text-align:right;}
        .invoice-num{font-size:14px;color:#A0B4C8;text-align:right;}
        .info-grid{display:flex;justify-content:space-between;margin-bottom:30px;}
        .info-box{background:#0D1F35;padding:15px;border-radius:8px;width:48%;}
        .info-label{font-size:10px;color:#6B7F94;text-transform:uppercase;margin-bottom:4px;}
        .info-value{font-size:14px;color:#fff;}
        table{width:100%;border-collapse:collapse;margin-bottom:20px;}
        th{background:#0D1F35;color:#D4AF37;padding:12px 10px;text-align:left;font-size:12px;text-transform:uppercase;}
        .total-section{text-align:right;margin-top:20px;padding:20px;background:#0D1F35;border-radius:8px;}
        .total-label{font-size:14px;color:#A0B4C8;}
        .total-value{font-size:28px;font-weight:bold;color:#D4AF37;margin-top:4px;}
        .note{margin-top:20px;padding:15px;background:#0D1F35;border-radius:8px;border-left:4px solid #D4AF37;}
        .note-text{font-size:12px;color:#A0B4C8;}
        .footer{margin-top:40px;text-align:center;padding-top:20px;border-top:1px solid #1E3A5F;}
        .footer-text{font-size:11px;color:#6B7F94;}
        .footer-brand{font-size:13px;color:#D4AF37;margin-top:4px;}
      </style></head><body>
        <div class="header">
          <div><div class="logo">NH GOODS</div><div class="company">NH QUALITY GOODS LLC</div><div class="tagline">Hamzah Marsoomi | Owner</div></div>
          <div><div class="invoice-title">INVOICE</div><div class="invoice-num">${invoiceNumber}</div><div class="invoice-num">${date}</div></div>
        </div>
        <div class="info-grid">
          <div class="info-box">
            <div class="info-label">Bill To</div>
            <div class="info-value">${selectedCustomer.name}</div>
            <div class="info-value" style="font-size:12px;color:#A0B4C8;">${selectedCustomer.shop_name || ''}</div>
            <div class="info-value" style="font-size:12px;color:#A0B4C8;">${selectedCustomer.shop_address || ''}</div>
            <div class="info-value" style="font-size:12px;color:#A0B4C8;">Phone: ${selectedCustomer.phone_number || ''}</div>
            ${selectedCustomer.ein_number ? `<div class="info-value" style="font-size:12px;color:#A0B4C8;">EIN: ${selectedCustomer.ein_number}</div>` : ''}
          </div>
          <div class="info-box">
            <div class="info-label">From</div>
            <div class="info-value">Hamzah Marsoomi</div>
            <div class="info-value" style="font-size:12px;color:#A0B4C8;">NH QUALITY GOODS LLC</div>
            <div class="info-value" style="font-size:12px;color:#A0B4C8;">Hooksett, NH</div>
            <div class="info-value" style="font-size:12px;color:#A0B4C8;">Phone: (603) 461-1441</div>
          </div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Product</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Price</th><th style="text-align:right;">Total</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <div class="total-section">
          <div class="total-label">Delivery: FREE</div>
          <div class="total-label" style="margin-top:8px;">Grand Total</div>
          <div class="total-value">$${total.toFixed(2)}</div>
        </div>
        ${invoiceNote ? `<div class="note"><div class="info-label">Notes</div><div class="note-text">${invoiceNote}</div></div>` : ''}
        <div class="footer">
          <div class="footer-text">Thank you for your business!</div>
          <div class="footer-brand">More than a supplier.. We are your growth partner.</div>
          <div class="footer-text" style="margin-top:8px;">Hamzah Marsoomi | NH QUALITY GOODS LLC | Hooksett, NH | (603) 461-1441</div>
        </div>
      </body></html>`;

      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: `Invoice ${invoiceNumber}` });
      await saveInvoiceNumber();
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to generate invoice');
    } finally { setGenerating(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Invoice Builder</Text>
          <Text style={s.headerSub}>NH QUALITY GOODS LLC</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {/* Invoice Number */}
        <View style={s.field}>
          <Text style={s.label}>Invoice Number</Text>
          <TextInput style={s.input} value={invoiceNumber} onChangeText={setInvoiceNumber} placeholderTextColor={COLORS.textMuted} />
        </View>

        {/* Customer */}
        <View style={s.field}>
          <Text style={s.label}>Customer</Text>
          <Pressable style={s.picker} onPress={() => setShowCustomerPicker(true)}>
            {selectedCustomer ? (
              <View>
                <Text style={s.pickerText}>{selectedCustomer.name}</Text>
                {selectedCustomer.shop_name && <Text style={s.pickerSub}>{selectedCustomer.shop_name}</Text>}
              </View>
            ) : (
              <Text style={s.pickerPlaceholder}>Select customer...</Text>
            )}
            <Ionicons name="chevron-down" size={20} color={COLORS.textMuted} />
          </Pressable>
        </View>

        {/* Items */}
        <View style={s.field}>
          <View style={s.itemsHeader}>
            <Text style={s.label}>Items</Text>
            <Pressable style={s.addItemBtn} onPress={() => setShowProductPicker(true)}>
              <Ionicons name="add" size={18} color={COLORS.deepNavy} />
              <Text style={s.addItemText}>Add from List</Text>
            </Pressable>
          </View>

          {items.length === 0 && (
            <Pressable style={s.emptyItems} onPress={() => setShowProductPicker(true)}>
              <Ionicons name="cart-outline" size={36} color={COLORS.textMuted} />
              <Text style={s.emptyItemsText}>Tap to add products</Text>
            </Pressable>
          )}

          {items.map((item, index) => (
            <View key={index} style={s.itemRow}>
              <View style={s.itemNameRow}>
                <Text style={s.itemNameText} numberOfLines={1}>{item.name}</Text>
                <Pressable style={s.removeItemBtn} onPress={() => removeItem(index)}>
                  <Ionicons name="close-circle" size={22} color={COLORS.error} />
                </Pressable>
              </View>
              <View style={s.itemDetailsRow}>
                <View style={s.qtyWrap}>
                  <Pressable style={s.qtyBtn} onPress={() => { const q = Math.max(1, (parseInt(item.qty) || 1) - 1); updateItem(index, 'qty', String(q)); }}>
                    <Ionicons name="remove" size={16} color={COLORS.textPrimary} />
                  </Pressable>
                  <TextInput style={s.qtyInput} value={item.qty} onChangeText={(v) => updateItem(index, 'qty', v)} keyboardType="number-pad" />
                  <Pressable style={s.qtyBtn} onPress={() => { const q = (parseInt(item.qty) || 0) + 1; updateItem(index, 'qty', String(q)); }}>
                    <Ionicons name="add" size={16} color={COLORS.textPrimary} />
                  </Pressable>
                </View>
                <Text style={s.itemPriceLabel}>× ${parseFloat(item.price).toFixed(2)}</Text>
                <Text style={s.itemTotal}>
                  ${((parseFloat(item.qty) || 0) * (parseFloat(item.price) || 0)).toFixed(2)}
                </Text>
              </View>
            </View>
          ))}
              </View>
            </View>
          ))}
        </View>

        {/* Notes */}
        <View style={s.field}>
          <Text style={s.label}>Notes (Optional)</Text>
          <TextInput style={[s.input, s.noteInput]} placeholder="Payment terms, delivery notes..."
            placeholderTextColor={COLORS.textMuted} value={invoiceNote} onChangeText={setInvoiceNote} multiline />
        </View>

        {/* Total */}
        <View style={s.totalCard}>
          <Text style={s.totalLabel}>Grand Total</Text>
          <Text style={s.totalValue}>${getTotal().toFixed(2)}</Text>
        </View>

        {/* Generate */}
        <Pressable style={[s.generateBtn, generating && s.generateBtnDisabled]} onPress={generatePDF} disabled={generating}>
          {generating ? <ActivityIndicator color={COLORS.deepNavy} /> : (
            <>
              <Ionicons name="document-text" size={22} color={COLORS.deepNavy} />
              <Text style={s.generateBtnText}>Generate & Share PDF</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Customer Picker */}
      <Modal visible={showCustomerPicker} transparent animationType="slide" onRequestClose={() => setShowCustomerPicker(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Customer</Text>
              <Pressable onPress={() => setShowCustomerPicker(false)}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></Pressable>
            </View>
            <FlatList data={customers} keyExtractor={(c) => c.id} renderItem={({ item }) => (
              <Pressable style={s.modalItem} onPress={() => { setSelectedCustomer(item); setShowCustomerPicker(false); }}>
                <Text style={s.modalItemName}>{item.name}</Text>
                {item.shop_name && <Text style={s.modalItemSub}>{item.shop_name}</Text>}
              </Pressable>
            )} />
          </View>
        </View>
      </Modal>

      {/* Product Picker */}
      <Modal visible={showProductPicker} transparent animationType="slide" onRequestClose={() => setShowProductPicker(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Select Product</Text>
              <Pressable onPress={() => setShowProductPicker(false)}><Ionicons name="close" size={24} color={COLORS.textPrimary} /></Pressable>
            </View>
            <FlatList data={products} keyExtractor={(p) => p.id} renderItem={({ item }) => (
              <Pressable style={s.modalItem} onPress={() => selectProduct(item)}>
                <View style={s.modalItemLeft}>
                  <Text style={s.modalItemName}>{item.name}</Text>
                  {item.description && <Text style={s.modalItemDesc}>{item.description}</Text>}
                </View>
                <Text style={s.modalItemPrice}>${(item.wholesale_price || item.price).toFixed(2)}</Text>
              </Pressable>
            )} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  backBtn: { padding: SPACING.sm, marginRight: SPACING.sm },
  headerText: { flex: 1 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  content: { paddingHorizontal: SPACING.xl, paddingBottom: 40 },
  field: { marginBottom: SPACING.lg },
  label: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: SPACING.sm },
  input: { backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  picker: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg },
  pickerText: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: '600' },
  pickerSub: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  pickerPlaceholder: { fontSize: FONTS.sizes.md, color: COLORS.textMuted },
  itemsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.sm },
  addItemBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: COLORS.royalGold, paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: BORDER_RADIUS.sm },
  addItemText: { fontSize: FONTS.sizes.xs, fontWeight: 'bold', color: COLORS.deepNavy },
  emptyItems: { alignItems: 'center', padding: SPACING.xxl, backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.lg, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed' },
  emptyItemsText: { color: COLORS.textMuted, marginTop: SPACING.sm },
  itemRow: { backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginBottom: SPACING.sm },
  itemNameRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.sm },
  itemNameText: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: '600', color: COLORS.textPrimary },
  removeItemBtn: { padding: 4 },
  itemDetailsRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.sm },
  qtyBtn: { padding: SPACING.sm },
  qtyInput: { width: 40, textAlign: 'center', fontSize: FONTS.sizes.md, color: COLORS.textPrimary, fontWeight: 'bold' },
  itemPriceLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary },
  itemTotal: { flex: 1, fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.royalGold, textAlign: 'right' },
  noteInput: { minHeight: 70, textAlignVertical: 'top' },
  totalCard: { backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, alignItems: 'center', marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.royalGold + '40' },
  totalLabel: { fontSize: FONTS.sizes.sm, color: COLORS.textMuted },
  totalValue: { fontSize: 36, fontWeight: 'bold', color: COLORS.royalGold, marginTop: SPACING.xs },
  generateBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.royalGold, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.md, gap: SPACING.sm },
  generateBtnDisabled: { opacity: 0.7 },
  generateBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.xl, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.textPrimary },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  modalItemLeft: { flex: 1 },
  modalItemName: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  modalItemDesc: { fontSize: FONTS.sizes.xs, color: COLORS.textMuted, marginTop: 2 },
  modalItemSub: { fontSize: FONTS.sizes.xs, color: COLORS.royalGold, marginTop: 2 },
  modalItemPrice: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.royalGold }
});
