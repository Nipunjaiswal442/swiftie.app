import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');
const CELL = 40;
const COLS = Math.ceil(width / CELL) + 1;
const ROWS = Math.ceil(height / CELL) + 1;

export default function GridBackground() {
  const pulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.7, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.3, duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulse }]} pointerEvents="none">
      {/* Vertical lines */}
      {Array.from({ length: COLS }, (_, i) => (
        <View
          key={`v${i}`}
          style={[styles.vLine, { left: i * CELL }]}
        />
      ))}
      {/* Horizontal lines */}
      {Array.from({ length: ROWS }, (_, i) => (
        <View
          key={`h${i}`}
          style={[styles.hLine, { top: i * CELL }]}
        />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  vLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(0, 68, 204, 0.12)',
  },
  hLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(0, 68, 204, 0.12)',
  },
});
