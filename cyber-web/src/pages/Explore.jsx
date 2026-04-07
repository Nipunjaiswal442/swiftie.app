import React, { useState, useEffect, useCallback } from 'react';
import { UserPlus, Check, Search } from 'lucide-react';
import { searchUsers, followUser, unfollowUser } from '../services/api';

export default function Explore() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(new Set());

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

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => load(query), 400);
    return () => clearTimeout(t);
  }, [query, load]);

  const toggleFollow = async (user) => {
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
      console.error('Follow toggle failed', err);
    } finally {
      setFollowLoading((prev) => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-header">
        <span className="neon-saffron">// EXPLORE</span>
        <span className="neon-green"> NETWORK</span>
      </h1>

      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--cyber-muted)' }} />
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: '100%', paddingLeft: '36px' }}
        />
      </div>

      {loading && (
        <p style={{ color: 'var(--cyber-muted)', textAlign: 'center' }}>Scanning network...</p>
      )}

      {!loading && users.length === 0 && (
        <p style={{ color: 'var(--cyber-muted)', textAlign: 'center' }}>No users found.</p>
      )}

      {users.map((user) => (
        <div key={user._id} className="cyber-card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src={user.profilePhotoUrl || `https://i.pravatar.cc/150?u=${user._id}`}
            alt="avatar"
            style={{ width: '50px', height: '50px', borderRadius: '50%' }}
          />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>{user.displayName}</div>
            <div style={{ color: 'var(--cyber-blue)', fontSize: '0.8rem' }}>@{user.username}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--cyber-muted)', marginTop: '4px' }}>{user.bio}</div>
          </div>
          <button
            onClick={() => toggleFollow(user)}
            disabled={followLoading.has(user._id)}
            style={{
              background: user.isFollowing ? 'rgba(255,153,51,0.2)' : 'var(--cyber-blue)',
              color: user.isFollowing ? 'var(--cyber-saffron)' : '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: followLoading.has(user._id) ? 'not-allowed' : 'pointer',
              opacity: followLoading.has(user._id) ? 0.6 : 1,
            }}
          >
            {user.isFollowing ? <Check size={18} /> : <UserPlus size={18} />}
          </button>
        </div>
      ))}
    </div>
  );
}
