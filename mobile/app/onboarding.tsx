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
import { updateMe } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { colors } from '../constants/theme';

export default function Onboarding() {
  const { user } = useAuthStore();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('Username required', 'Please enter a username to continue.');
      return;
    }
    setLoading(true);
    try {
      await updateMe({ username: username.trim(), bio: bio.trim() });
      router.replace('/(tabs)/feed');
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Failed to save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>
          <Text style={{ color: colors.saffron }}>//</Text> SETUP PROFILE
        </Text>
        <Text style={styles.subtitle}>Welcome to Swiftie! Set up your identity.</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Username *</Text>
          <TextInput
            style={styles.input}
            placeholder="@yourhandle"
            placeholderTextColor={colors.cyberMuted}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={styles.label}>Bio (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Tell the network who you are..."
            placeholderTextColor={colors.cyberMuted}
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={3}
          />

          <Pressable onPress={handleSave} disabled={loading} style={styles.btn}>
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnText}>ENTER THE NETWORK</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgDark },
  container: { padding: 20, paddingTop: 40 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff', marginBottom: 8, letterSpacing: 2 },
  subtitle: { color: colors.cyberMuted, fontSize: 14, marginBottom: 32 },
  card: {
    backgroundColor: colors.cyberCard,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,136,255,0.4)',
  },
  label: { color: colors.cyberText, fontSize: 13, fontWeight: '700', marginBottom: 8 },
  input: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    fontSize: 15,
    marginBottom: 20,
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  btn: {
    backgroundColor: colors.saffron,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  btnText: { color: '#000', fontWeight: '900', fontSize: 14, letterSpacing: 1 },
});
