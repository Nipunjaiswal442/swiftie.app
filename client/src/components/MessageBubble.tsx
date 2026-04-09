import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Message } from '../types/message';
import { formatTime } from '../utils/formatDate';

interface Props {
  message: Message;
}

export const MessageBubble: React.FC<Props> = ({ message }) => {
  const { user } = useAuth();
  const senderId = typeof message.senderId === 'string' ? message.senderId : message.senderId._id;
  const isMine = senderId === user?._id;

  return (
    <div className={`message-bubble ${isMine ? 'mine' : 'theirs'}`}>
      <div className="bubble-content">
        {message.type === 'image' && message.plaintext ? (
          <img src={message.plaintext} alt="Shared" className="message-image" />
        ) : (
          <p>{message.plaintext || message.ciphertext}</p>
        )}
        <span className="message-time">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
};
