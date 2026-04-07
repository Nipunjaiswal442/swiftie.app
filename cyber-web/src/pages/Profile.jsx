import React, { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from '../firebase';
import { getMe, getFeed } from '../services/api';

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [myPosts, setMyPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [user, feed] = await Promise.all([getMe(), getFeed()]);
        setProfile(user);
        setMyPosts(feed.filter((p) => p.author?._id === user._id));
      } catch (err) {
        console.error('Profile load failed', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleLogout = async () => {
    await signOut();
    localStorage.removeItem('swiftie_token');
    localStorage.removeItem('swiftie_user');
    navigate('/');
  };

  if (loading) {
    return (
      <div className="page-container">
        <p style={{ color: 'var(--cyber-muted)', textAlign: 'center', marginTop: '40px' }}>Loading...</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="page-container">
        <p style={{ color: '#ff4444', textAlign: 'center', marginTop: '40px' }}>Failed to load profile.</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h1 className="page-header">
        <span className="neon-saffron">// ROOT</span>
        <span className="neon-green"> ACCESS</span>
      </h1>

      <div className="cyber-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img
          src={profile.profilePhotoUrl || `https://i.pravatar.cc/150?u=${profile._id}`}
          alt="avatar"
          style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--cyber-saffron)' }}
        />
        <div>
          <h2 style={{ margin: 0 }}>{profile.displayName}</h2>
          <div style={{ color: 'var(--cyber-blue)', marginBottom: '8px' }}>@{profile.username}</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--cyber-muted)' }}>{profile.bio || 'No bio yet.'}</p>
        </div>
      </div>

      <div className="pill-container">
        <div className="stat-pill">
          <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Followers</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyber-saffron)' }}>
            {profile.followers?.length || 0}
          </div>
        </div>
        <div className="stat-pill">
          <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Following</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyber-green)' }}>
            {profile.following?.length || 0}
          </div>
        </div>
        <div className="stat-pill">
          <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Drops</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{profile.postsCount || 0}</div>
        </div>
      </div>

      <div className="cyber-card" onClick={handleLogout} style={{ cursor: 'pointer' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ff4444' }}>
          <span style={{ fontWeight: 'bold' }}>Jack Out (Disconnect)</span>
          <LogOut size={20} />
        </div>
      </div>

      <h3 style={{ marginTop: '24px', marginBottom: '16px', color: 'var(--cyber-muted)' }}>My History</h3>
      {myPosts.length === 0 ? (
        <div style={{ color: 'var(--cyber-muted)', fontSize: '0.9rem' }}>No drops found in the archive.</div>
      ) : (
        myPosts.map((post) => (
          <div key={post._id} className="cyber-card">
            <p style={{ marginBottom: '8px' }}>{post.caption}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>
              <span>{post.category}</span>
              <span>{new Date(post.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
