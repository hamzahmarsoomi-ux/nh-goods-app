import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image,
  Alert, ActivityIndicator, Modal, TextInput, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../src/utils/theme';
import { useTranslation } from '../src/hooks/useTranslation';
import { createInquiry } from '../src/utils/api';

const INQUIRY_TYPES = [
  { id: 'availability', icon: 'checkmark-circle-outline', label: 'Is this item in stock?', color: COLORS.success },
  { id: 'pricing', icon: 'pricetag-outline', label: 'What is the wholesale price?', color: COLORS.royalGold },
  { id: 'request', icon: 'storefront-outline', label: 'Can you source this product?', color: COLORS.info }
];

export default function SnapAskScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showOptions, setShowOptions] = useState(false);
  const [sending, setSending] = useState(false);
  const [extraMessage, setExtraMessage] = useState('');
  const [sent, setSent] = useState(false);

  const pickImage = async (useCamera: boolean) => {
    const permFn = useCamera
      ? ImagePicker.requestCameraPermissionsAsync
      : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Please allow access to continue.');
      return;
    }
    const fn = useCamera ? ImagePicker.launchCameraAsync : ImagePicker.launchImageLibraryAsync;
    const result = await fn({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.5,
      base64: true
    });
    if (!result.canceled && result.assets[0]) {
      setImageBase64(result.assets[0].base64 || '');
      setImageUri(result.assets[0].uri);
      setShowOptions(true);
      setSent(false);
    }
  };

  const submitInquiry = async (type: string) => {
    if (!imageBase64) return;
    setSending(true);
    try {
      await createInquiry({ image_base64: imageBase64, inquiry_type: type, message: extraMessage || undefined });
      setSent(true);
      setShowOptions(false);
      Alert.alert(t('success'), 'Inquiry sent! You will receive a reply soon.');
    } catch (e) {
      Alert.alert(t('error'), 'Failed to send inquiry.');
    } finally {
      setSending(false);
    }
  };

  const reset = () => {
    setImageBase64(null); setImageUri(null);
    setShowOptions(false); setSent(false); setExtraMessage('');
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Snap & Ask</Text>
          <Text style={s.headerSub}>NH QUALITY GOODS LLC</Text>
        </View>
      </View>

      {!imageUri ? (
        <View style={s.captureArea}>
          <View style={s.iconCircle}>
            <Ionicons name="camera" size={56} color={COLORS.royalGold} />
          </View>
          <Text style={s.captureTitle}>Take a Photo or Upload</Text>
          <Text style={s.captureSub}>Snap a product and ask about price, availability, or sourcing</Text>
          <View style={s.btnRow}>
            <Pressable testID="snap-camera-btn" style={s.primaryBtn} onPress={() => pickImage(true)}>
              <Ionicons name="camera" size={22} color={COLORS.deepNavy} />
              <Text style={s.primaryBtnText}>Camera</Text>
            </Pressable>
            <Pressable testID="snap-gallery-btn" style={s.secondaryBtn} onPress={() => pickImage(false)}>
              <Ionicons name="images" size={22} color={COLORS.royalGold} />
              <Text style={s.secondaryBtnText}>Gallery</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <View style={s.previewArea}>
          <Image source={{ uri: imageUri }} style={s.previewImage} resizeMode="cover" />
          {sent && (
            <View style={s.sentBanner}>
              <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
              <Text style={s.sentText}>Inquiry sent!</Text>
            </View>
          )}
          <View style={s.retakeRow}>
            <Pressable style={s.retakeBtn} onPress={reset}>
              <Ionicons name="refresh" size={18} color={COLORS.textPrimary} />
              <Text style={s.retakeBtnText}>New Photo</Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Inquiry Options Modal */}
      <Modal visible={showOptions} transparent animationType="slide" onRequestClose={() => setShowOptions(false)}>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>What would you like to know?</Text>
              <Pressable onPress={() => setShowOptions(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>
            {INQUIRY_TYPES.map((opt) => (
              <Pressable
                testID={`inquiry-${opt.id}`}
                key={opt.id}
                style={s.optionBtn}
                onPress={() => submitInquiry(opt.id)}
                disabled={sending}
              >
                <View style={[s.optionIcon, { backgroundColor: opt.color + '20' }]}>
                  <Ionicons name={opt.icon as any} size={24} color={opt.color} />
                </View>
                <Text style={s.optionLabel}>{opt.label}</Text>
                {sending ? <ActivityIndicator size="small" color={opt.color} /> : (
                  <Ionicons name="chevron-forward" size={20} color={COLORS.textMuted} />
                )}
              </Pressable>
            ))}
            <TextInput
              style={s.extraInput}
              placeholder="Add a note (optional)..."
              placeholderTextColor={COLORS.textMuted}
              value={extraMessage}
              onChangeText={setExtraMessage}
            />
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
  captureArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: SPACING.xl },
  iconCircle: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.cardBackground, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl, borderWidth: 2, borderColor: COLORS.royalGold },
  captureTitle: { fontSize: FONTS.sizes.xl, fontWeight: 'bold', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  captureSub: { fontSize: FONTS.sizes.sm, color: COLORS.textSecondary, textAlign: 'center', marginBottom: SPACING.xxxl },
  btnRow: { flexDirection: 'row', gap: SPACING.md },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.royalGold, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl, borderRadius: BORDER_RADIUS.md },
  primaryBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.cardBackground, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.royalGold },
  secondaryBtnText: { color: COLORS.royalGold, fontSize: FONTS.sizes.md, fontWeight: '600' },
  previewArea: { flex: 1, paddingHorizontal: SPACING.xl },
  previewImage: { width: '100%', height: 300, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md },
  sentBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, backgroundColor: COLORS.success + '20', padding: SPACING.md, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md },
  sentText: { color: COLORS.success, fontWeight: 'bold', fontSize: FONTS.sizes.md },
  retakeRow: { alignItems: 'center' },
  retakeBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs, backgroundColor: COLORS.cardBackground, padding: SPACING.md, borderRadius: BORDER_RADIUS.md },
  retakeBtnText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.sm },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.cardBackground, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.textPrimary },
  optionBtn: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg, backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.md, gap: SPACING.md },
  optionIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  optionLabel: { flex: 1, fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  extraInput: { backgroundColor: COLORS.inputBackground, borderRadius: BORDER_RADIUS.md, padding: SPACING.lg, color: COLORS.textPrimary, fontSize: FONTS.sizes.md, marginTop: SPACING.sm }
});
