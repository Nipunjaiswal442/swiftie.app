import React from 'react';
import { LogOut } from 'lucide-react';

export default function Profile({ profile, myPosts }) {
  return (
    <div className="page-container">
      <h1 className="page-header">
        <span className="neon-saffron">// ROOT</span>
        <span className="neon-green"> ACCESS</span>
      </h1>

      <div className="cyber-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <img src="https://i.pravatar.cc/150?5" alt="avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', border: '2px solid var(--cyber-saffron)' }} />
        <div>
          <h2 style={{ margin: 0 }}>{profile.name}</h2>
          <div style={{ color: 'var(--cyber-blue)', marginBottom: '8px' }}>{profile.handle}</div>
          <p style={{ fontSize: '0.85rem', color: 'var(--cyber-muted)' }}>{profile.bio}</p>
        </div>
      </div>

      <div className="pill-container">
        <div className="stat-pill">
          <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Followers</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyber-saffron)' }}>{profile.followers}</div>
        </div>
        <div className="stat-pill">
          <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Following</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--cyber-green)' }}>{profile.following}</div>
        </div>
        <div className="stat-pill">
          <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>Drops</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>{profile.posts}</div>
        </div>
      </div>

      <div className="cyber-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ff4444', cursor: 'pointer' }}>
          <span style={{ fontWeight: 'bold' }}>Jack Out (Disconnect)</span>
          <LogOut size={20} />
        </div>
      </div>

      <h3 style={{ marginTop: '24px', marginBottom: '16px', color: 'var(--cyber-muted)' }}>My History</h3>
      {myPosts.length === 0 ? (
        <div style={{ color: 'var(--cyber-muted)', fontSize: '0.9rem' }}>No drops found in the archive.</div>
      ) : (
        myPosts.map(post => (
          <div key={post.id} className="cyber-card">
            <p style={{ marginBottom: '8px' }}>{post.content}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--cyber-muted)' }}>
              <span>{post.category}</span>
              <span>{post.timeAgo}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
