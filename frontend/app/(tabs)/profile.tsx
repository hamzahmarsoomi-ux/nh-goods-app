import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { useAuthStore } from '../../src/store/authStore';
import { languageNames, Language } from '../../src/i18n/translations';
import { getInvoices, updateLocation } from '../../src/utils/api';

export default function ProfileScreen() {
  const { t, rtl, language } = useTranslation();
  const router = useRouter();
  const { user, logout, setLanguage, updateProfile } = useAuthStore();
  
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'checking' | 'at_shop' | 'away' | 'disabled'>('checking');
  
  useEffect(() => {
    loadInvoices();
    checkLocation();
  }, []);
  
  const loadInvoices = async () => {
    try {
      const res = await getInvoices();
      setInvoices(res.data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoadingInvoices(false);
    }
  };
  
  const checkLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationStatus('disabled');
        return;
      }
      
      const location = await Location.getCurrentPositionAsync({});
      const response = await updateLocation(
        location.coords.latitude,
        location.coords.longitude
      );
      
      setLocationStatus(response.data.is_at_shop ? 'at_shop' : 'away');
    } catch (error) {
      console.error('Error checking location:', error);
      setLocationStatus('disabled');
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      t('logout'),
      'Are you sure you want to logout?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          }
        }
      ]
    );
  };
  
  const handleLanguageSelect = (lang: Language) => {
    setLanguage(lang);
    setShowLanguagePicker(false);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{t('myProfile')}</Text>
          <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
        </View>
        
        {/* User Info Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {user?.name?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
            {user?.is_admin && (
              <View style={styles.adminBadge}>
                <Ionicons name="shield-checkmark" size={12} color={COLORS.white} />
              </View>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user?.name}</Text>
            <Text style={styles.userPhone}>{user?.phone_number}</Text>
            {user?.shop_name && (
              <View style={styles.shopInfo}>
                <Ionicons name="storefront-outline" size={14} color={COLORS.royalGold} />
                <Text style={styles.shopName}>{user.shop_name}</Text>
              </View>
            )}
          </View>
        </View>
        
        {/* Language Selector */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('language')}</Text>
          <Pressable
            style={styles.languageSelector}
            onPress={() => setShowLanguagePicker(!showLanguagePicker)}
          >
            <View style={styles.languageLeft}>
              <Ionicons name="globe-outline" size={20} color={COLORS.royalGold} />
              <Text style={styles.languageText}>{languageNames[language]}</Text>
            </View>
            <Ionicons
              name={showLanguagePicker ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={COLORS.textMuted}
            />
          </Pressable>
          
          {showLanguagePicker && (
            <View style={styles.languageOptions}>
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <Pressable
                  key={lang}
                  style={[
                    styles.languageOption,
                    language === lang && styles.languageOptionActive
                  ]}
                  onPress={() => handleLanguageSelect(lang)}
                >
                  <Text style={[
                    styles.languageOptionText,
                    language === lang && styles.languageOptionTextActive
                  ]}>
                    {languageNames[lang]}
                  </Text>
                  {language === lang && (
                    <Ionicons name="checkmark" size={18} color={COLORS.deepNavy} />
                  )}
                </Pressable>
              ))}
            </View>
          )}
        </View>
        
        {/* Digital Invoice Vault */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('digitalInvoiceVault')}</Text>
          {loadingInvoices ? (
            <ActivityIndicator color={COLORS.royalGold} />
          ) : invoices.length === 0 ? (
            <View style={styles.noInvoices}>
              <Ionicons name="document-outline" size={40} color={COLORS.textMuted} />
              <Text style={styles.noInvoicesText}>{t('noInvoices')}</Text>
            </View>
          ) : (
            invoices.slice(0, 3).map((invoice) => (
              <View key={invoice.id} style={styles.invoiceCard}>
                <View style={styles.invoiceInfo}>
                  <Text style={styles.invoiceId}>Invoice #{invoice.id.slice(-8).toUpperCase()}</Text>
                  <Text style={styles.invoiceDate}>
                    {new Date(invoice.date).toLocaleDateString()}
                  </Text>
                </View>
                <View style={styles.invoiceRight}>
                  <Text style={styles.invoiceTotal}>${invoice.total.toFixed(2)}</Text>
                  <Pressable style={styles.downloadButton}>
                    <Ionicons name="download-outline" size={18} color={COLORS.royalGold} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </View>
        
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          {user?.is_admin && (
            <Pressable
              style={styles.actionButton}
              onPress={() => router.push('/admin')}
            >
              <Ionicons name="settings-outline" size={20} color={COLORS.royalGold} />
              <Text style={styles.actionButtonText}>{t('adminPanel')}</Text>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </Pressable>
          )}
          
          <Pressable style={styles.actionButton} onPress={() => router.push('/orders')}>
            <Ionicons name="receipt-outline" size={20} color={COLORS.royalGold} />
            <Text style={styles.actionButtonText}>{t('orderHistory')}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
          </Pressable>
          
          <Pressable style={[styles.actionButton, styles.logoutButton]} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
            <Text style={[styles.actionButtonText, styles.logoutText]}>{t('logout')}</Text>
            <Ionicons name="chevron-forward" size={18} color={COLORS.error} />
          </Pressable>
        </View>
        
        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerCompany}>NH QUALITY GOODS LLC</Text>
          <Text style={styles.footerTagline}>Vision & Faith | الرؤية والإيمان</Text>
          <Text style={styles.footerLocation}>634 Montgomery St, Manchester, NH 03102</Text>
        </View>
        
        {/* About Us */}
        <View style={styles.aboutSection}>
          <View style={styles.aboutHeader}>
            <Ionicons name="business-outline" size={22} color={COLORS.royalGold} />
            <Text style={styles.aboutTitle}>About Us</Text>
          </View>
          <Text style={styles.aboutText}>
            More than a supplier.. We are your growth partner.
          </Text>
          <View style={styles.aboutDivider} />
          <Text style={styles.aboutText}>
            NH Quality Goods LLC is your strategic sourcing and delivery partner. We bridge the gap between global manufacturers and your business, bringing world-class products directly to your doorstep.
          </Text>
          <Text style={styles.aboutText}>
            We value your time. That's why we specialize in supplying the world's most in-demand products and global brands. Our mission is to streamline your supply chain, allowing you to focus on growth while we handle the logistics of quality and excellence.
          </Text>
          <View style={styles.aboutValues}>
            <View style={styles.aboutValueItem}>
              <Ionicons name="globe-outline" size={18} color={COLORS.royalGold} />
              <Text style={styles.aboutValueText}>Global Sourcing</Text>
            </View>
            <View style={styles.aboutValueItem}>
              <Ionicons name="car-outline" size={18} color={COLORS.royalGold} />
              <Text style={styles.aboutValueText}>Direct Delivery</Text>
            </View>
            <View style={styles.aboutValueItem}>
              <Ionicons name="diamond-outline" size={18} color={COLORS.royalGold} />
              <Text style={styles.aboutValueText}>Quality & Excellence</Text>
            </View>
          </View>
        </View>
        
        <View style={{ height: 30 }} />
      </ScrollView>
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
    paddingBottom: SPACING.lg
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
  userCard: {
    backgroundColor: COLORS.cardBackground,
    marginHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
    ...SHADOWS.medium
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.royalGold,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.deepNavy
  },
  adminBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.success,
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.cardBackground
  },
  userInfo: {
    alignItems: 'center'
  },
  userName: {
    fontSize: FONTS.sizes.xl,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  userPhone: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.sm
  },
  shopName: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.royalGold
  },
  locationContainer: {
    marginTop: SPACING.lg
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.inputBackground
  },
  locationAtShop: {
    backgroundColor: COLORS.success + '20'
  },
  locationAway: {
    backgroundColor: COLORS.warning + '20'
  },
  locationDisabled: {
    backgroundColor: COLORS.inputBackground
  },
  locationText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textMuted
  },
  locationTextAtShop: {
    color: COLORS.success
  },
  locationTextAway: {
    color: COLORS.warning
  },
  section: {
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl
  },
  sectionTitle: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md
  },
  languageLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md
  },
  languageText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary
  },
  languageOptions: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
    overflow: 'hidden'
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border
  },
  languageOptionActive: {
    backgroundColor: COLORS.royalGold
  },
  languageOptionText: {
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary
  },
  languageOptionTextActive: {
    color: COLORS.deepNavy,
    fontWeight: 'bold'
  },
  noInvoices: {
    alignItems: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.md
  },
  noInvoicesText: {
    color: COLORS.textMuted,
    marginTop: SPACING.sm
  },
  invoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm
  },
  invoiceInfo: {
    flex: 1
  },
  invoiceId: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600',
    color: COLORS.textPrimary
  },
  invoiceDate: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: 2
  },
  invoiceRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md
  },
  invoiceTotal: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.royalGold
  },
  downloadButton: {
    padding: SPACING.sm,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.sm
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.cardBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
    gap: SPACING.md
  },
  actionButtonText: {
    flex: 1,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary
  },
  logoutButton: {
    borderWidth: 1,
    borderColor: COLORS.error + '30'
  },
  logoutText: {
    color: COLORS.error
  },
  footer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    marginHorizontal: SPACING.xl
  },
  footerCompany: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.royalGold
  },
  footerTagline: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs
  },
  footerLocation: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    marginTop: SPACING.xs
  },
  aboutSection: {
    marginHorizontal: SPACING.xl,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.royalGold + '20'
  },
  aboutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md
  },
  aboutTitle: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.royalGold
  },
  aboutDivider: {
    height: 1,
    backgroundColor: COLORS.royalGold + '30',
    marginBottom: SPACING.lg
  },
  aboutText: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 22,
    marginBottom: SPACING.md
  },
  aboutValues: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.sm
  },
  aboutValueItem: {
    alignItems: 'center',
    gap: SPACING.xs
  },
  aboutValueText: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.textMuted,
    fontWeight: '600'
  }
});
