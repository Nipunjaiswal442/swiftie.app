import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConversations } from '../hooks/useConversations';
import { ConversationItem } from '../components/ConversationItem';
import { InstallPrompt } from '../components/InstallPrompt';

export const HomePage: React.FC = () => {
  const { conversations, loading } = useConversations();
  const navigate = useNavigate();

  return (
    <div className="home-page">
      <div className="page-header">
        <h1>Chats</h1>
      </div>

      <InstallPrompt />

      {loading ? (
        <div className="loading-container">
          <div className="spinner" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="empty-state">
          <p>No conversations yet</p>
          <button className="primary-btn" onClick={() => navigate('/search')}>
            Find people to chat with
          </button>
        </div>
      ) : (
        <div className="conversation-list">
          {conversations.map((conv) => (
            <ConversationItem key={conv._id} conversation={conv} />
          ))}
        </div>
      )}
    </div>
  );
};
