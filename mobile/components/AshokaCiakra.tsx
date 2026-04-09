import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

interface Props {
  size?: number;
}

export default function AshokaCiakra({ size = 180 }: Props) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 12000,
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const spokeLen = r * 0.78;

  // Generate 24 Ashoka Chakra spokes
  const spokes = Array.from({ length: 24 }, (_, i) => {
    const angle = (i * 360) / 24;
    const rad = (angle * Math.PI) / 180;
    const x1 = cx + Math.cos(rad) * (r * 0.22);
    const y1 = cy + Math.sin(rad) * (r * 0.22);
    const x2 = cx + Math.cos(rad) * spokeLen;
    const y2 = cy + Math.sin(rad) * spokeLen;
    return { x1, y1, x2, y2, key: i };
  });

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Outer glow rings */}
      <View style={{
        position: 'absolute',
        width: size * 1.1,
        height: size * 1.1,
        borderRadius: size * 0.55,
        borderWidth: 1,
        borderColor: 'rgba(0,68,204,0.15)',
      }} />
      <View style={{
        position: 'absolute',
        width: size * 1.25,
        height: size * 1.25,
        borderRadius: size * 0.625,
        borderWidth: 1,
        borderColor: 'rgba(0,68,204,0.08)',
      }} />

      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <Svg width={size} height={size}>
          {/* Outer ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="#0044CC"
            strokeWidth={size * 0.022}
            opacity={0.9}
          />
          {/* Inner ring */}
          <Circle
            cx={cx}
            cy={cy}
            r={r * 0.22}
            fill="#0044CC"
            opacity={0.9}
          />
          {/* Hub glow */}
          <Circle
            cx={cx}
            cy={cy}
            r={r * 0.12}
            fill="#66aaff"
            opacity={0.7}
          />
          {/* Spokes */}
          {spokes.map((spoke) => (
            <Line
              key={spoke.key}
              x1={spoke.x1}
              y1={spoke.y1}
              x2={spoke.x2}
              y2={spoke.y2}
              stroke="#0044CC"
              strokeWidth={size * 0.013}
              strokeLinecap="round"
              opacity={0.85}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}
