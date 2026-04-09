import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { searchUsers, followUser, unfollowUser } from '../../services/api';
import UserAvatar from '../../components/UserAvatar';
import { colors } from '../../constants/theme';

export default function Explore() {
  const [users, setUsers] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(new Set<string>());

  const load = useCallback(async (q = '') => {
    setLoading(true);
    try {
      const data = await searchUsers(q);
      setUsers(data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(''); }, [load]);

  useEffect(() => {
    const t = setTimeout(() => load(query), 400);
    return () => clearTimeout(t);
  }, [query, load]);

  const toggleFollow = async (user: any) => {
    const id = user._id;
    setFollowLoading((prev) => new Set(prev).add(id));
    try {
      if (user.isFollowing) {
        await unfollowUser(id);
      } else {
        await followUser(id);
      }
      setUsers((prev) =>
        prev.map((u) => (u._id === id ? { ...u, isFollowing: !u.isFollowing } : u))
      );
    } catch (err) {
      Alert.alert('Error', 'Failed to update follow status.');
    } finally {
      setFollowLoading((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>
        <Text style={{ color: colors.saffron }}>//</Text>
        <Text style={{ color: colors.green }}> EXPLORE</Text>
      </Text>

      <View style={styles.searchWrapper}>
        <Ionicons name="search" size={16} color={colors.cyberMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor={colors.cyberMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
        />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.saffron} />
          <Text style={styles.loadingText}>Scanning network...</Text>
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <UserAvatar uri={item.profilePhotoUrl} userId={item._id} size={50} />
              <View style={styles.userInfo}>
                <Text style={styles.displayName}>{item.displayName}</Text>
                <Text style={styles.username}>@{item.username}</Text>
                {item.bio ? <Text style={styles.bio}>{item.bio}</Text> : null}
              </View>
              <Pressable
                onPress={() => toggleFollow(item)}
                disabled={followLoading.has(item._id)}
                style={[
                  styles.followBtn,
                  item.isFollowing
                    ? { backgroundColor: 'rgba(255,153,51,0.2)', borderColor: colors.saffron }
                    : { backgroundColor: colors.cyberBlue },
                ]}
              >
                <Ionicons
                  name={item.isFollowing ? 'checkmark' : 'person-add'}
                  size={16}
                  color={item.isFollowing ? colors.saffron : '#fff'}
                />
              </Pressable>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>No users found.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 2, padding: 20, paddingBottom: 12 },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, paddingVertical: 12 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.cyberMuted, fontSize: 14 },
  list: { paddingHorizontal: 20 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.cyberCard,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,136,255,0.3)',
  },
  userInfo: { flex: 1 },
  displayName: { color: '#fff', fontWeight: '800', fontSize: 14 },
  username: { color: colors.cyberBlue, fontSize: 12, marginTop: 2 },
  bio: { color: colors.cyberMuted, fontSize: 12, marginTop: 4 },
  followBtn: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  empty: { color: colors.cyberMuted, textAlign: 'center', marginTop: 60, fontSize: 14 },
});
