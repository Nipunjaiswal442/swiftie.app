import React, { useState, useEffect, useCallback } from 'react';
import { Heart, RefreshCw } from 'lucide-react';
import { getFeed, likePost, unlikePost } from '../services/api';

export default function Feed() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [likedIds, setLikedIds] = useState(new Set());

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getFeed();
      setPosts(data);
    } catch (err) {
      console.error('Feed fetch failed', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadFeed(); }, [loadFeed]);

  const handleLike = async (post) => {
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

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  };

  return (
    <div className="page-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 className="page-header">
          <span className="neon-saffron">// CYBER</span>
          <span className="neon-green">FEED</span>
        </h1>
        <button
          onClick={loadFeed}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyber-muted)' }}
          title="Refresh"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {loading && (
        <p style={{ color: 'var(--cyber-muted)', textAlign: 'center', marginTop: '40px' }}>
          Syncing feed...
        </p>
      )}

      {!loading && posts.length === 0 && (
        <p style={{ color: 'var(--cyber-muted)', textAlign: 'center', marginTop: '40px' }}>
          No drops yet. Follow some users to see their posts.
        </p>
      )}

      {posts.map((post) => (
        <div key={post._id} className="cyber-card">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <img
              src={post.author?.profilePhotoUrl || `https://i.pravatar.cc/150?u=${post.author?._id}`}
              alt="avatar"
              style={{ width: '40px', height: '40px', borderRadius: '50%' }}
            />
            <div>
              <div style={{ fontWeight: 800 }}>{post.author?.displayName || 'Unknown'}</div>
              <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem' }}>
                @{post.author?.username} · {timeAgo(post.createdAt)}
              </div>
            </div>
          </div>
          <p style={{ marginBottom: '12px', lineHeight: 1.5 }}>{post.caption}</p>
          {post.imageUrl && (
            <img
              src={post.imageUrl}
              alt="post"
              style={{ width: '100%', borderRadius: '8px', marginBottom: '12px', maxHeight: '300px', objectFit: 'cover' }}
            />
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="capsule-tag" style={{ color: 'var(--cyber-saffron)' }}>{post.category}</span>
            <button
              onClick={() => handleLike(post)}
              style={{
                display: 'flex', alignItems: 'center', gap: '4px',
                background: 'none', border: 'none', cursor: 'pointer',
                color: likedIds.has(post._id) ? '#ff4444' : 'var(--cyber-muted)',
              }}
            >
              <Heart size={16} fill={likedIds.has(post._id) ? '#ff4444' : 'none'} />
              <span style={{ fontSize: '0.8rem' }}>{post.likesCount || 0}</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
