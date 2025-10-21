import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import ImageWithPlaceholder from "./ImageWithPlaceholder";
import CustomButton from "./CustomButton";

const { width, height } = Dimensions.get("window");

interface ImageDetailsModalProps {
  visible: boolean;
  item: {
    id: string;
    title: string;
    artist: string;
    dateText?: string;
    thumb: string;
    source: "met" | "aic";
  } | null;
  theme: "light" | "dark";
  colors: any;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
}

const ImageDetailsModal: React.FC<ImageDetailsModalProps> = ({
  visible,
  item,
  theme,
  colors,
  onClose,
  onToggleFavorite,
  isFavorite,
}) => {
  if (!item) return null;

  const topBarBg =
    theme === "dark" ? "rgba(30,30,30,0.85)" : "rgba(255,255,255,0.92)";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <TouchableWithoutFeedback onPress={onClose}>
        <View
          style={[
            styles.container,
            {
              backgroundColor:
                theme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.5)",
            },
          ]}
        >
          {/* 阻止内容区冒泡关闭 */}
          <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
            <View
              style={[
                styles.content,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              {/* 顶部栏：占位固定高度，左右是收藏与关闭按钮 */}
              <View
                style={[
                  styles.topBar,
                  {
                    backgroundColor: topBarBg,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <CustomButton
                  onPress={() => onToggleFavorite(item.id)}
                  style={styles.iconBtn}
                  borderColor="transparent"
                >
                  <Ionicons
                    name={isFavorite ? "heart" : "heart-outline"}
                    size={22}
                    color={isFavorite ? "#f87171" : colors.text}
                  />
                </CustomButton>

                <CustomButton
                  onPress={onClose}
                  style={styles.iconBtn}
                  borderColor="transparent"
                >
                  <Ionicons name="close" size={22} color={colors.text} />
                </CustomButton>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 图片区域：现在会从 topBar 下面开始，不再被按钮压住 */}
                <View style={styles.imageContainer}>
                  <ImageWithPlaceholder
                    source={{ uri: item.thumb }}
                    style={styles.image}
                    resizeMode="contain"
                    placeholderColor={colors.imgPlaceholder}
                    darkMode={theme === "dark"}
                  />
                </View>

                {/* 信息区域 */}
                <View style={styles.infoContainer}>
                  <Text style={[styles.title, { color: colors.text }]}>
                    {item.title || "Untitled"}
                  </Text>
                  <Text style={[styles.artist, { color: colors.sub }]}>
                    {item.artist || "Unknown Artist"}
                  </Text>
                  {!!item.dateText && (
                    <Text style={[styles.dateText, { color: colors.sub }]}>
                      {item.dateText}
                    </Text>
                  )}

                  <View style={styles.sourceContainer}>
                    <Text style={[styles.sourceLabel, { color: colors.hint }]}>
                      Source:
                    </Text>
                    <Text style={[styles.sourceText, { color: colors.hint }]}>
                      {item.source === "met"
                        ? "The Metropolitan Museum of Art"
                        : "Art Institute of Chicago"}
                    </Text>
                  </View>

                  <View style={styles.idContainer}>
                    <Text style={[styles.idLabel, { color: colors.hint }]}>
                      ID:
                    </Text>
                    <Text style={[styles.idText, { color: colors.hint }]}>
                      {item.id}
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  content: {
    width: width * 0.9,
    maxHeight: height * 0.85,
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    paddingTop: 0,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: { elevation: 5 },
    }),
  },

  /** 顶部栏：固定高度，左右分布按钮 */
  topBar: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  imageContainer: {
    width: "100%",
    height: width * 0.9, // 方形预览
    backgroundColor: "transparent",
  },
  image: { width: "100%", height: "100%" },

  infoContainer: { padding: 16 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8, lineHeight: 28 },
  artist: { fontSize: 16, fontWeight: "600", marginBottom: 8 },
  dateText: { fontSize: 14, marginBottom: 16 },
  sourceContainer: { flexDirection: "row", marginBottom: 8 },
  sourceLabel: { fontSize: 14, marginRight: 5 },
  sourceText: { fontSize: 14 },
  idContainer: { flexDirection: "row", marginBottom: 8 },
  idLabel: { fontSize: 14, marginRight: 5 },
  idText: { fontSize: 14 },
});

export default ImageDetailsModal;
