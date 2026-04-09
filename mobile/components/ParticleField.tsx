import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const PARTICLE_COLORS = ['#FF9933', '#138808', '#0044CC', '#ffffff', '#66b2ff'];

function Particle({ index }: { index: number }) {
  const translateY = useRef(new Animated.Value(height * 0.8)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const x = (index / 30) * width + Math.sin(index * 1.7) * 40;
  const color = PARTICLE_COLORS[index % PARTICLE_COLORS.length];
  const size = 2 + (index % 3);
  const duration = 4000 + (index % 8) * 700;
  const delay = (index * 300) % 4000;

  useEffect(() => {
    const animate = () => {
      translateY.setValue(height * 0.9);
      opacity.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true, delay }),
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true, delay: duration - 800 }),
        ]),
        Animated.timing(translateY, {
          toValue: -50,
          duration,
          delay,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };
    animate();
  }, []);

  return (
    <Animated.View
      style={[
        styles.particle,
        {
          left: x,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    />
  );
}

export default function ParticleField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {Array.from({ length: 30 }, (_, i) => (
        <Particle key={i} index={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  particle: {
    position: 'absolute',
    bottom: 0,
  },
});
