import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { colors } from '../constants/theme';

// ── Features ─────────────────────────────────────────────────
const FEATURES = [
  { icon: '🔐', title: 'E2E Encryption', desc: 'Military-grade ECDH P-256 + AES-256-GCM' },
  { icon: '⚡', title: 'Real-time', desc: 'Socket.IO powered instant messaging' },
  { icon: '🇮🇳', title: 'Made in India', desc: 'Built for Bharat, by Bharat' },
  { icon: '🌐', title: 'Social Feed', desc: 'Share drops, follow the network' },
  { icon: '🔑', title: 'Zero Knowledge', desc: 'Server stores only ciphertext' },
  { icon: '📱', title: 'Cross Platform', desc: 'iOS, Android & Web from one codebase' },
];

export function FeaturesSection() {
  return (
    <Animated.View entering={FadeInUp.duration(450)} style={styles.section}>
      <Text style={styles.sectionTitle}>
        <Text style={{ color: colors.saffron }}>//</Text> FEATURES
      </Text>
      <View style={styles.grid}>
        {FEATURES.map((f, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(i * 70).duration(420)} style={styles.featureCard}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureTitle}>{f.title}</Text>
            <Text style={styles.featureDesc}>{f.desc}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Tech Stack ───────────────────────────────────────────────
const TECH = [
  { name: 'React Native', color: colors.cyberBlue },
  { name: 'Expo SDK 52', color: colors.saffron },
  { name: 'Node.js', color: colors.green },
  { name: 'MongoDB', color: '#00ED64' },
  { name: 'Socket.IO', color: '#010101' },
  { name: 'Firebase', color: '#FFCA28' },
  { name: '@noble/curves', color: colors.saffron },
  { name: 'Zustand', color: '#FF6B6B' },
  { name: 'TypeScript', color: '#3178C6' },
  { name: 'Vercel', color: '#ffffff' },
];

export function TechSection() {
  return (
    <Animated.View entering={FadeInUp.duration(450)} style={styles.section}>
      <Text style={styles.sectionTitle}>
        <Text style={{ color: colors.green }}>//</Text> TECH STACK
      </Text>
      <View style={styles.techGrid}>
        {TECH.map((t, i) => (
          <Animated.View
            key={i}
            entering={FadeInUp.delay(i * 45).duration(350)}
            style={[styles.techPill, { borderColor: t.color }]}
          >
            <Text style={[styles.techText, { color: t.color }]}>{t.name}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Security Flow ────────────────────────────────────────────
export function SecuritySection() {
  return (
    <Animated.View entering={FadeInUp.duration(450)} style={styles.section}>
      <Text style={styles.sectionTitle}>
        <Text style={{ color: colors.saffron }}>//</Text> ENCRYPTION FLOW
      </Text>
      <View style={styles.flowContainer}>
        <FlowNode icon="🔑" label="ECDH P-256" sub="Key Exchange" color={colors.saffron} />
        <View style={styles.flowArrow}>
          <Text style={{ color: colors.cyberMuted }}>→</Text>
        </View>
        <FlowNode icon="🔒" label="AES-256-GCM" sub="Encrypt" color={colors.green} />
        <View style={styles.flowArrow}>
          <Text style={{ color: colors.cyberMuted }}>→</Text>
        </View>
        <FlowNode icon="📡" label="Ciphertext" sub="Server Stores" color={colors.cyberBlue} />
      </View>
      <Text style={styles.securityNote}>
        Your plaintext never leaves your device. The server handles only ciphertext.
      </Text>
    </Animated.View>
  );
}

function FlowNode({ icon, label, sub, color }: { icon: string; label: string; sub: string; color: string }) {
  return (
    <View style={[styles.flowNode, { borderColor: color }]}>
      <Text style={styles.flowIcon}>{icon}</Text>
      <Text style={[styles.flowLabel, { color }]}>{label}</Text>
      <Text style={styles.flowSub}>{sub}</Text>
    </View>
  );
}

// ── Stats ────────────────────────────────────────────────────
const STATS = [
  { value: '256-bit', label: 'AES Key' },
  { value: 'P-256', label: 'Curve' },
  { value: '0', label: 'Plaintext stored' },
  { value: '∞', label: 'Privacy' },
];

export function StatsSection() {
  return (
    <Animated.View entering={FadeInUp.duration(450)} style={styles.section}>
      <View style={styles.statsRow}>
        {STATS.map((s, i) => (
          <Animated.View key={i} entering={FadeInUp.delay(i * 80).duration(400)} style={styles.statBox}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
}

// ── Styles ───────────────────────────────────────────────────
const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 20,
    letterSpacing: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '47%',
    backgroundColor: 'rgba(5,11,20,0.9)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,136,255,0.3)',
  },
  featureIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  featureTitle: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 4,
  },
  featureDesc: {
    color: colors.cyberMuted,
    fontSize: 11,
    lineHeight: 16,
  },
  techGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  techPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  techText: {
    fontSize: 12,
    fontWeight: '700',
  },
  flowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 16,
  },
  flowNode: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'rgba(5,11,20,0.9)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
  },
  flowIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  flowLabel: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  flowSub: {
    fontSize: 10,
    color: colors.cyberMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  flowArrow: {
    paddingHorizontal: 4,
  },
  securityNote: {
    color: colors.cyberMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cyberBlue,
  },
  statValue: {
    color: colors.saffron,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  statLabel: {
    color: colors.cyberMuted,
    fontSize: 10,
    textAlign: 'center',
  },
  cyberMuted: {
    color: colors.cyberMuted,
  },
});
