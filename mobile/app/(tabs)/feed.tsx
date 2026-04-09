import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  Pressable,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getFeed, likePost, unlikePost } from '../../services/api';
import PostCard from '../../components/PostCard';
import { colors } from '../../constants/theme';

export default function Feed() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [likedIds, setLikedIds] = useState(new Set<string>());

  const loadFeed = useCallback(async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await getFeed();
      setPosts(data);
    } catch (err) {
      console.error('Feed fetch failed', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLike = async (post: any) => {
    const postId = post._id;
    const alreadyLiked = likedIds.has(postId);
    try {
      const result = alreadyLiked ? await unlikePost(postId) : await likePost(postId);
      setLikedIds((prev) => {
        const next = new Set(prev);
        alreadyLiked ? next.delete(postId) : next.add(postId);
        return next;
      });
      setPosts((prev) =>
        prev.map((p) => (p._id === postId ? { ...p, likesCount: result.likesCount } : p))
      );
    } catch (err) {
      console.error('Like failed', err);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>
          <Text style={{ color: colors.saffron }}>//</Text>
          <Text style={{ color: colors.green }}> FEED</Text>
        </Text>
        <Pressable onPress={() => loadFeed(true)}>
          <Ionicons name="refresh" size={20} color={colors.cyberMuted} />
        </Pressable>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.saffron} />
          <Text style={styles.loadingText}>Syncing feed...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              isLiked={likedIds.has(item._id)}
              onLike={handleLike}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadFeed(true)}
              tintColor={colors.saffron}
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>No drops yet. Follow some users to see their posts.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 2 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.cyberMuted, fontSize: 14 },
  list: { padding: 20, paddingTop: 0 },
  empty: { color: colors.cyberMuted, textAlign: 'center', marginTop: 60, fontSize: 14 },
});
