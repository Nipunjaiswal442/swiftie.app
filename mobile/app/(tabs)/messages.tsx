import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getConversations } from '../../services/api';
import { connectSocket, onMessageReceive } from '../../services/socket';
import UserAvatar from '../../components/UserAvatar';
import { useAuthStore } from '../../store/authStore';
import { colors } from '../../constants/theme';

function timeAgo(dateStr?: string) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

export default function Messages() {
  const { user } = useAuthStore();
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const socket = await connectSocket();
      const unsub = onMessageReceive(() => {
        getConversations().then(setConversations).catch(() => {});
      });
      getConversations()
        .then(setConversations)
        .catch((err) => console.error('Conversations load failed', err))
        .finally(() => setLoading(false));
      return unsub;
    };

    let cleanup: (() => void) | undefined;
    init().then((unsub) => { cleanup = unsub; });
    return () => { cleanup?.(); };
  }, []);

  const getOther = (convo: any) =>
    convo.participants?.find((p: any) => p._id !== user?._id) || convo.participants?.[0];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Text style={styles.title}>
        <Text style={{ color: colors.saffron }}>//</Text>
        <Text style={{ color: colors.green }}> SECURE COMMS</Text>
      </Text>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.saffron} />
          <Text style={styles.loadingText}>Establishing secure channels...</Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const other = getOther(item);
            const unread = item.unreadCount?.[user?._id] || 0;
            return (
              <Pressable
                style={styles.card}
                onPress={() => router.push(`/chat/${item.conversationId}`)}
              >
                <UserAvatar
                  uri={other?.profilePhotoUrl}
                  userId={other?._id}
                  size={48}
                  onlineIndicator
                  isOnline={other?.isOnline}
                />
                <View style={styles.info}>
                  <Text style={styles.displayName}>{other?.displayName}</Text>
                  <Text style={styles.preview}>🔒 encrypted message</Text>
                </View>
                <View style={styles.meta}>
                  <Text style={styles.time}>{timeAgo(item.lastMessage?.timestamp)}</Text>
                  {unread > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{unread}</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="lock-closed" size={40} color={colors.cyberMuted} style={{ opacity: 0.3, marginBottom: 12 }} />
              <Text style={styles.emptyText}>No conversations yet.</Text>
              <Text style={styles.emptySubText}>Start chatting from a user's profile.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 2, padding: 20, paddingBottom: 12 },
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
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(0,136,255,0.3)',
  },
  info: { flex: 1, minWidth: 0 },
  displayName: { color: '#fff', fontWeight: '800', fontSize: 14, marginBottom: 3 },
  preview: { color: colors.cyberMuted, fontSize: 12 },
  meta: { alignItems: 'flex-end', gap: 4 },
  time: { color: colors.cyberMuted, fontSize: 11 },
  badge: {
    backgroundColor: colors.saffron,
    borderRadius: 12,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  badgeText: { color: '#000', fontSize: 10, fontWeight: '800' },
  empty: { alignItems: 'center', marginTop: 80 },
  emptyText: { color: colors.cyberMuted, fontSize: 15, marginBottom: 8 },
  emptySubText: { color: 'rgba(77,136,204,0.6)', fontSize: 13 },
});
