import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, Pressable, TextInput,
  ActivityIndicator, KeyboardAvoidingView, Platform, Image, Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { format } from 'date-fns';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../src/utils/theme';
import { useAuthStore } from '../src/store/authStore';
import { getConversation, sendMessage } from '../src/utils/api';

export default function ChatScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ userId: string; userName: string }>();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAttach, setShowAttach] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => { loadMessages(); const iv = setInterval(loadMessages, 5000); return () => clearInterval(iv); }, []);

  const loadMessages = async () => {
    try {
      const res = await getConversation(params.userId || '');
      setMessages(res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendMessage({ receiver_id: params.userId || '', text: text.trim() });
      setText('');
      loadMessages();
    } catch (e) { Alert.alert('Error', 'Failed to send'); }
    finally { setSending(false); }
  };

  const pickImage = async () => {
    setShowAttach(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0]?.base64) {
      setSending(true);
      try {
        await sendMessage({
          receiver_id: params.userId || '',
          text: '📷 Image',
          file_base64: result.assets[0].base64,
          file_name: 'image.jpg',
          file_type: 'image'
        });
        loadMessages();
      } catch (e) { Alert.alert('Error', 'Failed to send image'); }
      finally { setSending(false); }
    }
  };

  const pickDocument = async () => {
    setShowAttach(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', '*/*'] });
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const base64 = await FileSystem.readAsStringAsync(asset.uri, { encoding: FileSystem.EncodingType.Base64 });
        setSending(true);
        const isPdf = asset.mimeType?.includes('pdf') || asset.name?.endsWith('.pdf');
        await sendMessage({
          receiver_id: params.userId || '',
          text: isPdf ? '📄 PDF Invoice' : `📎 ${asset.name}`,
          file_base64: base64,
          file_name: asset.name || 'file',
          file_type: isPdf ? 'pdf' : 'file'
        });
        loadMessages();
      }
    } catch (e) { Alert.alert('Error', 'Failed to send file'); }
    finally { setSending(false); }
  };

  const takePhoto = async () => {
    setShowAttach(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({ quality: 0.5, base64: true });
    if (!result.canceled && result.assets[0]?.base64) {
      setSending(true);
      try {
        await sendMessage({
          receiver_id: params.userId || '',
          text: '📷 Photo',
          file_base64: result.assets[0].base64,
          file_name: 'photo.jpg',
          file_type: 'image'
        });
        loadMessages();
      } catch (e) { Alert.alert('Error', 'Failed to send photo'); }
      finally { setSending(false); }
    }
  };

  const isMe = (msg: any) => msg.sender_id === user?.id;

  const renderMessage = ({ item }: { item: any }) => {
    const mine = isMe(item);
    return (
      <View style={[s.msgRow, mine && s.msgRowMine]}>
        <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleOther]}>
          {item.file_type === 'image' && item.file_base64 && (
            <Image source={{ uri: `data:image/jpeg;base64,${item.file_base64}` }} style={s.msgImage} resizeMode="cover" />
          )}
          {item.file_type === 'pdf' && (
            <View style={s.pdfBubble}>
              <Ionicons name="document-text" size={24} color={COLORS.error} />
              <Text style={s.pdfName}>{item.file_name}</Text>
            </View>
          )}
          {item.file_type === 'file' && !['image', 'pdf'].includes(item.file_type) && item.file_name && (
            <View style={s.pdfBubble}>
              <Ionicons name="attach" size={20} color={COLORS.royalGold} />
              <Text style={s.pdfName}>{item.file_name}</Text>
            </View>
          )}
          {item.text && !(item.file_type === 'image' && item.text === '📷 Image') && !(item.file_type === 'image' && item.text === '📷 Photo') && (
            <Text style={[s.msgText, mine && s.msgTextMine]}>{item.text}</Text>
          )}
          <View style={s.msgFooter}>
            <Text style={[s.msgTime, mine && s.msgTimeMine]}>
              {format(new Date(item.created_at), 'h:mm a')}
            </Text>
            {mine && user?.is_admin && (
              <Ionicons
                name={item.read ? 'checkmark-done' : 'checkmark'}
                size={14}
                color={item.read ? '#34B7F1' : (mine ? COLORS.deepNavy + '60' : COLORS.textMuted)}
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  if (loading) return (
    <SafeAreaView style={s.container}>
      <View style={s.center}><ActivityIndicator size="large" color={COLORS.royalGold} /></View>
    </SafeAreaView>
  );

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Pressable style={s.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </Pressable>
        <View style={s.headerAvatar}>
          <Text style={s.headerAvatarText}>{(params.userName || 'U').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={s.headerName}>{decodeURIComponent(params.userName || '')}</Text>
      </View>

      <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={s.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={s.emptyChat}>
              <Ionicons name="chatbubble-ellipses-outline" size={50} color={COLORS.textMuted} />
              <Text style={s.emptyChatText}>Start a conversation</Text>
            </View>
          }
        />

        {/* Attach Menu */}
        {showAttach && (
          <View style={s.attachMenu}>
            <Pressable testID="attach-photo" style={s.attachBtn} onPress={takePhoto}>
              <Ionicons name="camera" size={22} color={COLORS.royalGold} />
              <Text style={s.attachLabel}>Camera</Text>
            </Pressable>
            <Pressable testID="attach-image" style={s.attachBtn} onPress={pickImage}>
              <Ionicons name="images" size={22} color={COLORS.success} />
              <Text style={s.attachLabel}>Gallery</Text>
            </Pressable>
            <Pressable testID="attach-file" style={s.attachBtn} onPress={pickDocument}>
              <Ionicons name="document" size={22} color={COLORS.error} />
              <Text style={s.attachLabel}>PDF / File</Text>
            </Pressable>
          </View>
        )}

        {/* Input */}
        <View style={s.inputBar}>
          <Pressable testID="attach-toggle" style={s.attachToggle} onPress={() => setShowAttach(!showAttach)}>
            <Ionicons name={showAttach ? 'close' : 'attach'} size={24} color={COLORS.royalGold} />
          </Pressable>
          <TextInput
            style={s.textInput}
            placeholder="Type a message..."
            placeholderTextColor={COLORS.textMuted}
            value={text}
            onChangeText={setText}
            onSubmitEditing={handleSend}
          />
          <Pressable testID="send-btn" style={[s.sendBtn, (!text.trim() || sending) && s.sendBtnDisabled]} onPress={handleSend} disabled={!text.trim() || sending}>
            {sending ? <ActivityIndicator size="small" color={COLORS.deepNavy} /> :
              <Ionicons name="send" size={20} color={COLORS.deepNavy} />}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  flex: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  backBtn: { padding: SPACING.sm },
  headerAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.royalGold, alignItems: 'center', justifyContent: 'center', marginHorizontal: SPACING.sm },
  headerAvatarText: { fontSize: FONTS.sizes.md, fontWeight: 'bold', color: COLORS.deepNavy },
  headerName: { fontSize: FONTS.sizes.lg, fontWeight: 'bold', color: COLORS.textPrimary },
  msgList: { padding: SPACING.lg, paddingBottom: SPACING.xl },
  msgRow: { marginBottom: SPACING.sm, alignItems: 'flex-start' },
  msgRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '80%', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  bubbleMine: { backgroundColor: COLORS.royalGold, borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.cardBackground, borderBottomLeftRadius: 4 },
  msgText: { fontSize: FONTS.sizes.md, color: COLORS.textPrimary },
  msgTextMine: { color: COLORS.deepNavy },
  msgTime: { fontSize: 10, color: COLORS.textMuted, marginTop: 4 },
  msgTimeMine: { color: COLORS.deepNavy + '80' },
  msgFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4, marginTop: 4 },
  msgImage: { width: 200, height: 150, borderRadius: BORDER_RADIUS.md, marginBottom: SPACING.xs },
  pdfBubble: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, paddingVertical: SPACING.xs },
  pdfName: { fontSize: FONTS.sizes.sm, color: COLORS.textPrimary, flex: 1 },
  emptyChat: { alignItems: 'center', justifyContent: 'center', paddingTop: 150 },
  emptyChatText: { color: COLORS.textMuted, marginTop: SPACING.md },
  attachMenu: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: COLORS.cardBackground, paddingVertical: SPACING.lg, borderTopWidth: 1, borderTopColor: COLORS.border },
  attachBtn: { alignItems: 'center', gap: SPACING.xs },
  attachLabel: { fontSize: FONTS.sizes.xs, color: COLORS.textSecondary },
  inputBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: COLORS.navyBlue },
  attachToggle: { padding: SPACING.sm },
  textInput: { flex: 1, backgroundColor: COLORS.inputBackground, borderRadius: 20, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, fontSize: FONTS.sizes.md, color: COLORS.textPrimary, marginHorizontal: SPACING.sm },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.royalGold, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 }
});
