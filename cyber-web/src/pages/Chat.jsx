import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Lock } from 'lucide-react';
import { getMessages, markMessageRead, getPublicKeys } from '../services/api';
import {
  connectSocket, sendMessage, markRead,
  onMessageReceive, sendTypingStart, sendTypingStop, onTypingStart, onTypingStop,
} from '../services/socket';
import {
  initUserKeys, encryptForRecipient, decryptFromSender,
} from '../services/encryption';

export default function Chat() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const myUser = JSON.parse(localStorage.getItem('swiftie_user') || '{}');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [decryptedCache, setDecryptedCache] = useState({});
  const bottomRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Derive recipient from conversationId (format: "idA_idB")
  useEffect(() => {
    const parts = conversationId.split('_');
    const otherId = parts.find((p) => p !== myUser._id) || parts[0];
    setRecipientId(otherId);
  }, [conversationId, myUser._id]);

  // Load recipient's public key + message history
  useEffect(() => {
    if (!recipientId) return;
    const init = async () => {
      try {
        // Ensure we have local E2E keys
        await initUserKeys(myUser._id);

        // Fetch recipient's public key for encryption
        const keyBundle = await getPublicKeys(recipientId);
        if (keyBundle?.identityKey) setRecipientPublicKey(keyBundle.identityKey);

        // Load message history
        const msgs = await getMessages(conversationId);
        setMessages(msgs);

        // Decrypt all messages
        if (keyBundle?.identityKey) {
          const cache = {};
          for (const msg of msgs) {
            try {
              const plaintext = await decryptFromSender(myUser._id, keyBundle.identityKey, msg.ciphertext);
              cache[msg._id] = plaintext;
            } catch {
              cache[msg._id] = '[encrypted]';
            }
          }
          setDecryptedCache(cache);
        }
      } catch (err) {
        console.error('Chat init failed', err);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [recipientId, conversationId, myUser._id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Socket listeners
  useEffect(() => {
    const socket = connectSocket();

    const unsubMsg = onMessageReceive(async (msg) => {
      if (msg.conversationId !== conversationId) return;
      markRead(msg.messageId);

      let plaintext = '[encrypted]';
      if (recipientPublicKey) {
        try {
          plaintext = await decryptFromSender(myUser._id, recipientPublicKey, msg.ciphertext);
        } catch { /* ignore */ }
      }

      setMessages((prev) => [...prev, { _id: msg.messageId, sender: msg.senderId, ciphertext: msg.ciphertext, timestamp: msg.timestamp }]);
      setDecryptedCache((prev) => ({ ...prev, [msg.messageId]: plaintext }));
    });

    const unsubTypingStart = onTypingStart(({ senderId }) => {
      if (senderId === recipientId) setIsTyping(true);
    });
    const unsubTypingStop = onTypingStop(({ senderId }) => {
      if (senderId === recipientId) setIsTyping(false);
    });

    return () => {
      if (unsubMsg) unsubMsg();
      if (unsubTypingStart) unsubTypingStart();
      if (unsubTypingStop) unsubTypingStop();
    };
  }, [conversationId, recipientId, recipientPublicKey, myUser._id]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    sendTypingStart(conversationId, recipientId);
    clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTypingStop(conversationId, recipientId), 1500);
  };

  const handleSend = useCallback(async (e) => {
    e?.preventDefault();
    const text = input.trim();
    if (!text || sending || !recipientPublicKey) return;

    setSending(true);
    sendTypingStop(conversationId, recipientId);

    try {
      // Encrypt message client-side before sending
      const ciphertext = await encryptForRecipient(myUser._id, recipientPublicKey, text);

      // Optimistic UI update
      const tempId = `temp_${Date.now()}`;
      setMessages((prev) => [...prev, { _id: tempId, sender: myUser._id, ciphertext, timestamp: new Date() }]);
      setDecryptedCache((prev) => ({ ...prev, [tempId]: text }));
      setInput('');

      // Send via Socket.IO (server stores only ciphertext)
      sendMessage({ recipientId, ciphertext, messageType: 'text' });
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setSending(false);
    }
  }, [input, sending, recipientPublicKey, myUser._id, recipientId, conversationId]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const timeLabel = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--bg-dark)' }}>
      {/* Header */}
      <div style={{
        padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '12px',
        borderBottom: '1px solid rgba(255,153,51,0.15)', background: 'rgba(10,10,15,0.95)',
        backdropFilter: 'blur(10px)',
      }}>
        <button onClick={() => navigate('/messages')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--cyber-muted)' }}>
          <ArrowLeft size={20} />
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem' }}>Secure Channel</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--cyber-green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Lock size={10} /> E2E Encrypted
          </div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
        {loading && (
          <p style={{ textAlign: 'center', color: 'var(--cyber-muted)', marginTop: '40px' }}>
            Decrypting messages...
          </p>
        )}

        {messages.map((msg) => {
          const isMine = msg.sender === myUser._id || msg.sender?.toString() === myUser._id;
          const plaintext = decryptedCache[msg._id] || '[encrypted]';
          return (
            <div key={msg._id} style={{ display: 'flex', justifyContent: isMine ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
              <div style={{
                maxWidth: '70%', padding: '10px 14px', borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                background: isMine ? 'rgba(255,153,51,0.2)' : 'rgba(0,68,204,0.15)',
                border: `1px solid ${isMine ? 'rgba(255,153,51,0.3)' : 'rgba(0,68,204,0.3)'}`,
              }}>
                <p style={{ margin: 0, fontSize: '0.9rem', lineHeight: 1.4 }}>{plaintext}</p>
                <div style={{ fontSize: '0.65rem', color: 'var(--cyber-muted)', marginTop: '4px', textAlign: 'right' }}>
                  {timeLabel(msg.timestamp)}
                </div>
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: '12px' }}>
            <div style={{ padding: '10px 14px', borderRadius: '16px 16px 16px 4px', background: 'rgba(0,68,204,0.1)', border: '1px solid rgba(0,68,204,0.2)' }}>
              <span style={{ fontSize: '0.85rem', color: 'var(--cyber-muted)' }}>typing...</span>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} style={{
        padding: '12px 20px', display: 'flex', gap: '10px', alignItems: 'flex-end',
        borderTop: '1px solid rgba(255,153,51,0.1)', background: 'rgba(10,10,15,0.95)',
      }}>
        {!recipientPublicKey && !loading && (
          <div style={{ flex: 1, color: '#ff4444', fontSize: '0.8rem', padding: '8px 0' }}>
            Recipient's encryption keys not found. Cannot send securely.
          </div>
        )}
        {recipientPublicKey && (
          <>
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Encrypted message..."
              rows={1}
              disabled={sending}
              style={{ flex: 1, resize: 'none', minHeight: '42px', maxHeight: '120px', padding: '10px 14px' }}
            />
            <button
              type="submit"
              disabled={!input.trim() || sending}
              style={{
                background: input.trim() ? 'var(--cyber-saffron)' : 'rgba(255,153,51,0.2)',
                border: 'none', borderRadius: '10px', padding: '10px 14px',
                cursor: input.trim() ? 'pointer' : 'not-allowed', color: '#000',
              }}
            >
              <Send size={18} />
            </button>
          </>
        )}
      </form>
    </div>
  );
}
