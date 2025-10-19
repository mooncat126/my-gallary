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

// Get screen dimensions
const { width, height } = Dimensions.get("window");

// Define props type
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
  // Handle backdrop press to close modal
  const handleBackdropPress = () => {
    onClose();
  };

  // Prevent content area click events from bubbling
  const handleContentPress = (e: any) => {
    e.stopPropagation();
  };

  // Handle favorite button click
  const handleFavoritePress = () => {
    if (item) {
      onToggleFavorite(item.id);
    }
  };

  // If there is no item, don't render anything
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
              {/* Close button */}
              <TouchableOpacity
                style={[
                  styles.closeButton,
                  { backgroundColor: theme === "dark" ? "rgba(30,30,30,0.85)" : "rgba(255,255,255,0.85)" }
                ]}
                onPress={onClose}
                hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              >
                <Ionicons
                  name="close-circle"
                  size={28}
                  color={colors.text}
                  style={{ opacity: 0.9 }}
                />
              </TouchableOpacity>

              {/* Favorite button */}
              <TouchableOpacity
                style={[
                  styles.favoriteButton,
                  { backgroundColor: theme === "dark" ? "rgba(30,30,30,0.85)" : "rgba(255,255,255,0.85)" }
                ]}
                onPress={handleFavoritePress}
                hitSlop={{ top: 15, right: 15, bottom: 15, left: 15 }}
              >
                <Ionicons
                  name={isFavorite ? "heart" : "heart-outline"}
                  size={28}
                  color={isFavorite ? "#f87171" : colors.text}
                  style={{ opacity: 0.9 }}
                />
              </TouchableOpacity>

              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: 0 }}
              >
                {/* Image area */}
                <View style={styles.imageContainer}>
                  <ImageWithPlaceholder
                    source={{ uri: item.thumb }}
                    style={styles.image}
                    resizeMode="contain"
                    placeholderColor={colors.imgPlaceholder}
                    darkMode={theme === "dark"}
                  />
                </View>

                {/* Information area */}
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
    paddingTop: 0, // Ensure no extra padding at the top
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
    top: 16,
    right: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  favoriteButton: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.85)",
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: width * 0.9, // Keep square aspect ratio
    backgroundColor: "transparent",
    marginTop: 0, // Changed from -10 to ensure buttons don't overlap with image
    paddingTop: 10, // Add padding at top for button spacing
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