import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { makeRedirectUri } from 'expo-auth-session';
import { colors } from '../constants/theme';
import AshokaCiakra from '../components/AshokaCiakra';
import ParticleField from '../components/ParticleField';
import GridBackground from '../components/GridBackground';
import TricolourBar from '../components/TricolourBar';
import {
  FeaturesSection,
  TechSection,
  SecuritySection,
  StatsSection,
} from '../components/LandingSections';
import { useAuthStore } from '../store/authStore';
import { signInWithGoogleCredential } from '../services/firebase';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth client IDs — replace with your actual IDs
const WEB_CLIENT_ID = '658364785258-web.apps.googleusercontent.com';
const IOS_CLIENT_ID = '658364785258-ios.apps.googleusercontent.com';
const ANDROID_CLIENT_ID = '658364785258-android.apps.googleusercontent.com';

const SWIFTIE_LETTERS = [
  { char: 'S', color: colors.saffron },
  { char: 'W', color: colors.white },
  { char: 'I', color: colors.green },
  { char: 'F', color: colors.saffron },
  { char: 'T', color: colors.white },
  { char: 'I', color: colors.green },
  { char: 'E', color: colors.saffron },
];

export default function Welcome() {
  const { login } = useAuthStore();
  const [signingIn, setSigningIn] = useState(false);

  const [, response, promptAsync] = Google.useAuthRequest({
    webClientId: WEB_CLIENT_ID,
    iosClientId: IOS_CLIENT_ID,
    androidClientId: ANDROID_CLIENT_ID,
    redirectUri: makeRedirectUri({ scheme: 'swiftie' }),
  });

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await promptAsync();
      if (result?.type === 'success') {
        const { id_token } = result.params;
        if (!id_token) throw new Error('No ID token returned');
        await signInWithGoogleCredential(id_token);
        await login(id_token);
      } else if (result?.type === 'error') {
        Alert.alert('Sign-in failed', result.error?.message || 'Unknown error');
      }
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Sign in failed. Please try again.');
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TricolourBar />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Background */}
        <GridBackground />
        <ParticleField />

        {/* Hero */}
        <View style={styles.hero}>
          {/* Nav Bar */}
          <View style={styles.nav}>
            <Text style={styles.navBrand}>SWIFTIE</Text>
            <Text style={styles.navTagline}>Connect. Chat. Encrypt.</Text>
          </View>

          {/* Ashoka Chakra */}
          <View style={styles.chakraContainer}>
            <AshokaCiakra size={200} />
          </View>

          {/* Title */}
          <View style={styles.titleRow}>
            {SWIFTIE_LETTERS.map((l, i) => (
              <Text key={i} style={[styles.titleLetter, { color: l.color }]}>
                {l.char}
              </Text>
            ))}
          </View>

          <Text style={styles.subtitle}>
            India's most secure social media.{'\n'}
            <Text style={{ color: colors.saffron }}>E2E Encrypted.</Text>{' '}
            <Text style={{ color: colors.green }}>Real-time.</Text>{' '}
            <Text style={{ color: colors.cyberBlue }}>Yours.</Text>
          </Text>

          {/* CTA */}
          <Pressable onPress={handleSignIn} disabled={signingIn} style={styles.ctaWrapper}>
            <LinearGradient
              colors={[colors.saffron, 'rgba(255,255,255,0.9)', colors.green]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {signingIn ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.ctaText}>USE SWIFTIE — Sign in with Google</Text>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={styles.heroFootnote}>
            🔐 Your messages are encrypted before they leave your device
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        <FeaturesSection />
        <View style={styles.divider} />
        <TechSection />
        <View style={styles.divider} />
        <SecuritySection />
        <View style={styles.divider} />
        <StatsSection />

        {/* Final CTA */}
        <View style={styles.finalCta}>
          <Pressable onPress={handleSignIn} disabled={signingIn}>
            <LinearGradient
              colors={[colors.saffron, 'rgba(255,255,255,0.8)', colors.green]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {signingIn ? (
                <ActivityIndicator color="#000" />
              ) : (
                <Text style={styles.ctaText}>JOIN THE NETWORK</Text>
              )}
            </LinearGradient>
          </Pressable>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TricolourBar />
          <Text style={styles.footerText}>
            SWIFTIE © 2025 · Made with ❤️ in India
          </Text>
          <Text style={styles.footerSub}>
            Powered by ECDH P-256 + AES-256-GCM encryption
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 0,
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: 600,
    justifyContent: 'center',
  },
  nav: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  navBrand: {
    color: colors.saffron,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  navTagline: {
    color: colors.cyberMuted,
    fontSize: 11,
    letterSpacing: 1,
  },
  chakraContainer: {
    marginBottom: 24,
    shadowColor: colors.chakraBlue,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 30,
  },
  titleRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  titleLetter: {
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 6,
    textShadowColor: 'rgba(255,255,255,0.3)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: colors.cyberMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  ctaWrapper: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  ctaGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  ctaText: {
    color: '#000',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 1,
  },
  heroFootnote: {
    color: colors.cyberMuted,
    fontSize: 12,
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,136,255,0.15)',
    marginHorizontal: 20,
  },
  finalCta: {
    padding: 24,
  },
  footer: {
    paddingTop: 24,
    paddingBottom: 40,
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: colors.cyberMuted,
    fontSize: 13,
    marginTop: 16,
  },
  footerSub: {
    color: 'rgba(77,136,204,0.5)',
    fontSize: 11,
  },
});
