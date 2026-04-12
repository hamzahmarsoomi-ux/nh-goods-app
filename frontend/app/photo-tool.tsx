import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Image, Alert, ActivityIndicator,
  Dimensions, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../src/utils/theme';

const SCREEN_W = Dimensions.get('window').width;
const CROP_SIZE = SCREEN_W - 60;

type CropRatio = { label: string; w: number; h: number };
const RATIOS: CropRatio[] = [
  { label: '1:1', w: 1, h: 1 },
  { label: '4:3', w: 4, h: 3 },
  { label: '3:4', w: 3, h: 4 },
  { label: '16:9', w: 16, h: 9 },
];

export default function PhotoToolScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ returnTo?: string }>();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [selectedRatio, setSelectedRatio] = useState<CropRatio>(RATIOS[0]);

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8, allowsEditing: false
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setRotation(0);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission needed'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'], quality: 0.8, allowsEditing: false
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setRotation(0);
    }
  };

  const handleRotate = async () => {
    if (!imageUri) return;
    setProcessing(true);
    try {
      const newRotation = (rotation + 90) % 360;
      const result = await manipulateAsync(imageUri, [{ rotate: 90 }], { format: SaveFormat.JPEG, compress: 0.8 });
      setImageUri(result.uri);
      setRotation(newRotation);
    } catch (e) { console.error(e); }
    finally { setProcessing(false); }
  };

  const handleCropAndFinish = async () => {
    if (!imageUri) return;
    setProcessing(true);
    try {
      // Resize to standard size with selected ratio
      const targetW = 800;
      const targetH = Math.round(targetW * (selectedRatio.h / selectedRatio.w));

      const result = await manipulateAsync(
        imageUri,
        [{ resize: { width: targetW, height: targetH } }],
        { format: SaveFormat.JPEG, compress: 0.7, base64: true }
      );

      setImageBase64(result.base64 || null);
      setImageUri(result.uri);

      // Store in global state for retrieval
      if (global as any) {
        (global as any).__photoToolResult = {
          base64: result.base64,
          uri: result.uri
        };
      }

      Alert.alert('Done!', 'Photo processed. Go back to use it.', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (e) {
      Alert.alert('Error', 'Failed to process image');
      console.error(e);
    } finally { setProcessing(false); }
  };

  const handleAutoCorrect = async () => {
    if (!imageUri) return;
    setProcessing(true);
    try {
      // Auto-enhance: crop to square center + resize
      const result = await manipulateAsync(
        imageUri,
        [{ resize: { width: 800, height: 800 } }],
        { format: SaveFormat.JPEG, compress: 0.7, base64: true }
      );
      setImageUri(result.uri);
      setImageBase64(result.base64 || null);
    } catch (e) { console.error(e); }
    finally { setProcessing(false); }
  };

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={s.headerText}>
          <Text style={s.headerTitle}>Photo Tool</Text>
          <Text style={s.headerSub}>Crop, Rotate & Enhance</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        {!imageUri ? (
          /* Capture Screen */
          <View style={s.captureArea}>
            <View style={s.guideFrame}>
              <View style={s.cornerTL} /><View style={s.cornerTR} />
              <View style={s.cornerBL} /><View style={s.cornerBR} />
              <Ionicons name="cube-outline" size={60} color={COLORS.royalGold + '40'} />
              <Text style={s.guideText}>Place product here</Text>
            </View>

            <Text style={s.tipText}>Tips: Use good lighting, plain background</Text>

            <View style={s.captureButtons}>
              <Pressable testID="photo-camera-btn" style={s.primaryBtn} onPress={takePhoto}>
                <Ionicons name="camera" size={24} color={COLORS.deepNavy} />
                <Text style={s.primaryBtnText}>Camera</Text>
              </Pressable>
              <Pressable testID="photo-gallery-btn" style={s.secondaryBtn} onPress={pickFromGallery}>
                <Ionicons name="images" size={24} color={COLORS.royalGold} />
                <Text style={s.secondaryBtnText}>Gallery</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          /* Editor Screen */
          <View style={s.editorArea}>
            {/* Preview */}
            <View style={s.previewContainer}>
              <Image source={{ uri: imageUri }} style={s.previewImage} resizeMode="contain" />
              {processing && (
                <View style={s.processingOverlay}>
                  <ActivityIndicator size="large" color={COLORS.royalGold} />
                </View>
              )}
            </View>

            {/* Ratio Selector */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Aspect Ratio</Text>
              <View style={s.ratioRow}>
                {RATIOS.map((r) => (
                  <Pressable
                    key={r.label}
                    style={[s.ratioBtn, selectedRatio.label === r.label && s.ratioBtnActive]}
                    onPress={() => setSelectedRatio(r)}
                  >
                    <Text style={[s.ratioText, selectedRatio.label === r.label && s.ratioTextActive]}>{r.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Tools */}
            <View style={s.section}>
              <Text style={s.sectionTitle}>Tools</Text>
              <View style={s.toolsRow}>
                <Pressable style={s.toolBtn} onPress={handleRotate} disabled={processing}>
                  <Ionicons name="refresh" size={22} color={COLORS.royalGold} />
                  <Text style={s.toolText}>Rotate</Text>
                </Pressable>
                <Pressable style={s.toolBtn} onPress={handleAutoCorrect} disabled={processing}>
                  <Ionicons name="color-wand" size={22} color={COLORS.royalGold} />
                  <Text style={s.toolText}>Auto Fix</Text>
                </Pressable>
                <Pressable style={s.toolBtn} onPress={() => { setImageUri(null); setImageBase64(null); setRotation(0); }}>
                  <Ionicons name="trash" size={22} color={COLORS.error} />
                  <Text style={[s.toolText, { color: COLORS.error }]}>Reset</Text>
                </Pressable>
              </View>
            </View>

            {/* Save Button */}
            <Pressable
              testID="photo-save-btn"
              style={[s.saveBtn, processing && s.saveBtnDisabled]}
              onPress={handleCropAndFinish}
              disabled={processing}
            >
              {processing ? <ActivityIndicator color={COLORS.deepNavy} /> : (
                <>
                  <Ionicons name="checkmark-circle" size={22} color={COLORS.deepNavy} />
                  <Text style={s.saveBtnText}>Use This Photo</Text>
                </>
              )}
            </Pressable>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const CORNER = { position: 'absolute' as const, width: 30, height: 30, borderColor: COLORS.royalGold };

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.xl, paddingTop: SPACING.md, paddingBottom: SPACING.lg },
  backBtn: { padding: SPACING.sm, marginRight: SPACING.sm },
  headerText: { flex: 1 },
  headerTitle: { fontSize: FONTS.sizes.xxl, fontWeight: 'bold', color: COLORS.textPrimary },
  headerSub: { fontSize: FONTS.sizes.sm, color: COLORS.royalGold },
  content: { paddingHorizontal: SPACING.xl, paddingBottom: SPACING.xxxl },

  // Capture
  captureArea: { alignItems: 'center', paddingTop: SPACING.xl },
  guideFrame: {
    width: CROP_SIZE, height: CROP_SIZE, backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg, alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.xl, borderWidth: 2, borderColor: COLORS.border, borderStyle: 'dashed'
  },
  cornerTL: { ...CORNER, top: -2, left: -2, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: BORDER_RADIUS.lg },
  cornerTR: { ...CORNER, top: -2, right: -2, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: BORDER_RADIUS.lg },
  cornerBL: { ...CORNER, bottom: -2, left: -2, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: BORDER_RADIUS.lg },
  cornerBR: { ...CORNER, bottom: -2, right: -2, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: BORDER_RADIUS.lg },
  guideText: { color: COLORS.textMuted, marginTop: SPACING.md, fontSize: FONTS.sizes.sm },
  tipText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: SPACING.xl, textAlign: 'center' },
  captureButtons: { flexDirection: 'row', gap: SPACING.md },
  primaryBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.royalGold, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl, borderRadius: BORDER_RADIUS.md },
  primaryBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.md, fontWeight: 'bold' },
  secondaryBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.cardBackground, paddingVertical: SPACING.lg, paddingHorizontal: SPACING.xxl, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.royalGold },
  secondaryBtnText: { color: COLORS.royalGold, fontSize: FONTS.sizes.md, fontWeight: '600' },

  // Editor
  editorArea: { flex: 1 },
  previewContainer: { position: 'relative', width: '100%', height: 300, backgroundColor: COLORS.cardBackground, borderRadius: BORDER_RADIUS.lg, overflow: 'hidden', marginBottom: SPACING.lg },
  previewImage: { width: '100%', height: '100%' },
  processingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },

  section: { marginBottom: SPACING.lg },
  sectionTitle: { fontSize: FONTS.sizes.sm, fontWeight: 'bold', color: COLORS.textSecondary, marginBottom: SPACING.sm, textTransform: 'uppercase', letterSpacing: 1 },
  ratioRow: { flexDirection: 'row', gap: SPACING.sm },
  ratioBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: BORDER_RADIUS.full, backgroundColor: COLORS.cardBackground, borderWidth: 1, borderColor: COLORS.border },
  ratioBtnActive: { backgroundColor: COLORS.royalGold, borderColor: COLORS.royalGold },
  ratioText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '600' },
  ratioTextActive: { color: COLORS.deepNavy },

  toolsRow: { flexDirection: 'row', gap: SPACING.md },
  toolBtn: { flex: 1, alignItems: 'center', backgroundColor: COLORS.cardBackground, padding: SPACING.lg, borderRadius: BORDER_RADIUS.md, gap: SPACING.xs },
  toolText: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary, fontWeight: '600' },

  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.royalGold, paddingVertical: SPACING.lg, borderRadius: BORDER_RADIUS.md, gap: SPACING.sm, marginTop: SPACING.md },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { color: COLORS.deepNavy, fontSize: FONTS.sizes.md, fontWeight: 'bold' }
});
