import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../constants/theme';

interface Props {
  text: string;
  isMine: boolean;
  timestamp: string;
}

function timeLabel(ts: string) {
  return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export default function ChatBubble({ text, isMine, timestamp }: Props) {
  return (
    <View style={[styles.row, { justifyContent: isMine ? 'flex-end' : 'flex-start' }]}>
      <View
        style={[
          styles.bubble,
          isMine
            ? { borderRadius: 16, borderBottomRightRadius: 4, backgroundColor: 'rgba(255,153,51,0.15)', borderColor: 'rgba(255,153,51,0.3)' }
            : { borderRadius: 16, borderBottomLeftRadius: 4, backgroundColor: 'rgba(0,68,204,0.12)', borderColor: 'rgba(0,68,204,0.3)' },
        ]}
      >
        <Text style={styles.text}>{text}</Text>
        <Text style={styles.time}>{timeLabel(timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  bubble: {
    maxWidth: '72%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
  },
  text: {
    color: '#fff',
    fontSize: 14,
    lineHeight: 20,
  },
  time: {
    color: colors.cyberMuted,
    fontSize: 10,
    textAlign: 'right',
    marginTop: 4,
  },
});
