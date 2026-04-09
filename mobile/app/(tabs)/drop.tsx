import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { createPost } from '../../services/api';
import { colors } from '../../constants/theme';

const CATEGORIES = ['General', 'Tech', 'Gigs', 'Art'];

export default function Drop() {
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('General');
  const [loading, setLoading] = useState(false);

  const handlePost = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      await createPost({ caption: content.trim(), category });
      setContent('');
      router.push('/(tabs)/feed');
    } catch (err) {
      Alert.alert('Broadcast failed', 'Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          <Text style={{ color: colors.saffron }}>//</Text>
          <Text style={{ color: colors.green }}> NEW DROP</Text>
        </Text>

        <View style={styles.card}>
          <TextInput
            style={styles.textArea}
            placeholder="What's happening in the sprawl?"
            placeholderTextColor={colors.cyberMuted}
            multiline
            numberOfLines={5}
            value={content}
            onChangeText={setContent}
            editable={!loading}
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.categoryRow}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => setCategory(cat)}
                style={[
                  styles.categoryBtn,
                  category === cat && { backgroundColor: colors.saffron, borderColor: colors.saffron },
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  category === cat && { color: '#000' },
                ]}>
                  {cat}
                </Text>
              </Pressable>
            ))}
          </View>

          <Pressable
            onPress={handlePost}
            disabled={!content.trim() || loading}
            style={[
              styles.btn,
              (!content.trim() || loading) && { opacity: 0.5 },
            ]}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>BROADCAST</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: 2, marginBottom: 20 },
  card: {
    backgroundColor: colors.cyberCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,136,255,0.4)',
  },
  textArea: {
    color: '#fff',
    fontSize: 15,
    minHeight: 120,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  label: { color: colors.cyberText, fontSize: 13, fontWeight: '700', marginBottom: 10 },
  categoryRow: { flexDirection: 'row', gap: 8, marginBottom: 24 },
  categoryBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  categoryText: { color: colors.cyberText, fontWeight: '700', fontSize: 13 },
  btn: {
    backgroundColor: colors.saffron,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  btnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
