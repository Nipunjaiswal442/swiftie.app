import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react';
import { getConversations } from '../services/api';
import { connectSocket, onMessageReceive } from '../services/socket';

export default function Messages() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);

  const myUser = JSON.parse(localStorage.getItem('swiftie_user') || '{}');

  useEffect(() => {
    const socket = connectSocket();
    const unsub = onMessageReceive(() => {
      // Refresh conversations when a new message arrives
      getConversations().then(setConversations).catch(() => {});
    });

    getConversations()
      .then(setConversations)
      .catch((err) => console.error('Conversations load failed', err))
      .finally(() => setLoading(false));

    return () => {
      if (unsub) unsub();
    };
  }, []);

  const getOtherParticipant = (convo) =>
    convo.participants?.find((p) => p._id !== myUser._id) || convo.participants?.[0];

  const timeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  };

  return (
    <div className="page-container">
      <h1 className="page-header">
        <span className="neon-saffron">// SECURE</span>
        <span className="neon-green"> COMMS</span>
      </h1>

      {loading && (
        <p style={{ color: 'var(--cyber-muted)', textAlign: 'center', marginTop: '40px' }}>
          Establishing secure channels...
        </p>
      )}

      {!loading && conversations.length === 0 && (
        <div style={{ textAlign: 'center', marginTop: '60px', color: 'var(--cyber-muted)' }}>
          <MessageSquare size={40} style={{ opacity: 0.3, marginBottom: '12px' }} />
          <p>No conversations yet.</p>
          <p style={{ fontSize: '0.85rem' }}>Start chatting from a user's profile.</p>
        </div>
      )}

      {conversations.map((convo) => {
        const other = getOtherParticipant(convo);
        const unread = convo.unreadCount?.[myUser._id] || 0;
        return (
          <div
            key={convo._id}
            className="cyber-card"
            onClick={() => navigate(`/chat/${convo.conversationId}`)}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={other?.profilePhotoUrl || `https://i.pravatar.cc/150?u=${other?._id}`}
                alt="avatar"
                style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--cyber-blue)' }}
              />
              {other?.isOnline && (
                <div style={{
                  position: 'absolute', bottom: 2, right: 2,
                  width: 10, height: 10, borderRadius: '50%',
                  background: 'var(--cyber-green)', border: '2px solid var(--bg-dark)'
                }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, marginBottom: '2px' }}>{other?.displayName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--cyber-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                🔒 encrypted message
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--cyber-muted)' }}>
                {timeAgo(convo.lastMessage?.timestamp)}
              </span>
              {unread > 0 && (
                <span style={{
                  background: 'var(--cyber-saffron)', color: '#000',
                  borderRadius: '12px', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 800,
                }}>
                  {unread}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
