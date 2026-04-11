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
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, SPACING, BORDER_RADIUS, SHADOWS } from '../../src/utils/theme';
import { useTranslation } from '../../src/hooks/useTranslation';
import { getUsers, createUser, deleteUser, toggleUserStatus } from '../../src/utils/api';

export default function AdminUsersScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    phone_number: '',
    pin: '',
    name: '',
    shop_name: '',
    shop_address: ''
  });
  const [isCreating, setIsCreating] = useState(false);
  
  useEffect(() => {
    loadUsers();
  }, []);
  
  const loadUsers = async () => {
    try {
      const res = await getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadUsers();
  }, []);
  
  const handleCreateUser = async () => {
    if (!newUser.phone_number || !newUser.pin || !newUser.name) {
      Alert.alert('Error', 'Phone, PIN, and Name are required');
      return;
    }
    
    setIsCreating(true);
    try {
      await createUser(newUser);
      setShowAddModal(false);
      setNewUser({ phone_number: '', pin: '', name: '', shop_name: '', shop_address: '' });
      loadUsers();
      Alert.alert('Success', 'Customer created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };
  
  const handleDeleteUser = (userId: string, userName: string) => {
    Alert.alert(
      'Delete Customer',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(userId);
              loadUsers();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };
  
  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleUserStatus(userId);
      loadUsers();
    } catch (error) {
      Alert.alert('Error', 'Failed to update user status');
    }
  };
  
  const renderUser = ({ item }: { item: any }) => (
    <View style={styles.userCard}>
      <View style={styles.userHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{item.name}</Text>
            {item.is_admin && (
              <View style={styles.adminBadge}>
                <Text style={styles.adminBadgeText}>ADMIN</Text>
              </View>
            )}
          </View>
          <Text style={styles.userPhone}>{item.phone_number}</Text>
          {item.shop_name && (
            <Text style={styles.shopName}>{item.shop_name}</Text>
          )}
        </View>
        <View style={[
          styles.statusDot,
          item.is_active ? styles.statusActive : styles.statusInactive
        ]} />
      </View>
      
      {!item.is_admin && (
        <View style={styles.userActions}>
          <Pressable
            style={[styles.actionBtn, item.is_active ? styles.disableBtn : styles.enableBtn]}
            onPress={() => handleToggleStatus(item.id)}
          >
            <Ionicons
              name={item.is_active ? 'pause-circle' : 'play-circle'}
              size={16}
              color={item.is_active ? COLORS.warning : COLORS.success}
            />
            <Text style={[
              styles.actionBtnText,
              { color: item.is_active ? COLORS.warning : COLORS.success }
            ]}>
              {item.is_active ? 'Disable' : 'Enable'}
            </Text>
          </Pressable>
          <Pressable
            style={[styles.actionBtn, styles.deleteBtn]}
            onPress={() => handleDeleteUser(item.id, item.name)}
          >
            <Ionicons name="trash" size={16} color={COLORS.error} />
          </Pressable>
        </View>
      )}
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
          <Text style={styles.headerTitle}>{t('manageUsers')}</Text>
          <Text style={styles.headerSubtitle}>NH QUALITY GOODS LLC</Text>
        </View>
        <Pressable style={styles.addButton} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={24} color={COLORS.deepNavy} />
        </Pressable>
      </View>
      
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderUser}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.royalGold}
          />
        }
      />
      
      {/* Add User Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('addUser')}</Text>
              <Pressable onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>
            
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor={COLORS.textMuted}
              value={newUser.phone_number}
              onChangeText={(text) => setNewUser({ ...newUser, phone_number: text })}
              keyboardType="phone-pad"
            />
            <TextInput
              style={styles.input}
              placeholder="PIN *"
              placeholderTextColor={COLORS.textMuted}
              value={newUser.pin}
              onChangeText={(text) => setNewUser({ ...newUser, pin: text })}
              keyboardType="number-pad"
              secureTextEntry
            />
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={COLORS.textMuted}
              value={newUser.name}
              onChangeText={(text) => setNewUser({ ...newUser, name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Shop Name"
              placeholderTextColor={COLORS.textMuted}
              value={newUser.shop_name}
              onChangeText={(text) => setNewUser({ ...newUser, shop_name: text })}
            />
            <TextInput
              style={styles.input}
              placeholder="Shop Address"
              placeholderTextColor={COLORS.textMuted}
              value={newUser.shop_address}
              onChangeText={(text) => setNewUser({ ...newUser, shop_address: text })}
            />
            
            <Pressable
              style={[styles.createButton, isCreating && styles.createButtonDisabled]}
              onPress={handleCreateUser}
              disabled={isCreating}
            >
              {isCreating ? (
                <ActivityIndicator color={COLORS.deepNavy} />
              ) : (
                <Text style={styles.createButtonText}>Create Customer</Text>
              )}
            </Pressable>
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
    paddingHorizontal: SPACING.xl,
    paddingBottom: SPACING.xl
  },
  userCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.small
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.royalGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  avatarText: {
    fontSize: FONTS.sizes.lg,
    fontWeight: 'bold',
    color: COLORS.deepNavy
  },
  userInfo: {
    flex: 1
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm
  },
  userName: {
    fontSize: FONTS.sizes.md,
    fontWeight: 'bold',
    color: COLORS.textPrimary
  },
  adminBadge: {
    backgroundColor: COLORS.royalGold,
    paddingVertical: 2,
    paddingHorizontal: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm
  },
  adminBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: COLORS.deepNavy
  },
  userPhone: {
    fontSize: FONTS.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: 2
  },
  shopName: {
    fontSize: FONTS.sizes.xs,
    color: COLORS.royalGold,
    marginTop: 2
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  statusActive: {
    backgroundColor: COLORS.success
  },
  statusInactive: {
    backgroundColor: COLORS.error
  },
  userActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    gap: SPACING.xs
  },
  disableBtn: {
    backgroundColor: COLORS.warning + '20'
  },
  enableBtn: {
    backgroundColor: COLORS.success + '20'
  },
  deleteBtn: {
    backgroundColor: COLORS.error + '20'
  },
  actionBtnText: {
    fontSize: FONTS.sizes.sm,
    fontWeight: '600'
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
    padding: SPACING.xl
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
  input: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: FONTS.sizes.md,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md
  },
  createButton: {
    backgroundColor: COLORS.royalGold,
    paddingVertical: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginTop: SPACING.md
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
