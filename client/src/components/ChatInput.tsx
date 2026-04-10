import React, { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { storage } from '../config/firebase';
import { useAuth } from '../context/AuthContext';
import { compressImage } from '../utils/compressImage';

interface Props {
  onSend: (text: string, type?: 'text' | 'image', photoUrl?: string) => void;
  onTyping: (isTyping: boolean) => void;
}

export const ChatInput: React.FC<Props> = ({ onSend, onTyping }) => {
  const [text, setText] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { firebaseUser } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onSend(text.trim());
      setText('');
      onTyping(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !firebaseUser) return;

    setUploading(true);
    try {
      const compressed = await compressImage(file);
      const storageRef = ref(
        storage,
        `users/${firebaseUser.uid}/photos/${uuidv4()}.jpg`
      );
      const snapshot = await uploadBytesResumable(storageRef, compressed);
      const url = await getDownloadURL(snapshot.ref);
      onSend(url, 'image', url);
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <form className="chat-input" onSubmit={handleSubmit}>
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handlePhotoUpload}
      />
      <button
        type="button"
        className="attach-btn"
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
      >
        📷
      </button>
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          onTyping(e.target.value.length > 0);
        }}
        placeholder={uploading ? 'Uploading...' : 'Type a message...'}
        disabled={uploading}
      />
      <button type="submit" className="send-btn" disabled={!text.trim() || uploading}>
        ➤
      </button>
    </form>
  );
};
