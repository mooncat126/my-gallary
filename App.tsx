import React, { useEffect, useMemo, useRef, useState } from 'react';
import Fuse from 'fuse.js';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
  Keyboard,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';

// ---------- 配色（黑白灰） ----------
const PALETTE = {
  bg: '#0B0B0C',            // 背景（近黑）
  panel: '#111214',         // 面板
  card: '#15171A',          // 卡片底色
  border: '#2A2D33',        // 细描边
  text: '#E7E9ED',          // 主文字
  sub: '#A3A9B3',           // 次文字
  accent: '#ECEDEE',        // 高亮（按钮文字等）
  subtle: '#5D646F',        // 更淡的辅助
  btn: '#1E2024',           // 按钮背景
};

// ---------- Data Sources ----------
const MET_SEARCH = 'https://collectionapi.metmuseum.org/public/collection/v1/search';
const MET_OBJECT = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';
const AIC_SEARCH =
  'https://api.artic.edu/api/v1/artworks/search?fields=id,title,image_id,artist_title,date_display';

type ArtItem = {
  id: string;
  source: 'met' | 'aic';
  objectID?: number;
  aicID?: number;
  title: string;
  artist: string;
  dateText?: string;
  thumb: string;
};

// ---------- helpers ----------
async function fetchWithTimeout(resource: string, options: any = {}) {
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

async function fetchFromMet(keyword: string, topN = 30): Promise<ArtItem[]> {
  const u = `${MET_SEARCH}?hasImages=true&artistOrCulture=true&q=${encodeURIComponent(keyword)}`;
  const s = await fetchWithTimeout(u);
  if (!s.ok) return [];
  const data = await s.json();
  const ids: number[] = Array.isArray(data?.objectIDs) ? data.objectIDs.slice(0, topN) : [];
  if (!ids.length) return [];

  const details = await Promise.allSettled(ids.map(id => fetchWithTimeout(MET_OBJECT + id)));
  const jsons = await Promise.all(
    details
      .filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<Response>).value.ok)
      .map(r => (r as PromiseFulfilledResult<Response>).value.json())
  );

  return jsons
    .filter((x: any) => x?.primaryImageSmall)
    .map((x: any): ArtItem => ({
      id: `met:${x.objectID}`,
      source: 'met',
      objectID: x.objectID,
      title: x.title,
      artist: x.artistDisplayName,
      dateText: x.objectDate,
      thumb: x.primaryImageSmall,
    }));
}

function aicIiif(image_id: string, width = 600) {
  return `https://www.artic.edu/iiif/2/${image_id}/full/${width},/0/default.jpg`;
}
async function fetchFromAIC(keyword: string, topN = 30): Promise<ArtItem[]> {
  const u = `${AIC_SEARCH}&q=${encodeURIComponent(keyword)}`;
  const s = await fetchWithTimeout(u);
  if (!s.ok) return [];
  const data = await s.json();
  const hits: any[] = Array.isArray(data?.data) ? data.data.slice(0, topN) : [];
  return hits
    .filter(x => x?.image_id)
    .map(x => ({
      id: `aic:${x.id}`,
      source: 'aic' as const,
      aicID: x.id,
      title: x.title,
      artist: x.artist_title,
      dateText: x.date_display,
      thumb: aicIiif(x.image_id, 600),
    }));
}

function mergeItems(a: ArtItem[], b: ArtItem[]) {
  const seen = new Set<string>();
  const out: ArtItem[] = [];
  const push = (it: ArtItem) => {
    const key = it.id || `${(it.artist || '').toLowerCase()}|${(it.title || '').toLowerCase()}`;
    if (seen.has(key)) return;
    seen.add(key);
    out.push(it);
  };
  a.forEach(push);
  b.forEach(push);
  return out;
}

// ---------- 背景线条（抽象素描） ----------
function ArtStrokeBg() {
  return (
    <Svg
      pointerEvents="none"
      style={StyleSheet.absoluteFillObject}
      viewBox="0 0 400 800"
    >
      <Path
        d="M10 80 C60 40, 120 120, 190 70 S320 20, 380 90"
        stroke={PALETTE.border}
        strokeOpacity={0.35}
        strokeWidth={1}
        fill="none"
      />
      <Path
        d="M-20 260 C80 220, 160 300, 240 240 S380 200, 420 300"
        stroke={PALETTE.border}
        strokeOpacity={0.2}
        strokeWidth={1}
        fill="none"
      />
      <Path
        d="M0 520 C60 470, 150 560, 220 510 S330 470, 410 560"
        stroke={PALETTE.border}
        strokeOpacity={0.18}
        strokeWidth={1}
        fill="none"
      />
    </Svg>
  );
}

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<ArtItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // debounce
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!debouncedQuery) {
      setResults([]);
      setErr(null);
      return;
    }
    // 仅在停止输入 400ms 后触发（也可以点按钮立即触发）
    timerRef.current = setTimeout(() => {
      doSearch(debouncedQuery).catch(() => {});
    }, 400);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  async function doSearch(keyword: string) {
    try {
      setLoading(true);
      setErr(null);
      Keyboard.dismiss();

      const [met, aic] = await Promise.all([
        fetchFromMet(keyword, 40),
        fetchFromAIC(keyword, 40),
      ]);
      const merged = mergeItems(met, aic);

      const fuse = new Fuse(merged, {
        includeScore: true,
        threshold: 0.42,
        ignoreLocation: true,
        minMatchCharLength: 2,
        keys: [
          { name: 'artist', weight: 0.7 },
          { name: 'title',  weight: 0.3 },
        ],
      });

      let ranked = fuse.search(keyword).map(r => r.item);
      if (ranked.length < 6) {
        const lower = keyword.toLowerCase();
        const fallback = merged.filter(
          it =>
            (it.artist || '').toLowerCase().includes(lower) ||
            (it.title || '').toLowerCase().includes(lower)
        );
        const seen = new Set(ranked.map(x => x.id));
        ranked = ranked.concat(fallback.filter(x => !seen.has(x.id)));
      }

      setResults(ranked.slice(0, 60));
    } catch (e: any) {
      setErr(e?.message || '搜索出错了');
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }: { item: ArtItem }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.thumb }} style={styles.image} resizeMode="cover" />
      <View style={styles.meta}>
        <Text numberOfLines={1} style={styles.title}>{item.title || 'Untitled'}</Text>
        <Text numberOfLines={1} style={styles.artist}>{item.artist || 'Unknown'}</Text>
        {item.dateText ? <Text numberOfLines={1} style={styles.subtle}>{item.dateText}</Text> : null}
        <View style={styles.badgeRow}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>{item.source.toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="light" />
      <ArtStrokeBg />

      {/* 顶部栏 */}
      <View style={styles.topbar}>
        <View style={styles.logoDot} />
        <Text style={styles.appTitle}>MyGallery</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* 搜索区 */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={PALETTE.sub} style={{ marginLeft: 10 }} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="输入画家或作品（Monet / Van Gogh / 北斋）"
          placeholderTextColor={PALETTE.subtle}
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => debouncedQuery && doSearch(debouncedQuery)}
          clearButtonMode="while-editing"
        />
        <Pressable
          onPress={() => query.trim() && doSearch(query.trim())}
          style={({ pressed }) => [
            styles.searchBtn,
            pressed && { opacity: 0.7 },
            loading && { opacity: 0.6 },
          ]}
          disabled={loading || !query.trim()}
        >
          {loading ? (
            <ActivityIndicator color={PALETTE.accent} />
          ) : (
            <Text style={styles.searchBtnText}>搜索</Text>
          )}
        </Pressable>
      </View>

      {/* 状态提示 */}
      {err ? (
        <View style={styles.state}>
          <Ionicons name="alert-circle-outline" size={18} color={PALETTE.sub} />
          <Text style={styles.stateText}>出错了：{err}</Text>
        </View>
      ) : null}

      {!loading && !err && debouncedQuery && results.length === 0 ? (
        <View style={styles.state}>
          <Ionicons name="information-circle-outline" size={18} color={PALETTE.sub} />
          <Text style={styles.stateText}>没有找到相关作品，换个关键词试试～</Text>
        </View>
      ) : null}

      {/* 列表 */}
      <FlatList
        data={results}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {!debouncedQuery ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>试试：Monet、Van Gogh、Hokusai、Hiroshige、Picasso…</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const GAP = 12;

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: PALETTE.bg },
  topbar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: PALETTE.border,
  },
  logoDot: {
    width: 12, height: 12, borderRadius: 6,
    backgroundColor: PALETTE.accent, marginRight: 8,
  },
  appTitle: { color: PALETTE.text, fontSize: 18, fontWeight: '700', letterSpacing: 0.4 },

  searchBar: {
    marginTop: 12,
    marginHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PALETTE.panel,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PALETTE.border,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    color: PALETTE.text,
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
  },
  searchBtn: {
    height: 36,
    paddingHorizontal: 14,
    marginRight: 8,
    borderRadius: 8,
    backgroundColor: PALETTE.btn,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: PALETTE.border,
  },
  searchBtnText: { color: PALETTE.accent, fontSize: 14, fontWeight: '600' },

  list: { paddingHorizontal: 8, paddingVertical: 10, gap: GAP },
  card: {
    backgroundColor: PALETTE.card,
    borderRadius: 14,
    overflow: 'hidden',
    margin: GAP / 2,
    flex: 1,
    maxWidth: '48%',
    borderWidth: 1,
    borderColor: PALETTE.border,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  image: { width: '100%', aspectRatio: 1, backgroundColor: '#1B1D22' },
  meta: { paddingHorizontal: 10, paddingVertical: 8, gap: 4 },
  title: { fontSize: 14, fontWeight: '700', color: PALETTE.text },
  artist: { fontSize: 12, color: PALETTE.text },
  subtle: { fontSize: 11, color: PALETTE.sub },
  badgeRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  badgeDot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: PALETTE.sub, marginRight: 6,
  },
  badgeText: { fontSize: 10, color: PALETTE.sub },
  state: {
    marginTop: 10,
    marginHorizontal: 14,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PALETTE.border,
    backgroundColor: PALETTE.panel,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stateText: { color: PALETTE.sub },
  hint: { alignItems: 'center', paddingVertical: 10 },
  hintText: { color: PALETTE.subtle, fontSize: 12 },
});
