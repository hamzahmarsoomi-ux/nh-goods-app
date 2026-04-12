import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { COLORS, FONTS, SPACING, BORDER_RADIUS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { languageNames, Language } from '../../src/i18n/translations';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError, setLanguage, language } = useAuthStore();
  const { t, rtl } = useTranslation();
  
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  
  const handleLogin = async () => {
    if (!phone.trim() || !pin.trim()) {
      Alert.alert('Error', 'Please enter phone number and PIN');
      return;
    }
    
    clearError();
    const success = await login(phone.trim(), pin.trim());
    
    if (success) {
      router.replace('/(tabs)');
    }
  };
  
  const selectLanguage = (lang: Language) => {
    setLanguage(lang);
    setShowLangPicker(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Language Selector */}
          <Pressable style={styles.langButton} onPress={() => setShowLangPicker(!showLangPicker)}>
            <Ionicons name="globe-outline" size={20} color={COLORS.royalGold} />
            <Text style={styles.langButtonText}>{languageNames[language]}</Text>
            <Ionicons name="chevron-down" size={16} color={COLORS.textSecondary} />
          </Pressable>
          
          {showLangPicker && (
            <View style={styles.langPicker}>
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <Pressable
                  key={lang}
                  style={[
                    styles.langOption,
                    language === lang && styles.langOptionActive
                  ]}
                  onPress={() => selectLanguage(lang)}
                >
                  <Text style={[
                    styles.langOptionText,
                    language === lang && styles.langOptionTextActive
                  ]}>
                    {languageNames[lang]}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
          
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Text style={styles.logoText}>NH</Text>
            </View>
            <Text style={styles.appName}>NH GOODS</Text>
            <Text style={styles.subtitle}>{t('login')}</Text>
          </View>
          
          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="call-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, rtl && styles.inputRTL]}
                placeholder={t('enterPhone')}
                placeholderTextColor={COLORS.textMuted}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, rtl && styles.inputRTL]}
                placeholder={t('enterPin')}
                placeholderTextColor={COLORS.textMuted}
                value={pin}
                onChangeText={setPin}
                secureTextEntry={!showPin}
                keyboardType="number-pad"
              />
              <Pressable onPress={() => setShowPin(!showPin)} style={styles.eyeButton}>
                <Ionicons
                  name={showPin ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color={COLORS.textMuted}
                />
              </Pressable>
            </View>
            
            {error && (
              <View style={styles.errorContainer}>
                <Ionicons name="alert-circle" size={18} color={COLORS.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
            
            <Pressable
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.deepNavy} />
              ) : (
                <Text style={styles.loginButtonText}>{t('loginButton')}</Text>
              )}
            </Pressable>
          </View>
          
          {/* Info */}
          <View style={styles.infoContainer}>
            <Ionicons name="information-circle-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.infoText}>
              Private access only. Contact admin for account creation.
            </Text>
          </View>
          
          {/* Demo Credentials */}
          <View style={styles.demoContainer}>
            <Text style={styles.demoTitle}>Demo Credentials:</Text>
            <Text style={styles.demoText}>Admin: 19971997 / 181818</Text>
            <Text style={styles.demoText}>Customer: 9876543210 / 5678</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  keyboardView: {
    flex: 1
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: SPACING.xs,
    padding: SPACING.sm,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md
  },
  langButtonText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.sm
  },
  langPicker: {
    position: 'absolute',
    top: 60,
    right: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 100,
    overflow: 'hidden'
  },
  langOption: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg
  },
  langOptionActive: {
    backgroundColor: COLORS.royalGold
  },
  langOptionText: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.md
  },
  langOptionTextActive: {
    color: COLORS.deepNavy,
    fontWeight: 'bold'
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: SPACING.xxxl,
    marginBottom: SPACING.xxxl
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.navyBlue,
    borderWidth: 3,
    borderColor: COLORS.royalGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: COLORS.royalGold
  },
  appName: {
    fontSize: FONTS.sizes.title,
    fontWeight: 'bold',
    color: COLORS.royalGold,
    marginBottom: SPACING.xs
  },
  subtitle: {
    fontSize: FONTS.sizes.lg,
    color: COLORS.textSecondary
  },
  form: {
    gap: SPACING.lg
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: SPACING.lg
  },
  inputIcon: {
    marginRight: SPACING.sm
  },
  input: {
    flex: 1,
    paddingVertical: SPACING.lg,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary
  },
  inputRTL: {
    textAlign: 'right'
  },
  eyeButton: {
    padding: SPACING.sm
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONTS.sizes.sm
  },
  loginButton: {
    backgroundColor: COLORS.royalGold,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md
  },
  loginButtonDisabled: {
    opacity: 0.7
  },
  loginButtonText: {
    color: COLORS.deepNavy,
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold'
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.xxxl,
    padding: SPACING.md,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.sm
  },
  infoText: {
    flex: 1,
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm
  },
  demoContainer: {
    marginTop: SPACING.xl,
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  demoTitle: {
    color: COLORS.royalGold,
    fontSize: FONTS.sizes.sm,
    fontWeight: 'bold',
    marginBottom: SPACING.sm
  },
  demoText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    marginBottom: SPACING.xs
  }
});
