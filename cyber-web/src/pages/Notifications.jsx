import React from 'react';
import { Heart, UserPlus, Bell } from 'lucide-react';

export default function Notifications({ notifications }) {
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'Heart': return <Heart size={16} fill="var(--cyber-saffron)" color="var(--cyber-saffron)" />;
      case 'UserPlus': return <UserPlus size={16} color="var(--cyber-green)" />;
      default: return <Bell size={16} color="var(--cyber-blue)" />;
    }
  };

  return (
    <div className="page-container">
      <h1 className="page-header">
        <span className="neon-saffron">// SYSTEM</span>
        <span className="neon-green"> ALERTS</span>
      </h1>
      
      {notifications.map(note => (
        <div key={note.id} className="cyber-card" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ 
            width: '40px', height: '40px', 
            borderRadius: '50%', 
            background: 'rgba(255,153,51,0.1)', 
            display: 'flex', alignItems: 'center', justifyContent: 'center' 
          }}>
            {getIcon(note.icon)}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9rem' }}>{note.message}</div>
            <div style={{ color: 'var(--cyber-muted)', fontSize: '0.75rem', marginTop: '4px' }}>{note.timeAgo}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
