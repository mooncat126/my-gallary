import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
  Modal,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface AccountMenuProps {
  theme: 'light' | 'dark';
  colors: any;
  onAccountPress: () => void;
  onFavoritesPress: () => void;   // ⬅️ 新增
}

const AccountMenu: React.FC<AccountMenuProps> = ({
  theme,
  colors,
  onAccountPress,
  onFavoritesPress,              // ⬅️ 新增
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout, favorites } = useAuth();   // ⬅️ 读取收藏
  const menuAnimation = useRef(new Animated.Value(0)).current;
  const windowHeight = Dimensions.get('window').height;

  const handleOutsideClick = () => { if (isMenuOpen) toggleMenu(); };

  const toggleMenu = () => {
    const toValue = isMenuOpen ? 0 : 1;
    setIsMenuOpen(!isMenuOpen);
    Animated.spring(menuAnimation, { toValue, friction: 7, tension: 70, useNativeDriver: true }).start();
  };

  const translateY = menuAnimation.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] });
  const menuOpacity = menuAnimation.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const avatarLetter =
    user?.displayName?.charAt(0).toUpperCase() ??
    user?.email?.charAt(0).toUpperCase() ??
    '?';

  const handleLogout = async () => { setIsMenuOpen(false); await logout(); };
  const handleAccountPress = () => { setIsMenuOpen(false); onAccountPress(); };
  const handleFavoritesPress = () => { setIsMenuOpen(false); onFavoritesPress(); }; // ⬅️

  const favCount = favorites ? favorites.size : 0; // ⬅️ 收藏数量

  return (
    <View>
      <TouchableOpacity style={styles.avatarContainer} onPress={toggleMenu}>
        {user?.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, { backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB' }]}>
            <Text style={[styles.avatarText, { color: theme === 'dark' ? '#E5E7EB' : '#4B5563' }]}>{avatarLetter}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal transparent animationType="none" visible={isMenuOpen} onRequestClose={toggleMenu}>
        <TouchableWithoutFeedback onPress={handleOutsideClick}>
          <View style={styles.modalOverlay}>
            <Animated.View
              style={[
                styles.menuContainer,
                {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    transform: [{ translateY }],
                    opacity: menuOpacity,
                    top: 60,
                    right: 16,
                },
              ]}
            >
              <View style={styles.menuHeader}>
                {user?.photoURL ? (
                  <Image source={{ uri: user.photoURL }} style={styles.largeAvatar} />
                ) : (
                  <View style={[styles.largeAvatar, { backgroundColor: theme === 'dark' ? '#4B5563' : '#E5E7EB' }]}>
                    <Text style={[styles.largeAvatarText, { color: theme === 'dark' ? '#E5E7EB' : '#4B5563' }]}>{avatarLetter}</Text>
                  </View>
                )}
                <Text style={[styles.displayNameText, { color: colors.text }]} numberOfLines={1}>{user?.displayName || ''}</Text>
                <Text style={[styles.emailText, { color: colors.sub }]} numberOfLines={1}>{user?.email || ''}</Text>
              </View>

              <View style={[styles.separator, { backgroundColor: colors.border }]} />

              {/* 我的账户 */}
              <TouchableOpacity style={styles.menuItem} onPress={handleAccountPress}>
                <Ionicons name="person-outline" size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>我的账户</Text>
              </TouchableOpacity>

              {/* 我的收藏 —— 新增 */}
              <TouchableOpacity style={styles.menuItem} onPress={handleFavoritesPress}>
                <Ionicons name="heart-outline" size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>我的收藏</Text>
                {/* 右侧小徽标 */}
                <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
                  <Text style={styles.badgeText}>{favCount}</Text>
                </View>
              </TouchableOpacity>

              {/* 退出登录 */}
              <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
                <Ionicons name="log-out-outline" size={20} color={colors.text} />
                <Text style={[styles.menuItemText, { color: colors.text }]}>退出登录</Text>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: { marginLeft: 8 },
  avatar: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 16, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  menuContainer: {
    position: 'absolute',
    width: 220,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  menuHeader: { padding: 16, alignItems: 'center' },
  largeAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  largeAvatarText: { fontSize: 24, fontWeight: '600' },
  displayNameText: { fontSize: 16, fontWeight: '600', marginBottom: 4 },
  emailText: { fontSize: 14, fontWeight: '500' },
  separator: { height: 1, width: '100%', marginVertical: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 16 },
  menuItemText: { fontSize: 16, marginLeft: 12, flex: 1 },
  // 收藏数量徽标
  badge: {
    minWidth: 20, height: 20, paddingHorizontal: 6,
    borderRadius: 10, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});

export default AccountMenu;
