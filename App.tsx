import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';

// 検索API: The Met Museum（無料・キー不要）
const SEARCH_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/search';
const OBJECT_URL = 'https://collectionapi.metmuseum.org/public/collection/v1/objects/';

type MetObject = {
  objectID: number;
  primaryImageSmall: string;
  title: string;
  artistDisplayName: string;
  objectDate?: string;
  objectName?: string;
  culture?: string;
  department?: string;
};

// 小さなヘルパー：fetch with timeout（超时避免卡住）
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

export default function App() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<MetObject[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 防抖
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedQuery = useMemo(() => query.trim(), [query]);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!debouncedQuery) {
      setResults([]);
      setErr(null);
      return;
    }
    timerRef.current = setTimeout(() => {
      searchByArtist(debouncedQuery).catch(() => {});
    }, 400);
    // cleanup
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQuery]);

  async function searchByArtist(artistName: string) {
    try {
      setLoading(true);
      setErr(null);

      // 1) 先搜索（hasImages=true，artistOrCulture=true 可以稍微提升关联度）
      const searchUrl =
        `${SEARCH_URL}?hasImages=true&artistOrCulture=true&q=${encodeURIComponent(artistName)}`;
      const searchRes = await fetchWithTimeout(searchUrl);
      if (!searchRes.ok) throw new Error('搜索失败');
      const searchData = await searchRes.json();

      const ids: number[] = searchData?.objectIDs ?? [];
      if (!ids || ids.length === 0) {
        setResults([]);
        setLoading(false);
        return;
      }

      // 2) 取前 N 个 id（避免一次抓太多）并并发拉详情
      const TOP_N = 40;
      const pick = ids.slice(0, TOP_N);

      const detailRes = await Promise.allSettled(
        pick.map((id) => fetchWithTimeout(OBJECT_URL + id))
      );

      const jsonRes = await Promise.all(
        detailRes
          .filter((r) => r.status === 'fulfilled' && (r as PromiseFulfilledResult<Response>).value.ok)
          .map((r) => (r as PromiseFulfilledResult<Response>).value.json())
      );

      // 3) 过滤：必须有 primaryImageSmall，且画家名包含（忽略大小写）
      const lower = artistName.toLowerCase();
      const filtered: MetObject[] = jsonRes
        .filter((obj: any) => obj?.primaryImageSmall)
        .filter((obj: any) =>
          String(obj?.artistDisplayName || '').toLowerCase().includes(lower)
        )
        .map((obj: any) => ({
          objectID: obj.objectID,
          primaryImageSmall: obj.primaryImageSmall,
          title: obj.title,
          artistDisplayName: obj.artistDisplayName,
          objectDate: obj.objectDate,
          objectName: obj.objectName,
          culture: obj.culture,
          department: obj.department,
        }));

      setResults(filtered);
    } catch (e: any) {
      setErr(e?.message || '发生错误了');
    } finally {
      setLoading(false);
    }
  }

  const renderItem = ({ item }: { item: MetObject }) => {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => {
          // 这里你可以跳转详情页，或打开 WebView 查看作品详情
          // 例：Linking.openURL(`https://www.metmuseum.org/art/collection/search/${item.objectID}`)
        }}
      >
        <Image
          source={{ uri: item.primaryImageSmall }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.meta}>
          <Text numberOfLines={1} style={styles.title}>
            {item.title || 'Untitled'}
          </Text>
          <Text numberOfLines={1} style={styles.artist}>
            {item.artistDisplayName || 'Unknown'}
          </Text>
          {item.objectDate ? (
            <Text numberOfLines={1} style={styles.subtle}>
              {item.objectDate}
            </Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.appTitle}>每日名画 · 搜索</Text>
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="输入画家名（例：Van Gogh / 葛饰北斋 / Monet）"
          style={styles.input}
          returnKeyType="search"
          onSubmitEditing={() => debouncedQuery && searchByArtist(debouncedQuery)}
          clearButtonMode="while-editing"
        />
        {loading ? <ActivityIndicator style={styles.loading} /> : null}
      </View>

      {err ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>出错了：{err}</Text>
        </View>
      ) : null}

      {!loading && !err && debouncedQuery && results.length === 0 ? (
        <View style={styles.state}>
          <Text style={styles.stateText}>没有找到相关作品，换个关键词试试～</Text>
        </View>
      ) : null}

      <FlatList
        data={results}
        keyExtractor={(item) => String(item.objectID)}
        renderItem={renderItem}
        numColumns={2}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {!debouncedQuery ? (
        <View style={styles.hint}>
          <Text style={styles.subtle}>试着搜索：Monet、Van Gogh、葛饰北斋、歌川広重…</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const GAP = 12;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
    position: 'relative',
  },
  input: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loading: {
    position: 'absolute',
    right: 16,
    top: 10,
  },
  list: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: GAP,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    margin: GAP / 2,
    flex: 1,
    // grid: 两列卡片
    maxWidth: '48%',
    borderWidth: 1,
    borderColor: '#F0F0F0',
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#EEE',
  },
  meta: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  artist: {
    fontSize: 12,
  },
  subtle: {
    fontSize: 12,
    color: '#6B7280',
  },
  state: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  stateText: {
    color: '#6B7280',
  },
  hint: {
    alignItems: 'center',
    paddingVertical: 8,
  },
});
