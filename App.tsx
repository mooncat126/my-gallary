// App.tsx
import React, { useEffect, useState } from "react";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import {
  FlatList,
  Image,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import Svg, { Rect } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import Fuse from "fuse.js";
import ImageWithPlaceholder from "./components/ImageWithPlaceholder";
import ImageDetailsModal from "./components/ImageDetailsModal";
import ArtStrokeBg from "./components/ArtStrokeBg";
import LoadingOverlay from "./components/LoadingOverlay";
import LoginScreen from "./components/LoginScreen";
import AccountMenu from "./components/AccountMenu";
import AccountDetailsScreen from "./components/AccountDetailsScreen";
import { AuthProvider, useAuth } from "./context/AuthContext";
import FavoritesScreen from "./components/FavoritesScreen";

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

/** =================== Main App Content =================== */
function AppContent() {
  const sys = useColorScheme();
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | null>(null);
  const theme = manualTheme ?? (sys === "dark" ? "dark" : "light");
  const P = theme === "dark" ? Dark : Light;
  const isLight = theme === "light";

  // 页面状态管理
  const [currentPage, setCurrentPage] = useState<
    "main" | "account" | "favorites"
  >("main");

  // 主页面状态
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 模态框状态
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  // Use auth context
  const { user, favorites, toggleFavorite } = useAuth();

  // For placing the "top fade mask" position and height
  const [searchH, setSearchEdgeY] = useState(0);

  // 今日推荐 state
  const [todayPick, setTodayPick] = useState<Item | null>(null);
  const [pickLoading, setPickLoading] = useState(false);
  const [pickErr, setPickErr] = useState<string | null>(null);

  // 有名画家关键词，提升命中率
  const POPULAR_KEYWORDS = [
    "Van Gogh",
    "Monet",
    "Picasso",
    "Rembrandt",
    "Da Vinci",
    "Matisse",
    "Klimt",
    "Renoir",
    "Degas",
    "Goya",
    "Cézanne",
    "Turner",
  ];

  // 获取今日推荐（随机1幅）
  async function fetchTodayPick(retry = 3) {
    try {
      setPickLoading(true);
      setPickErr(null);
      setTodayPick(null);

      for (let i = 0; i < retry; i++) {
        const kw =
          POPULAR_KEYWORDS[Math.floor(Math.random() * POPULAR_KEYWORDS.length)];
        const [met, aic] = await Promise.all([
          fetchFromMet(kw, 50),
          fetchFromAIC(kw, 50),
        ]);
        const merged = dedupeByArtistTitle([...met, ...aic]);
        if (merged.length) {
          const pick = merged[Math.floor(Math.random() * merged.length)];
          setTodayPick(pick);
          return;
        }
      }
      setPickErr("获取推荐失败，请稍后重试");
    } catch {
      setPickErr("获取推荐时发生错误");
    } finally {
      setPickLoading(false);
    }
  }

  // 首次进入获取“今日推荐”
  useEffect(() => {
    fetchTodayPick();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Use the toggleFavorite function from AuthContext
  const handleToggleFavorite = (id: string) => {
    toggleFavorite(id);
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

  // 渲染当前页面内容
  const renderContent = () => {
    if (currentPage === "account") {
      return (
        <AccountDetailsScreen
          theme={theme}
          colors={P}
          onClose={() => setCurrentPage("main")}
        />
      );
    }

    if (currentPage === "favorites") {
      return (
        <FavoritesScreen
          theme={theme}
          colors={P}
          onBack={() => setCurrentPage("main")}
        />
      );
    }

    return (
      <>
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
            <Text style={[styles.brand, { color: P.text }]}>小画廊</Text>
          </View>
          <View style={styles.rightContainer}>
            <View style={styles.buttonContainer}>
              <Pressable
                onPress={() =>
                  setManualTheme(theme === "dark" ? "light" : "dark")
                }
                hitSlop={10}
                style={styles.themeBtn}
              >
                {theme === "dark" ? (
                  <Ionicons name="sunny-outline" size={20} color={P.text} />
                ) : (
                  <Ionicons name="moon-outline" size={20} color={P.text} />
                )}
              </Pressable>
              {user && (
                <AccountMenu
                  theme={theme}
                  colors={P}
                  onAccountPress={() => setCurrentPage("account")}
                  onFavoritesPress={() => setCurrentPage("favorites")}
                />
              )}
            </View>
          </View>
        </View>

        {/* Search area */}
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
              placeholder="请输入画家或画作名 (Monet / Van Gogh)"
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
                {loading ? "搜索ing" : "搜索"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* 今日推荐（仅在未输入搜索词时显示） */}
        {!query.trim() && (
          <View style={{ marginHorizontal: 16, marginBottom: 8 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 8,
              }}
            >
              <Text
                style={{ color: P.text, fontSize: 16, fontWeight: "700" }}
              >
                今日推荐
              </Text>
              <Pressable
                onPress={() => fetchTodayPick()}
                style={({ pressed }) => [
                  {
                    marginLeft: "auto",
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: P.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text
                  style={{ color: P.btnText, fontSize: 12, fontWeight: "600" }}
                >
                  换一幅
                </Text>
              </Pressable>
            </View>

            {pickLoading ? (
              <View
                style={[
                  styles.card,
                  { borderColor: P.border, backgroundColor: P.card, padding: 16 },
                ]}
              >
                <Text style={{ color: P.hint }}>加载中...</Text>
              </View>
            ) : pickErr ? (
              <Text style={{ color: P.hint, fontSize: 12 }}>{pickErr}</Text>
            ) : todayPick ? (
              <Pressable
                onPress={() => {
                  setSelectedItem(todayPick);
                  setModalVisible(true);
                }}
                style={({ pressed }) => [
                  styles.card,
                  { borderColor: P.border, backgroundColor: P.card },
                  pressed && { transform: [{ scale: 0.995 }], borderColor: P.text },
                ]}
              >
                {/* 统一 4:5 比例 */}
                <View style={styles.imageBox}>
                  <ImageWithPlaceholder
                    source={{ uri: todayPick.thumb }}
                    style={styles.image}
                    placeholderColor={P.imgPlaceholder}
                    darkMode={theme === "dark"}
                    resizeMode="cover"
                  />
                </View>
                <View style={styles.meta}>
                  <Text
                    numberOfLines={2}
                    style={[styles.title, { color: P.text }]}
                    ellipsizeMode="tail"
                  >
                    {todayPick.title || "Untitled"}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[styles.artist, { color: P.sub }]}
                    ellipsizeMode="tail"
                  >
                    {todayPick.artist || "Unknown"}
                  </Text>
                  {!!todayPick.dateText && (
                    <Text
                      numberOfLines={1}
                      style={[styles.metaText, { color: P.hint }]}
                      ellipsizeMode="tail"
                    >
                      {todayPick.dateText}
                    </Text>
                  )}
                </View>
              </Pressable>
            ) : null}
          </View>
        )}

        {/* 错误提示 */}
        {err && (
          <Text
            style={{
              color: P.hint,
              fontSize: 12,
              marginHorizontal: 16,
              marginBottom: 6,
            }}
          >
            Error: {err}
          </Text>
        )}

        {/* 无结果占位 */}
        {!loading && !err && query.trim() && results.length === 0 ? (
          <View style={styles.noResultsContainer}>
            <Image
              source={require("./assets/error.png")}
              style={styles.errorImage}
              resizeMode="contain"
            />
            <Text style={[styles.noResultsText, { color: P.border }]}>
              找不到画作，请换一个关键词吧～
            </Text>
          </View>
        ) : (
          // 结果列表：统一两列、统一图片比例与字体排版
          <MaskedView
            style={{ flex: 1 }}
            maskElement={
              <LinearGradient
                colors={["#000", "#000", "rgba(0,0,0,0)"]}
                locations={[0, 0.92, 1]}
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
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingTop: 8,
                paddingBottom: 16,
              }}
              columnWrapperStyle={{ gap: 12 }}
              renderItem={({ item }) => (
                <View style={styles.cardWrap}>
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
                    {/* 统一 4:5 比例 + 居中裁切 */}
                    <View style={styles.imageBox}>
                      <ImageWithPlaceholder
                        source={{ uri: item.thumb }}
                        style={styles.image}
                        placeholderColor={P.imgPlaceholder}
                        darkMode={theme === "dark"}
                        resizeMode="cover"
                      />
                    </View>

                    <View style={styles.meta}>
                      <Text
                        numberOfLines={2}
                        style={[styles.title, { color: P.text }]}
                        ellipsizeMode="tail"
                      >
                        {item.title || "Untitled"}
                      </Text>
                      <Text
                        numberOfLines={1}
                        style={[styles.artist, { color: P.sub }]}
                        ellipsizeMode="tail"
                      >
                        {item.artist || "Unknown"}
                      </Text>
                      {item.dateText ? (
                        <Text
                          numberOfLines={1}
                          style={[styles.metaText, { color: P.hint }]}
                          ellipsizeMode="tail"
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

        {/* 顶部固定淡出遮罩 */}
        <LinearGradient
          pointerEvents="none"
          colors={[
            theme === "dark" ? "rgba(11,12,14,0.2)" : "rgba(255,255,255,0.2)",
            theme === "dark" ? "rgba(11,12,14,0.0)" : "rgba(255,255,255,0.0)",
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={{
            position: "absolute",
            top: searchH,
            left: 0,
            right: 0,
            height: 120,
            zIndex: 20,
            borderRadius: 10,
            marginHorizontal: 8,
          }}
        />

        {/* 详情弹窗 */}
        <ImageDetailsModal
          visible={modalVisible}
          item={selectedItem}
          theme={theme}
          colors={P}
          onClose={closeModal}
          onToggleFavorite={handleToggleFavorite}
          isFavorite={selectedItem ? favorites.has(selectedItem.id) : false}
        />

        {/* 搜索 Loading */}
        <LoadingOverlay
          visible={loading}
          stroke={theme === "dark" ? "#FFFFFF" : "rgba(0,0,0,1)"}
          bg={theme === "dark" ? "rgba(0,0,0,0.35)" : "rgba(0,0,0,0.12)"}
          size={12}
          gap={6}
        />
      </>
    );
  };

  return (
    <SafeAreaView
      style={[styles.root, { backgroundColor: P.bg }]}
      edges={["top", "left", "right"]}
    >
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ArtStrokeBg color={P.border} />
      {renderContent()}
    </SafeAreaView>
  );
}

/** =================== App Wrapper with Auth Provider =================== */
export default function App() {
  const sys = useColorScheme();
  const [manualTheme, setManualTheme] = useState<"light" | "dark" | null>(null);
  const theme = manualTheme ?? (sys === "dark" ? "dark" : "light");
  const P = theme === "dark" ? Dark : Light;

  return (
    <AuthProvider>
      <AppWrapper
        theme={theme}
        colors={P}
        manualTheme={manualTheme}
        setManualTheme={setManualTheme}
      />
    </AuthProvider>
  );
}

interface AppWrapperProps {
  theme: "light" | "dark";
  colors: any;
  manualTheme: "light" | "dark" | null;
  setManualTheme: (theme: "light" | "dark") => void;
}

function AppWrapper({
  theme,
  colors,
  manualTheme,
  setManualTheme,
}: AppWrapperProps) {
  const { user, isLoading, setUser } = useAuth();

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
        <LoadingOverlay
          visible={true}
          stroke={colors.border}
          bg={theme === "dark" ? "rgba(0,0,0,0.28)" : "rgba(255,255,255,0.28)"}
        />
      </View>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        theme={theme}
        colors={colors}
        onLoginSuccess={(loggedInUser) => setUser(loggedInUser)}
      />
    );
  }

  return <AppContent />;
}

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

  // 列表：统一两列
  cardWrap: { flex: 1, marginTop: 15 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },

  // 统一图片区域 4:5 比例 + 居中裁切
  imageBox: { width: "100%", aspectRatio: 0.8, backgroundColor: "#0000" },
  image: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },

  // 统一字体排版
  meta: { paddingHorizontal: 12, paddingVertical: 12, gap: 6 },
  title: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  artist: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  metaText: { fontSize: 11, lineHeight: 14, letterSpacing: 0.1 },

  // 无结果占位
  noResultsContainer: {
    position: "absolute",
    top: 250,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    zIndex: 10,
  },
  errorImage: { width: 180, height: 180, marginBottom: 24 },
  noResultsText: {
    fontSize: 16,
    textAlign: "center",
    marginHorizontal: 40,
    lineHeight: 24,
  },

  rightContainer: { flexDirection: "row", alignItems: "center" },
  buttonContainer: { flexDirection: "row", alignItems: "center" },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
});
