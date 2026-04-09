import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

export default function TricolourBar() {
  return (
    <View style={styles.bar}>
      <View style={[styles.stripe, { backgroundColor: colors.saffron }]} />
      <View style={[styles.stripe, { backgroundColor: colors.white }]} />
      <View style={[styles.stripe, { backgroundColor: colors.green }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    height: 4,
    width: '100%',
    shadowColor: colors.saffron,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  stripe: {
    flex: 1,
  },
});
