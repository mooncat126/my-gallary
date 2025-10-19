import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
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
import { StatusBar } from "expo-status-bar";
import Svg, { Path, Rect, Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import Fuse from "fuse.js";

/** ---------- 主题（线条风） ---------- */
const Light = {
  bg: "#FFFFFF",
  panel: "#FFFFFF",
  card: "#FFFFFF",
  border: "#A3A3A3",      // 主描边（中性灰）
  hairline: "#DADADA",    // 细分割线（浅灰）
  text: "#111417",
  sub: "#495057",
  hint: "#8B97A6",
  btnText: "#111417",
  imgPlaceholder: "#F3F4F6",
  mask: "rgba(255,255,255,0.60)", // 蒙层
};
const Dark = {
  bg: "#0B0C0E",
  panel: "#0B0C0E",
  card: "#0F1114",
  border: "#9CA3AF",      // 深色主题描边浅灰
  hairline: "#2A2E34",
  text: "#E7E9ED",
  sub: "#AEB6C2",
  hint: "#7D8694",
  btnText: "#E7E9ED",
  imgPlaceholder: "#1A1D22",
  mask: "rgba(0,0,0,0.45)", // 蒙层
};

/** ---------- 数据源 ---------- */
const MET_SEARCH =
  "https://collectionapi.metmuseum.org/public/collection/v1/search";
const MET_OBJECT =
  "https://collectionapi.metmuseum.org/public/collection/v1/objects/";
const AIC_SEARCH =
  "https://api.artic.edu/api/v1/artworks/search?fields=id,title,image_id,artist_title,date_display";

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 15000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

async function fetchFromMet(keyword, topN = 30) {
  const u = `${MET_SEARCH}?hasImages=true&artistOrCulture=true&q=${encodeURIComponent(
    keyword
  )}`;
  const s = await fetchWithTimeout(u);
  if (!s.ok) return [];
  const data = await s.json();
  const ids = Array.isArray(data?.objectIDs)
    ? data.objectIDs.slice(0, topN)
    : [];
  if (!ids.length) return [];
  const details = await Promise.allSettled(
    ids.map((id) => fetchWithTimeout(MET_OBJECT + id))
  );
  const jsons = await Promise.all(
    details
      .filter((r) => r.status === "fulfilled" && r.value.ok)
      .map((r) => r.value.json())
  );
  return jsons
    .filter((x) => x?.primaryImageSmall)
    .map((x) => ({
      id: `met:${x.objectID}`,
      title: x.title,
      artist: x.artistDisplayName,
      dateText: x.objectDate,
      thumb: x.primaryImageSmall,
      source: "met",
    }));
}

function aicIiif(image_id, width = 600) {
  return `https://www.artic.edu/iiif/2/${image_id}/full/${width},/0/default.jpg`;
}
async function fetchFromAIC(keyword, topN = 30) {
  const u = `${AIC_SEARCH}&q=${encodeURIComponent(keyword)}`;
  const s = await fetchWithTimeout(u);
  if (!s.ok) return [];
  const data = await s.json();
  const hits = Array.isArray(data?.data) ? data.data.slice(0, topN) : [];
  return hits
    .filter((x) => x?.image_id)
    .map((x) => ({
      id: `aic:${x.id}`,
      title: x.title,
      artist: x.artist_title,
      dateText: x.date_display,
      thumb: aicIiif(x.image_id, 600),
      source: "aic",
    }));
}

function mergeItems(a, b) {
  const seen = new Set();
  const out = [];
  [...a, ...b].forEach((it) => {
    if (!seen.has(it.id)) {
      seen.add(it.id);
      out.push(it);
    }
  });
  return out;
}

/** ---------- 顶部极淡线条背景 ---------- */
function ArtStrokeBg({ P }) {
  const stroke = P.hairline;
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFillObject}
      viewBox="0 0 400 800"
    >
      <Path
        d="M12 72 Q 120 8 198 64 T 384 92"
        stroke={stroke}
        strokeOpacity="0.22"
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M-8 250 Q 90 206 168 260 T 420 320"
        stroke={stroke}
        strokeOpacity="0.18"
        strokeWidth="1"
        fill="none"
      />
      <Path
        d="M0 520 Q 90 468 210 516 T 410 568"
        stroke={stroke}
        strokeOpacity="0.16"
        strokeWidth="1"
        fill="none"
      />
    </Svg>
  );
}

/** ---------- Loading 蒙层（线条风旋转圈） ---------- */
function LoadingOverlay({ visible, P }) {
  const rot = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    const loop = Animated.loop(
      Animated.timing(rot, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [visible]);

  if (!visible) return null;

  const spin = rot.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View
      style={[
        StyleSheet.absoluteFillObject,
        {
          backgroundColor: P.mask,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={64} height={64} viewBox="0 0 64 64">
          {/* 外圈（细描边） */}
          <Circle
            cx="32"
            cy="32"
            r="22"
            stroke={P.border}
            strokeWidth="1"
            fill="none"
          />
          {/* 前景扇形（短弧，做旋转） */}
          <Path
            d="M32 10 A22 22 0 0 1 52 30"
            stroke={P.border}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        </Svg>
      </Animated.View>
      <Text style={{ marginTop: 10, color: P.sub, fontSize: 12 }}>
        Searching…
      </Text>
    </View>
  );
}

/** =================== 主组件（线条风） =================== */
export default function App() {
  const sys = useColorScheme();
  const [manualTheme, setManualTheme] = useState(null);
  const theme = manualTheme ?? (sys === "dark" ? "dark" : "light");
  const P = theme === "dark" ? Dark : Light;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

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
      const merged = mergeItems(met, aic);

      const fuse = new Fuse(merged, {
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
    } catch (e) {
      setErr("搜索出错");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: P.bg }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
      <ArtStrokeBg P={P} />

      {/* 顶部 */}
      <View style={styles.topbar}>
        <Text style={[styles.brand, { color: P.text }]}>MyGallery</Text>
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
      <View
        style={{
          height: StyleSheet.hairlineWidth,
          backgroundColor: P.hairline,
        }}
      />

      {/* 搜索区（线条框） */}
      <View style={{ marginHorizontal: 14, marginTop: 12 }}>
        <View
          style={[
            styles.searchRow,
            { backgroundColor: P.panel, borderColor: P.border },
          ]}
        >
          <TextInput
            style={[styles.input, { color: P.text }]}
            placeholder="输入画家或作品（Monet / 北斋 / Van Gogh）"
            placeholderTextColor={P.hint}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          {/* 线条风按钮：纯描边矩形 */}
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

        {/* 错误提示（线条分隔） */}
        {err && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: P.sub, fontSize: 12 }}>出错了：{err}</Text>
            <View
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: P.hairline,
                marginTop: 8,
              }}
            />
          </View>
        )}
      </View>

      {/* 结果列表（升级相框风格的卡片） */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={{ paddingHorizontal: 10, paddingBottom: 10 }}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {}}
            style={({ pressed }) => [
              styles.card,
              { backgroundColor: P.card, borderColor: P.border },
              pressed && { transform: [{ scale: 0.995 }], borderColor: P.text },
            ]}
          >
            {/* 相框内沿线 */}
            <View style={[styles.frameInner, { borderColor: P.hairline }]} />

            {/* 图片区域：仅上圆角并裁剪，避免漏角 */}
            <View style={styles.imageWrap}>
              <Image
                source={{ uri: item.thumb }}
                style={[styles.image, { backgroundColor: P.imgPlaceholder }]}
              />
              {/* 右上角来源角标（描边小牌） */}
              <View style={styles.ribbonWrap}>
                <View
                  style={[
                    styles.ribbon,
                    { borderColor: P.border, backgroundColor: P.panel },
                  ]}
                >
                  <Text style={[styles.ribbonText, { color: P.sub }]}>
                    {item.source?.toUpperCase()}
                  </Text>
                </View>
              </View>
            </View>

            {/* 文本信息区 */}
            <View style={styles.meta}>
              <Text
                numberOfLines={2}
                style={[styles.title, { color: P.text }]}
              >
                {item.title || "Untitled"}
              </Text>
              <View style={[styles.divider, { backgroundColor: P.hairline }]} />
              <Text
                numberOfLines={1}
                style={[styles.artist, { color: P.sub }]}
              >
                {item.artist || "Unknown"}
              </Text>
              {item.dateText ? (
                <Text numberOfLines={1} style={[styles.date, { color: P.hint }]}>
                  {item.dateText}
                </Text>
              ) : null}

              <View style={styles.footerRow}>
                <Text style={[styles.footerText, { color: P.hint }]}>
                  {item.source?.toUpperCase()}
                </Text>
                <Text style={[styles.footerText, { color: P.hint }]}>
                  #{item.id.split(":")[1]}
                </Text>
              </View>
            </View>
          </Pressable>
        )}
      />

      {/* Loading 蒙层（覆盖全屏） */}
      <LoadingOverlay visible={loading} P={P} />
    </SafeAreaView>
  );
}

/** ---------- 样式（线条风·相框卡片） ---------- */
const styles = StyleSheet.create({
  root: { flex: 1 },

  topbar: {
    height: 50,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  brand: { fontSize: 18, fontWeight: "700", letterSpacing: 0.2 },
  themeBtn: { padding: 6, borderRadius: 8 },

  searchRow: {
    borderWidth: 1,
    overflow: "hidden",
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 10,
    paddingRight: 8,
    fontSize: 15,
  },
  searchBtnWrap: {
    width: 88,
    height: 36,
    margin: 6,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBtnText: {
    position: "absolute",
    fontSize: 14,
    fontWeight: "600",
  },

  /* —— 卡片 —— */
  card: {
    flex: 1,
    margin: 6,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",      // 让圆角生效，防止子元素溢出
    position: "relative",    // 内沿线定位
  },
  frameInner: {
    position: "absolute",
    left: 6,
    right: 6,
    top: 6,
    bottom: 6,
    borderWidth: 1,
    borderRadius: 10,        // 对应外层 14，内缩后更小
    zIndex: 1,
    pointerEvents: "none",
  },

  /* 图片容器：只裁剪上边圆角 */
  imageWrap: {
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 1,          // 可以改成 3/4 更像竖幅
  },

  /* 右上角来源角标 */
  ribbonWrap: { position: "absolute", top: 6, right: 6 },
  ribbon: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  ribbonText: { fontSize: 10, fontWeight: "600", letterSpacing: 0.2 },

  /* 信息区 */
  meta: { paddingHorizontal: 10, paddingVertical: 8 },
  title: { fontSize: 14, lineHeight: 18, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 6 },
  artist: { fontSize: 12, marginBottom: 2 },
  date: { fontSize: 11 },

  footerRow: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: { fontSize: 10, letterSpacing: 0.2 },
});
