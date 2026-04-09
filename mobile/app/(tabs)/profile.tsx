import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getMe, getFeed } from '../../services/api';
import { useAuthStore } from '../../store/authStore';
import UserAvatar from '../../components/UserAvatar';
import PostCard from '../../components/PostCard';
import { colors } from '../../constants/theme';

export default function Profile() {
  const { user, logout } = useAuthStore();
  const [profile, setProfile] = useState<any>(null);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [me, feed] = await Promise.all([getMe(), getFeed()]);
        setProfile(me);
        setMyPosts(feed.filter((p: any) => p.author?._id === me._id));
      } catch (err) {
        console.error('Profile load failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = () => {
    Alert.alert('Jack Out', 'Disconnect from Swiftie?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Disconnect', style: 'destructive', onPress: () => logout() },
    ]);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <ActivityIndicator color={colors.saffron} />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centered}>
          <Text style={{ color: colors.error }}>Failed to load profile.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>
          <Text style={{ color: colors.saffron }}>//</Text>
          <Text style={{ color: colors.green }}> ROOT ACCESS</Text>
        </Text>

        {/* Profile card */}
        <View style={styles.card}>
          <View style={styles.profileRow}>
            <UserAvatar
              uri={profile.profilePhotoUrl}
              userId={profile._id}
              size={80}
              bordered
            />
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{profile.displayName}</Text>
              <Text style={styles.username}>@{profile.username}</Text>
              <Text style={styles.bio}>{profile.bio || 'No bio yet.'}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Followers</Text>
            <Text style={[styles.statValue, { color: colors.saffron }]}>
              {profile.followers?.length || 0}
            </Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Following</Text>
            <Text style={[styles.statValue, { color: colors.green }]}>
              {profile.following?.length || 0}
            </Text>
          </View>
          <View style={styles.statPill}>
            <Text style={styles.statLabel}>Drops</Text>
            <Text style={styles.statValue}>{profile.postsCount || myPosts.length}</Text>
          </View>
        </View>

        {/* Logout */}
        <Pressable onPress={handleLogout} style={styles.logoutCard}>
          <Text style={styles.logoutText}>Jack Out (Disconnect)</Text>
          <Ionicons name="log-out" size={20} color={colors.error} />
        </Pressable>

        {/* My Posts */}
        <Text style={styles.sectionHeader}>My History</Text>
        {myPosts.length === 0 ? (
          <Text style={styles.empty}>No drops found in the archive.</Text>
        ) : (
          myPosts.map((post) => <PostCard key={post._id} post={post} />)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 2, marginBottom: 20 },
  card: {
    backgroundColor: colors.cyberCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,136,255,0.4)',
  },
  profileRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  profileInfo: { flex: 1 },
  displayName: { color: '#fff', fontSize: 18, fontWeight: '800', marginBottom: 4 },
  username: { color: colors.cyberBlue, fontSize: 13, marginBottom: 6 },
  bio: { color: colors.cyberMuted, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statPill: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cyberBlue,
  },
  statLabel: { color: colors.cyberMuted, fontSize: 11, marginBottom: 4 },
  statValue: { color: '#fff', fontSize: 20, fontWeight: '800' },
  logoutCard: {
    backgroundColor: colors.cyberCard,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,68,68,0.3)',
    marginBottom: 24,
  },
  logoutText: { color: colors.error, fontWeight: '700', fontSize: 15 },
  sectionHeader: { color: colors.cyberMuted, fontSize: 14, fontWeight: '700', marginBottom: 16 },
  empty: { color: colors.cyberMuted, fontSize: 13 },
});
