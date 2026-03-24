import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Conversation } from '../types/conversation';
import { formatDate } from '../utils/formatDate';

interface Props {
  conversation: Conversation;
}

export const ConversationItem: React.FC<Props> = ({ conversation }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const otherParticipant = conversation.participants.find((p) => p._id !== user?._id);
  if (!otherParticipant) return null;

  return (
    <div
      className="conversation-item"
      onClick={() => navigate(`/chat/${conversation._id}`)}
    >
      <div className="conversation-avatar">
        {otherParticipant.profilePhotoUrl ? (
          <img src={otherParticipant.profilePhotoUrl} alt="" />
        ) : (
          <div className="avatar-placeholder">
            {otherParticipant.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className="conversation-info">
        <div className="conversation-header">
          <span className="conversation-name">{otherParticipant.displayName || otherParticipant.email}</span>
          {conversation.lastMessage && (
            <span className="conversation-time">
              {formatDate(conversation.lastMessage.timestamp)}
            </span>
          )}
        </div>
        <p className="conversation-preview">
          {conversation.lastMessage ? 'Encrypted message' : 'Start chatting'}
        </p>
      </div>
    </div>
  );
};
