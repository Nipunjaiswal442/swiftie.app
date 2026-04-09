import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMessages, getPublicKeys } from '../../services/api';
import {
  connectSocket,
  sendMessage,
  markRead,
  onMessageReceive,
  sendTypingStart,
  sendTypingStop,
  onTypingStart,
  onTypingStop,
} from '../../services/socket';
import {
  initUserKeys,
  encryptForRecipient,
  decryptFromSender,
} from '../../services/encryption';
import { useAuthStore } from '../../store/authStore';
import ChatBubble from '../../components/ChatBubble';
import { colors } from '../../constants/theme';

export default function Chat() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuthStore();

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [recipientPublicKey, setRecipientPublicKey] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [decryptedCache, setDecryptedCache] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Derive recipient from conversationId ("idA_idB")
  useEffect(() => {
    if (!conversationId || !user?._id) return;
    const parts = (conversationId as string).split('_');
    const otherId = parts.find((p) => p !== user._id) || parts[0];
    setRecipientId(otherId);
  }, [conversationId, user?._id]);

  // Load keys + history
  useEffect(() => {
    if (!recipientId || !user?._id) return;
    const init = async () => {
      try {
        await initUserKeys(user._id);
        const keyBundle = await getPublicKeys(recipientId);
        if (keyBundle?.identityKey) setRecipientPublicKey(keyBundle.identityKey);

        const msgs = await getMessages(conversationId as string);
        setMessages(msgs);

        if (keyBundle?.identityKey) {
          const cache: Record<string, string> = {};
          for (const msg of msgs) {
            try {
              cache[msg._id] = await decryptFromSender(user._id, keyBundle.identityKey, msg.ciphertext);
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
  }, [recipientId, conversationId, user?._id]);

  // Socket listeners
  useEffect(() => {
    const setup = async () => {
      await connectSocket();

      const unsubMsg = onMessageReceive(async (msg: any) => {
        if (msg.conversationId !== conversationId) return;
        markRead(msg.messageId);

        let plaintext = '[encrypted]';
        if (recipientPublicKey && user?._id) {
          try {
            plaintext = await decryptFromSender(user._id, recipientPublicKey, msg.ciphertext);
          } catch { /* ignore */ }
        }

        setMessages((prev) => [...prev, {
          _id: msg.messageId,
          sender: msg.senderId,
          ciphertext: msg.ciphertext,
          timestamp: msg.timestamp,
        }]);
        setDecryptedCache((prev) => ({ ...prev, [msg.messageId]: plaintext }));
        flatListRef.current?.scrollToEnd({ animated: true });
      });

      const unsubTypingStart = onTypingStart(({ senderId }: any) => {
        if (senderId === recipientId) setIsTyping(true);
      });
      const unsubTypingStop = onTypingStop(({ senderId }: any) => {
        if (senderId === recipientId) setIsTyping(false);
      });

      return () => {
        unsubMsg();
        unsubTypingStart();
        unsubTypingStop();
      };
    };

    let cleanup: (() => void) | undefined;
    setup().then((fn) => { cleanup = fn; });
    return () => { cleanup?.(); };
  }, [conversationId, recipientId, recipientPublicKey, user?._id]);

  const handleInputChange = (text: string) => {
    setInput(text);
    sendTypingStart(conversationId as string, recipientId);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => sendTypingStop(conversationId as string, recipientId), 1500);
  };

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || sending || !recipientPublicKey || !user?._id) return;

    setSending(true);
    sendTypingStop(conversationId as string, recipientId);

    try {
      const ciphertext = await encryptForRecipient(user._id, recipientPublicKey, text);
      const tempId = `temp_${Date.now()}`;
      const newMsg = { _id: tempId, sender: user._id, ciphertext, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, newMsg]);
      setDecryptedCache((prev) => ({ ...prev, [tempId]: text }));
      setInput('');
      flatListRef.current?.scrollToEnd({ animated: true });
      sendMessage({ recipientId, ciphertext, messageType: 'text' });
    } catch (err) {
      console.error('Send failed', err);
    } finally {
      setSending(false);
    }
  }, [input, sending, recipientPublicKey, user?._id, recipientId, conversationId]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.cyberMuted} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>Secure Channel</Text>
          <View style={styles.e2eRow}>
            <Ionicons name="lock-closed" size={10} color={colors.green} />
            <Text style={styles.e2eLabel}> E2E Encrypted</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.saffron} />
            <Text style={styles.loadingText}>Decrypting messages...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={[...messages, ...(isTyping ? [{ _id: 'typing', isTyping: true }] : [])]}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            renderItem={({ item }) => {
              if (item.isTyping) {
                return (
                  <View style={styles.typingBubble}>
                    <Text style={styles.typingText}>typing...</Text>
                  </View>
                );
              }
              const isMine = item.sender === user?._id || item.sender?.toString() === user?._id;
              const text = decryptedCache[item._id] || '[encrypted]';
              return <ChatBubble text={text} isMine={isMine} timestamp={item.timestamp} />;
            }}
          />
        )}

        {/* Input */}
        <View style={styles.inputBar}>
          {!recipientPublicKey && !loading ? (
            <Text style={styles.noKeyText}>Recipient's encryption keys not found. Cannot send securely.</Text>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Encrypted message..."
                placeholderTextColor={colors.cyberMuted}
                value={input}
                onChangeText={handleInputChange}
                multiline
                editable={!sending && !!recipientPublicKey}
              />
              <Pressable
                onPress={handleSend}
                disabled={!input.trim() || sending}
                style={[styles.sendBtn, (!input.trim() || sending) && { opacity: 0.4 }]}
              >
                {sending ? (
                  <ActivityIndicator color="#000" size="small" />
                ) : (
                  <Ionicons name="send" size={18} color="#000" />
                )}
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,153,51,0.12)',
    backgroundColor: 'rgba(10,10,15,0.95)',
  },
  backBtn: { padding: 4 },
  headerInfo: { flex: 1 },
  headerTitle: { color: '#fff', fontWeight: '800', fontSize: 15 },
  e2eRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  e2eLabel: { color: colors.green, fontSize: 11 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { color: colors.cyberMuted, fontSize: 14 },
  messageList: { padding: 16, paddingBottom: 8 },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(0,68,204,0.1)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,68,204,0.2)',
  },
  typingText: { color: colors.cyberMuted, fontSize: 13 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,153,51,0.1)',
    backgroundColor: 'rgba(10,10,15,0.95)',
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    minHeight: 42,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sendBtn: {
    backgroundColor: colors.saffron,
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noKeyText: { flex: 1, color: colors.error, fontSize: 12, padding: 8 },
});
