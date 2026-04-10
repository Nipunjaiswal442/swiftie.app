import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../hooks/useChat';
import { getConversation } from '../services/conversationService';
import { MessageBubble } from '../components/MessageBubble';
import { ChatInput } from '../components/ChatInput';
import { User } from '../types/user';

export const ChatPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [otherUser, setOtherUser] = useState<User | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadConversation = async () => {
      if (!id) return;
      try {
        const data = await getConversation(id);
        const other = data.conversation.participants.find(
          (p: User) => p._id !== user?._id
        );
        setOtherUser(other || null);
      } catch {
        navigate('/');
      }
    };
    loadConversation();
  }, [id, user, navigate]);

  const { messages, loading, typing, sendMessage, sendTyping } = useChat(
    id || '',
    otherUser?._id || ''
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!id || !otherUser) {
    return (
      <div className="loading-container">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="back-btn" onClick={() => navigate('/')}>
          ←
        </button>
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            {otherUser.profilePhotoUrl ? (
              <img src={otherUser.profilePhotoUrl} alt="" />
            ) : (
              <div className="avatar-placeholder small">
                {otherUser.displayName?.charAt(0)?.toUpperCase() || '?'}
              </div>
            )}
          </div>
          <div>
            <span className="chat-header-name">
              {otherUser.displayName || otherUser.email}
            </span>
            {typing && <span className="typing-indicator">typing...</span>}
          </div>
        </div>
      </div>

      <div className="messages-container">
        {loading ? (
          <div className="loading-container">
            <div className="spinner" />
          </div>
        ) : messages.length === 0 ? (
          <div className="empty-chat">
            <p>Send a message to start chatting</p>
            <span className="lock-icon">🔒</span>
            <p className="e2e-notice">Messages are end-to-end encrypted</p>
          </div>
        ) : (
          messages.map((msg) => <MessageBubble key={msg._id} message={msg} />)
        )}
        <div ref={messagesEndRef} />
      </div>

      <ChatInput onSend={sendMessage} onTyping={sendTyping} />
    </div>
  );
};
