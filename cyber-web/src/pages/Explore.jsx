import React from 'react';
import { UserPlus, Check } from 'lucide-react';

export default function Explore({ users, setUsers }) {
  const toggleFollow = (id) => {
    setUsers(users.map(u => u.id === id ? { ...u, isFollowing: !u.isFollowing } : u));
  };

  return (
    <div className="page-container">
      <h1 className="page-header">
        <span className="neon-saffron">// EXPLORE</span>
        <span className="neon-green"> NETWORK</span>
      </h1>
      
      {users.map(user => (
        <div key={user.id} className="cyber-card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img src={user.avatar} alt="avatar" style={{ width: '50px', height: '50px', borderRadius: '50%' }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 800 }}>{user.name}</div>
            <div style={{ color: 'var(--cyber-blue)', fontSize: '0.8rem' }}>{user.handle}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--cyber-muted)', marginTop: '4px' }}>{user.bio}</div>
          </div>
          <button 
            onClick={() => toggleFollow(user.id)}
            style={{ 
              background: user.isFollowing ? 'rgba(255,153,51,0.2)' : 'var(--cyber-blue)',
              color: user.isFollowing ? 'var(--cyber-saffron)' : '#fff',
              border: 'none',
              padding: '8px 12px',
              borderRadius: '8px',
              fontWeight: 'bold',
              cursor: 'pointer'
            }}
          >
            {user.isFollowing ? <Check size={18} /> : <UserPlus size={18} />}
          </button>
        </div>
      ))}
    </div>
  );
}
