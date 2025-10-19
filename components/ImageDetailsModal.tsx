import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Dimensions,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import ImageWithPlaceholder from "./ImageWithPlaceholder";

// 获取屏幕尺寸
const { width, height } = Dimensions.get("window");

// 定义道具类型
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
  // 处理空白区域点击关闭模态框
  const handleBackdropPress = () => {
    onClose();
  };

  // 阻止内容区域点击事件冒泡
  const handleContentPress = (e: any) => {
    e.stopPropagation();
  };

  // 处理收藏按钮点击
  const handleFavoritePress = () => {
    if (item) {
      onToggleFavorite(item.id);
    }
  };

  // 如果没有项目，不渲染任何内容
  if (!item) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <TouchableWithoutFeedback onPress={handleBackdropPress}>
        <View style={[
          styles.container,
          { backgroundColor: theme === "dark" ? "rgba(0,0,0,0.9)" : "rgba(255,255,255,0.9)" }
        ]}>
          <TouchableWithoutFeedback onPress={handleContentPress}>
            <View style={[
              styles.content,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
              }
            ]}>
              {/* 关闭按钮 */}
              <TouchableOpacity
                style={styles.closeButton}
                onPress={onClose}
                hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              >
                <Ionicons
                  name="close-circle"
                  size={32}
                  color={colors.text}
                  style={{ opacity: 0.8 }}
                />
              </TouchableOpacity>

              {/* 收藏按钮 */}
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={handleFavoritePress}
                hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={32}
                  color={isFavorite ? "#f87171" : colors.text}
                  style={{ opacity: 0.8 }}
                />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* 图片区域 */}
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

                  {item.dateText && (
                    <Text style={[styles.dateText, { color: colors.sub }]}>
                      {item.dateText}
                    </Text>
                  )}

                  <View style={styles.sourceContainer}>
                    <Text style={[styles.sourceLabel, { color: colors.hint }]}>
                      Source:
                    </Text>
                    <Text style={[styles.sourceText, { color: colors.hint }]}>
                      {item.source === "met" ? "The Metropolitan Museum of Art" : "Art Institute of Chicago"}
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
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 12,
    zIndex: 10,
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    left: 12,
    zIndex: 10,
  },
  imageContainer: {
    width: "100%",
    height: width * 0.9, // 保持正方形比例
    backgroundColor: "transparent",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  infoContainer: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
    lineHeight: 28,
  },
  artist: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 16,
  },
  sourceContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  sourceLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  sourceText: {
    fontSize: 14,
  },
  idContainer: {
    flexDirection: "row",
    marginBottom: 8,
  },
  idLabel: {
    fontSize: 14,
    marginRight: 5,
  },
  idText: {
    fontSize: 14,
  },
});

export default ImageDetailsModal;