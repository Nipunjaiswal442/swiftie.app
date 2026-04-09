import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../constants/theme';
import UserAvatar from './UserAvatar';

interface Post {
  _id: string;
  caption: string;
  category?: string;
  imageUrl?: string;
  likesCount?: number;
  createdAt: string;
  author?: {
    _id: string;
    displayName?: string;
    username?: string;
    profilePhotoUrl?: string;
  };
}

interface Props {
  post: Post;
  isLiked?: boolean;
  onLike?: (post: Post) => void;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function PostCard({ post, isLiked = false, onLike }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <UserAvatar uri={post.author?.profilePhotoUrl} userId={post.author?._id} size={40} />
        <View style={styles.authorInfo}>
          <Text style={styles.authorName}>{post.author?.displayName || 'Unknown'}</Text>
          <Text style={styles.authorMeta}>
            @{post.author?.username} · {timeAgo(post.createdAt)}
          </Text>
        </View>
      </View>

      <Text style={styles.caption}>{post.caption}</Text>

      {post.imageUrl && (
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.image}
          resizeMode="cover"
        />
      )}

      <View style={styles.footer}>
        <View style={[styles.categoryTag, { borderColor: colors.saffron }]}>
          <Text style={[styles.categoryText, { color: colors.saffron }]}>{post.category}</Text>
        </View>
        <Pressable onPress={() => onLike?.(post)} style={styles.likeBtn}>
          <Ionicons
            name={isLiked ? 'heart' : 'heart-outline'}
            size={18}
            color={isLiked ? '#ff4444' : colors.cyberMuted}
          />
          <Text style={[styles.likeCount, { color: isLiked ? '#ff4444' : colors.cyberMuted }]}>
            {post.likesCount || 0}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cyberCard,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,136,255,0.4)',
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
  authorMeta: {
    color: colors.cyberMuted,
    fontSize: 12,
    marginTop: 2,
  },
  caption: {
    color: colors.cyberText,
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
  },
  likeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  likeCount: {
    fontSize: 13,
  },
});
