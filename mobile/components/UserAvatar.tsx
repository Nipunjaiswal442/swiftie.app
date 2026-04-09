import React from 'react';
import { Image, View, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  uri?: string;
  userId?: string;
  size?: number;
  bordered?: boolean;
  onlineIndicator?: boolean;
  isOnline?: boolean;
}

export default function UserAvatar({
  uri,
  userId,
  size = 40,
  bordered = false,
  onlineIndicator = false,
  isOnline = false,
}: Props) {
  const source = uri
    ? { uri }
    : { uri: `https://i.pravatar.cc/150?u=${userId || 'default'}` };

  return (
    <View style={{ width: size, height: size }}>
      <Image
        source={source}
        style={[
          styles.avatar,
          { width: size, height: size, borderRadius: size / 2 },
          bordered && { borderWidth: 2, borderColor: colors.saffron },
        ]}
      />
      {onlineIndicator && (
        <View
          style={[
            styles.indicator,
            {
              width: size * 0.28,
              height: size * 0.28,
              borderRadius: size * 0.14,
              backgroundColor: isOnline ? colors.green : colors.cyberMuted,
              bottom: 0,
              right: 0,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    backgroundColor: '#050b14',
  },
  indicator: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: colors.bgDark,
  },
});
