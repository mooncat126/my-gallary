// screens/FavoritesScreen.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface FavoritesScreenProps {
  theme: 'light' | 'dark';
  colors: any;
  onBack: () => void;
}

type Artwork = {
  id: string;
  title: string;
  artist: string;
  thumb: string;
  source?: string;
};

export default function FavoritesScreen({ theme, colors, onBack }: FavoritesScreenProps) {
  const auth: any = useAuth();

  // 既兼容 favorites Set<string>，也兼容 favoriteItems[] 或 artworksIndex{id:Artwork}
  const favIds: string[] = Array.from(auth?.favorites ?? []);
  const favoriteItems: Artwork[] =
    auth?.favoriteItems ??
    favIds
      .map((id: string) => auth?.artworksIndex?.[id])
      .filter(Boolean);

  const renderItem = ({ item }: { item: Artwork }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: item.thumb }} style={styles.thumb} />
      <View style={styles.meta}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title || 'Untitled'}
        </Text>
        <Text style={[styles.artist, { color: colors.sub }]} numberOfLines={1}>
          {item.artist || 'Unknown Artist'}
        </Text>
        {!!item.source && (
          <Text style={[styles.source, { color: colors.hint }]} numberOfLines={1}>
            {item.source}
          </Text>
        )}
      </View>
      <TouchableOpacity
        onPress={() => auth?.toggleFavorite?.(item.id)}
        style={styles.heartBtn}
        hitSlop={{ top: 8, right: 8, bottom: 8, left: 8 }}
      >
        <Ionicons name="heart" size={20} color="#f87171" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* 顶部栏 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>我的收藏</Text>
        <View style={{ width: 40 }} />
      </View>

{(!favoriteItems || favoriteItems.length === 0) ? (
  <View style={styles.emptyWrap}>
    {/* 新增图片 */}
    <Image
      source={require('../assets/no-collection.png')}
      style={styles.emptyImage}
      resizeMode="contain"
    />
    <Text style={[styles.emptyText, { color: colors.hint }]}>还没有收藏任何作品</Text>
    <Text style={[styles.emptySub, { color: colors.hint }]}>在作品详情里点击爱心即可收藏</Text>
  </View>
) : (
  <FlatList
    contentContainerStyle={{ padding: 16 }}
    data={favoriteItems}
    keyExtractor={(it) => it.id}
    renderItem={renderItem}
    ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
    showsVerticalScrollIndicator={false}
  />
)}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: 60, paddingHorizontal: 16, borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  backButton: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600' },

  card: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  thumb: { width: 96, height: 96, backgroundColor: '#ddd' },
  meta: { flex: 1, padding: 12, justifyContent: 'center' },
  title: { fontSize: 16, fontWeight: '700' },
  artist: { marginTop: 6, fontSize: 14, fontWeight: '600' },
  source: { marginTop: 4, fontSize: 12 },

  heartBtn: { padding: 8, alignSelf: 'flex-start' },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: -160 },
  emptyText: { fontSize: 16 },
  emptySub: { fontSize: 12 },
  emptyImage: { width: 150, height: 150, marginBottom: 15, opacity: 0.6 },
});
