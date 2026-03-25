import React from 'react';
import { Heart } from 'lucide-react';

export default function Feed({ posts }) {
  return (
    <div className="page-container">
      <h1 className="page-header">
        <span className="neon-saffron">// CYBER</span>
        <span className="neon-green">FEED</span>
      </h1>
      
      {posts.map(post => (
        <div key={post.id} className="cyber-card">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
            <img 
              src={post.author.avatar} 
              alt="avatar" 
              style={{ width: '40px', height: '40px', borderRadius: '50%' }} 
            />
            <div>
              <div style={{ fontWeight: 800 }}>{post.author.name}</div>
              <div style={{ color: 'var(--cyber-muted)', fontSize: '0.8rem' }}>{post.author.handle} • {post.timeAgo}</div>
            </div>
          </div>
          <p style={{ marginBottom: '12px', lineHeight: 1.5 }}>{post.content}</p>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="capsule-tag" style={{ color: 'var(--cyber-saffron)' }}>{post.category}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#ff4444' }}>
              <Heart size={16} /> <span style={{ fontSize: '0.8rem' }}>{post.likes}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
