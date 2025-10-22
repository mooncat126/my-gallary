import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import EditProfileForm from "./EditProfileForm";
import FavoritesScreen from "./FavoritesScreen";
import CustomButton from "./CustomButton";

interface AccountDetailsScreenProps {
  theme: "light" | "dark";
  colors: any;
  onClose: () => void;
}

const AccountDetailsScreen: React.FC<AccountDetailsScreenProps> = ({
  theme,
  colors,
  onClose,
}) => {
  const [showEditForm, setShowEditForm] = useState(false);
  const { user, favorites } = useAuth();
  const favoritesCount = favorites ? favorites.size : 0;

  const createdAt = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString()
    : "未知";

  const [showFavorites, setShowFavorites] = useState(false);

  // ====== 我的收藏 页面 ======
  if (showFavorites) {
    return (
      <FavoritesScreen
        theme={theme}
        colors={colors}
        onBack={() => setShowFavorites(false)}
      />
    );
  }

  // ====== 当进入“编辑资料”模式时，整页显示 EditProfileForm ======
  if (showEditForm) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        <View
          style={[
            styles.header,
            { borderBottomColor: colors.border, borderBottomWidth: 1 },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setShowEditForm(false)}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            编辑个人资料
          </Text>
          <View style={styles.placeholder} />
        </View>

        {/* 直接渲染表单，不再使用 Modal */}
        <EditProfileForm
          theme={theme}
          colors={colors}
          onClose={() => setShowEditForm(false)}
        />
      </SafeAreaView>
    );
  }

  // ====== 普通“我的账户”页面 ======
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      <View
        style={[
          styles.header,
          { borderBottomColor: colors.border, borderBottomWidth: 1 },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={onClose}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          我的账户
        </Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        <View
          style={[
            styles.profileSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          {user?.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatarLarge} />
          ) : (
            <View
              style={[
                styles.avatarLarge,
                { backgroundColor: theme === "dark" ? "#4B5563" : "#E5E7EB" },
              ]}
            >
              <Text
                style={[
                  styles.avatarTextLarge,
                  { color: theme === "dark" ? "#E5E7EB" : "#4B5563" },
                ]}
              >
                {user?.displayName?.charAt(0).toUpperCase() ??
                  user?.email?.charAt(0).toUpperCase() ??
                  "?"}
              </Text>
            </View>
          )}
          <Text style={[styles.displayNameText, { color: colors.text }]}>
            {user?.displayName || "未设置用户名"}
          </Text>
          <Text style={[styles.emailText, { color: colors.sub }]}>
            {user ? user.email : "未登录"}
          </Text>

          <CustomButton
            title="编辑资料"
            onPress={() => setShowEditForm(true)}
            theme={theme}
            colors={colors}
            variant="default"
            style={{width: 150, marginTop: 20}}
          />
        </View>

        <View
          style={[
            styles.infoSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="heart" size={20} color={colors.text} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>
                收藏数量
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {favoritesCount}个
            </Text>
          </View>

          <View
            style={[styles.separator, { backgroundColor: colors.border }]}
          />

          <View style={styles.infoRow}>
            <View style={styles.infoLabelContainer}>
              <Ionicons name="calendar-outline" size={20} color={colors.text} />
              <Text style={[styles.infoLabel, { color: colors.text }]}>
                账户创建
              </Text>
            </View>
            <Text style={[styles.infoValue, { color: colors.text }]}>
              {createdAt}
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.infoSection,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.sub }]}>
            账户类型
          </Text>
          <View style={styles.infoRow}>
            <Text style={[styles.accountTypeText, { color: colors.text }]}>
              {user ? "测试账户" : "未登录"}
            </Text>
          </View>
          <Text style={[styles.accountNote, { color: colors.hint }]}>
            当前使用的是测试账户模式。在真实环境中，这里会显示更多账户信息和设置选项。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // ❌ 原来这里用绝对定位 + zIndex 会像“覆盖层/模态框”
    // position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: 60,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: "600" },
  placeholder: { width: 40 },

  content: { flex: 1, padding: 16 },

  profileSection: {
    alignItems: "center",
    padding: 32,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  avatarTextLarge: { fontSize: 32, fontWeight: "600" },
  displayNameText: {
    fontSize: 22,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 4,
  },
  emailText: { fontSize: 18, fontWeight: "600", textAlign: "center" },

  infoSection: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  sectionTitle: { fontSize: 14, fontWeight: "600", marginBottom: 16 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabelContainer: { flexDirection: "row", alignItems: "center" },
  infoLabel: { fontSize: 16, marginLeft: 8 },
  infoValue: { fontSize: 16, fontWeight: "500" },
  separator: { height: 1, width: "100%", marginVertical: 8 },
  accountTypeText: { fontSize: 16, fontWeight: "500" },
  accountNote: { fontSize: 12, marginTop: 8, lineHeight: 18 },
});

export default AccountDetailsScreen;
