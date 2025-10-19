import React, { useEffect, useState } from "react";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import {
  FlatList,
  Image,
  Keyboard,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import Svg, { Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import Fuse from "fuse.js";
import ImageWithPlaceholder from "./components/ImageWithPlaceholder";
import ImageDetailsModal from "./components/ImageDetailsModal";
import ArtStrokeBg from "./components/ArtStrokeBg";
import LoadingOverlay from "./components/LoadingOverlay";

/** ---------- Theme (Black/White/Gray + Line Style) ---------- */
const Light = {
  bg: "#FFFFFF",
  panel: "#FFFFFF",
  card: "#FFFFFF",
  border: "#B0B0B0",
  text: "#111417",
  sub: "#4B5563",
  hint: "#9AA0A6",
  btnText: "#111417",
  imgPlaceholder: "#F3F4F6",
};
const Dark = {
  bg: "#0B0C0E",
  panel: "#0B0C0E",
  card: "#111214",
  border: "#9CA3AF",
  text: "#E7E9ED",
  sub: "#AEB6C2",
  hint: "#7D8694",
  btnText: "#E7E9ED",
  imgPlaceholder: "#1A1D22",
};

/** ---------- Data Sources ---------- */
const MET_SEARCH =
  "https://collectionapi.metmuseum.org/public/collection/v1/search";
const MET_OBJECT =
  "https://collectionapi.metmuseum.org/public/collection/v1/objects/";
const AIC_SEARCH =
  "https://api.artic.edu/api/v1/artworks/search?fields=id,title,image_id,artist_title,date_display";

/** ---------- Types ---------- */
type Item = {
  id: string; // "met:xxxx" | "aic:xxxx"
  title: string;
  artist: string;
  dateText?: string;
  thumb: string;
  source: "met" | "aic";
};

/** ---------- Utilities ---------- */
async function fetchWithTimeout(resource: string, options: any = {}) {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function fetchFromMet(keyword: string, topN = 30): Promise<Item[]> {
  const u = `${MET_SEARCH}?hasImages=true&artistOrCulture=true&q=${encodeURIComponent(
    keyword
  )}`;
  const s = await fetchWithTimeout(u);
  if (!s.ok) return [];
  const data = await s.json();
  const ids: number[] = Array.isArray(data?.objectIDs)
    ? data.objectIDs.slice(0, topN)
    : [];
  if (!ids.length) return [];
  const details = await Promise.allSettled(
    ids.map((id) => fetchWithTimeout(MET_OBJECT + id))
  );
  const jsons = await Promise.all(
    details
      .filter((r: any) => r.status === "fulfilled" && r.value.ok)
      .map((r: any) => r.value.json())
  );
  return jsons
    .filter((x: any) => x?.primaryImageSmall)
    .map(
      (x: any): Item => ({
        id: `met:${x.objectID}`,
        title: x.title,
        artist: x.artistDisplayName,
        dateText: x.objectDate,
        thumb: x.primaryImageSmall,
        source: "met",
      })
    );
}

function aicIiif(image_id: string, width = 600) {
  return `https://www.artic.edu/iiif/2/${image_id}/full/${width},/0/default.jpg`;
}
async function fetchFromAIC(keyword: string, topN = 30): Promise<Item[]> {
  const u = `${AIC_SEARCH}&q=${encodeURIComponent(keyword)}`;
  const s = await fetchWithTimeout(u);
  if (!s.ok) return [];
  const data = await s.json();
  const hits: any[] = Array.isArray(data?.data) ? data.data.slice(0, topN) : [];
  return hits
    .filter((x: any) => x?.image_id)
    .map(
      (x: any): Item => ({
        id: `aic:${x.id}`,
        title: x.title,
        artist: x.artist_title,
        dateText: x.date_display,
        thumb: aicIiif(x.image_id, 600),
        source: "aic",
      })
    );
}

/** ---------- Merge + Dedupe (by artist+title normalization) ---------- */
function norm(s: string) {
  return (s || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, "")
    .trim();
}
function dedupeByArtistTitle(items: Item[]) {
  const seen = new Set<string>();
  const out: Item[] = [];
  for (const it of items) {
    const key = `${norm(it.artist)}|${norm(it.title)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}


/** =================== App =================== */
export default function App() {
  const sys = useColorScheme();
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | null>(null);
  const theme = manualTheme ?? (sys === "dark" ? "dark" : "light");
  const P = theme === "dark" ? Dark : Light;
  const isLight = theme === "light";

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // For placing the "top fade mask" position and height
  const [searchH, setSearchEdgeY] = useState(0);
  const topFadeHeight = 136; // Top fade-out height (larger = more visible)

  // Load favorites state
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const savedFavorites = await AsyncStorage.getItem('favorites');
        if (savedFavorites) {
          setFavorites(new Set(JSON.parse(savedFavorites)));
        }
      } catch (error) {
        console.error('Failed to load favorites', error);
      }
    };

    loadFavorites();
  }, []);

  // Handle favorite/unfavorite
  const handleToggleFavorite = async (id: string) => {
    const newFavorites = new Set(favorites);

    if (newFavorites.has(id)) {
      newFavorites.delete(id);
    } else {
      newFavorites.add(id);
    }

    setFavorites(newFavorites);

    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('favorites', JSON.stringify([...newFavorites]));
    } catch (error) {
      console.error('Failed to save favorites', error);
    }
  };

  // Open modal
  const openModal = (item: Item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  // Close modal
  const closeModal = () => {
    setModalVisible(false);
  };

  async function handleSearch() {
    if (!query.trim() || loading) return;
    try {
      setLoading(true);
      setErr(null);
      Keyboard.dismiss();
      const [met, aic] = await Promise.all([
        fetchFromMet(query, 40),
        fetchFromAIC(query, 40),
      ]);
      const merged = dedupeByArtistTitle([...met, ...aic]);
      const fuse = new Fuse<Item>(merged, {
        includeScore: true,
        threshold: 0.42,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: "artist", weight: 0.7 },
          { name: "title", weight: 0.3 },
        ],
      });
      let ranked = fuse.search(query).map((r) => r.item);
      if (ranked.length < 6) {
        const lower = query.toLowerCase();
        const fallback = merged.filter(
          (it) =>
            (it.artist || "").toLowerCase().includes(lower) ||
            (it.title || "").toLowerCase().includes(lower)
        );
        const seen = new Set(ranked.map((x) => x.id));
        ranked = ranked.concat(fallback.filter((x) => !seen.has(x.id)));
      }
      setResults(ranked.slice(0, 60));
    } catch {
      setErr("Search error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: P.bg }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ArtStrokeBg color={P.border} />

      {/* Header */}
      <View style={styles.topbar}>
        <View style={styles.brandContainer}>
          <Image
            source={
              theme === "dark"
                ? require("./assets/app-icon-dark.png")
                : require("./assets/app-icon.png")
            }
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={[styles.brand, { color: P.text }]}>MyGallery</Text>
        </View>
        <Pressable
          onPress={() => setManualTheme(theme === "dark" ? "light" : "dark")}
          hitSlop={10}
          style={styles.themeBtn}
        >
          {theme === "dark" ? (
            <Ionicons name="sunny-outline" size={20} color={P.text} />
          ) : (
            <Ionicons name="moon-outline" size={20} color={P.text} />
          )}
        </Pressable>
      </View>

      {/* Search area (light paper with shadow / dark flat) */}
      <View
        style={[styles.searchWrap, isLight && styles.paperShadow]}
        onLayout={(e) =>
          setSearchEdgeY(e.nativeEvent.layout.y + e.nativeEvent.layout.height)
        }
      >
        <View
          style={[
            styles.searchRow,
            { borderColor: P.border, backgroundColor: P.panel },
          ]}
        >
          <TextInput
            style={[styles.input, { color: P.text }]}
            placeholder="Enter artist or artwork (Monet / Van Gogh)"
            placeholderTextColor={P.hint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <Pressable
            onPress={handleSearch}
            disabled={loading || !query.trim()}
            style={({ pressed }) => [
              styles.searchBtnWrap,
              { opacity: loading || !query.trim() ? 0.5 : 1 },
              pressed && { transform: [{ scale: 0.98 }] },
            ]}
          >
            <Svg width="88" height="36">
              <Rect
                x="0.5"
                y="0.5"
                width="87"
                height="35"
                rx="8"
                ry="8"
                fill="none"
                stroke={P.border}
                strokeWidth="1"
              />
            </Svg>
            <Text style={[styles.searchBtnText, { color: P.btnText }]}>
              {loading ? "Loading…" : "Search"}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Fixed scroll fade mask: attached to search area bottom, list scrolling underneath will fade out */}
      <LinearGradient
        pointerEvents="none"
        colors={[
          theme === "dark" ? "rgba(11,12,14,0.2)" : "rgba(255,255,255,0.2)", // Top close to background
          theme === "dark" ? "rgba(11,12,14,0.0)" : "rgba(255,255,255,0.0)", // Transparent toward bottom
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{
          position: "absolute",
          top: searchH, // Precisely fit to bottom of search area
          left: 0,
          right: 0,
          height: 120, // Fade range
          zIndex: 20,
          borderRadius: 10,     // Rounded corners
          marginHorizontal: 8,  // Horizontal margin
        }}
      />

      {/* Error message */}
      {err && (
        <Text
          style={{
            color: P.sub,
            fontSize: 12,
            marginHorizontal: 16,
            marginBottom: 6,
          }}
        >
          Error: {err}
        </Text>
      )}

      {/* Show error image when no results */}
      {!loading && !err && query.trim() && results.length === 0 ? (
        <View style={styles.noResultsContainer}>
          <Image source={require("./assets/error.png")} style={styles.errorImage} resizeMode="contain" />
          <Text style={[styles.noResultsText, { color: P.sub }]}>No matching artworks found. Try different keywords.</Text>
        </View>
      ) : (
        /* Results: light paper with shadow, dark flat */
        <MaskedView
          style={{flex: 1}}
          maskElement={
            <LinearGradient
              // Black=fully visible, transparent=fully hidden (affects alpha only)
              colors={["#000", "#000", "rgba(0,0,0,0)"]}
              locations={[0, 0.92, 1]} // Only bottom 22% has slight fade-out
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={StyleSheet.absoluteFillObject}
            />
          }
        >
          <FlatList
          data={results}
          keyExtractor={(it) => it.id}
          numColumns={2}
          // Slight top padding for smoother scrolling
          contentContainerStyle={{
            paddingTop: 8,
            paddingHorizontal: 10,
            paddingBottom: 16,
          }}
          renderItem={({ item }) => (
            <View style={[styles.cardWrap, isLight && styles.paperShadow]}>
              <Pressable
                onPress={() => openModal(item)}
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: P.border, backgroundColor: P.card },
                  pressed && {
                    transform: [{ scale: 0.995 }],
                    borderColor: P.text,
                  },
                ]}
              >
                <ImageWithPlaceholder
                  source={{ uri: item.thumb }}
                  style={[styles.image, { backgroundColor: P.imgPlaceholder }]}
                  placeholderColor={P.imgPlaceholder}
                  darkMode={theme === "dark"}
                />

                <View style={styles.meta}>
                  <Text
                    numberOfLines={2}
                    style={[styles.title, { color: P.text }]}
                  >
                    {item.title || "Untitled"}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.artist, { color: P.sub }]}
                  >
                    {item.artist || "Unknown"}
                  </Text>
                  {item.dateText ? (
                    <Text
                      numberOfLines={1}
                      style={{ color: P.hint, fontSize: 11 }}
                    >
                      {item.dateText}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            </View>
          )}
        />
      </MaskedView>
      )}

      {/* Image Details Modal */}
      <ImageDetailsModal
        visible={modalVisible}
        item={selectedItem}
        theme={theme}
        colors={P}
        onClose={closeModal}
        onToggleFavorite={handleToggleFavorite}
        isFavorite={selectedItem ? favorites.has(selectedItem.id) : false}
      />

      {/* Optional full-screen Loading (during search) */}
      <LoadingOverlay
        visible={loading}
        stroke={P.border}
        bg={theme === "dark" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.28)"}
      />
    </SafeAreaView>
  );
}

/** ---------- 样式 ---------- */
const styles = StyleSheet.create({
  root: { flex: 1, position: "relative" },
  topbar: {
    height: 60,
    marginBottom: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brandContainer: { flexDirection: "row", alignItems: "center" },
  appIcon: { width: 40, height: 40, marginRight: 8, borderRadius: 6 },
  brand: { fontSize: 18, fontWeight: "700" },
  themeBtn: { padding: 6, borderRadius: 8 },

  searchWrap: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12 },
  paperShadow: {
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchRow: {
    borderWidth: 1,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },
  input: { flex: 1, paddingVertical: 10, paddingRight: 8, fontSize: 15 },

  searchBtnWrap: {
    width: 88,
    height: 36,
    margin: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: { position: "absolute", fontSize: 14, fontWeight: "600" },

  cardWrap: {
    flex: 1,
    marginRight: 5,
    marginLeft: 5,
    marginBottom: 20,
    borderRadius: 16,
    marginTop: 15,
  },
  card: { flex: 1, borderRadius: 16, borderWidth: 1, overflow: "hidden" },

  // Image area: square ratio; border radius matches card to avoid corner gaps
  image: {
    width: "100%",
    aspectRatio: 1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    marginTop: -10,
  },

  meta: { paddingHorizontal: 14, paddingVertical: 14 },
  title: { fontSize: 15, fontWeight: "700", lineHeight: 20 },
  artist: { fontSize: 13, marginTop: 4 },

  // No results placeholder
  noResultsContainer: {
    position: "absolute",
    top: 250, // Offset from top to center the content
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    zIndex: 10
  },
  errorImage: { width: 180, height: 180, marginBottom: 24 },
  noResultsText: { fontSize: 16, textAlign: "center", marginHorizontal: 40, lineHeight: 24 },
});
