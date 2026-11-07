import { Feather } from '@expo/vector-icons';
import { useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { MOOD_BY_ID } from '@/domain/constants';
import { countWords, displayTitle, entryExcerpt, tagLabel } from '@/domain/entries';
import { formatTime } from '@/domain/date';
import type { Entry } from '@/domain/types';
import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { withAlpha } from '@/utils/color';
import { AppText } from '../ui/AppText';
import { PressableScale } from '../ui/PressableScale';

interface EntryCardProps {
  entry: Entry;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  compact?: boolean;
}

export function EntryCard({ entry, onPress, style, compact = false }: EntryCardProps) {
  const { colors } = useTheme();
  const [hovered, setHovered] = useState(false);
  const mood = entry.mood ? MOOD_BY_ID[entry.mood] : null;
  const words = countWords(entry.body);

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={`Open ${displayTitle(entry)}`}
      accessibilityHint={entryExcerpt(entry.body, 90)}
      onPress={onPress}
      onHoverIn={() => setHovered(true)}
      onHoverOut={() => setHovered(false)}
      style={[
        styles.card,
        {
          backgroundColor: hovered ? colors.surfaceRaised : colors.surface,
          borderColor: hovered ? withAlpha(colors.accent, 0.32) : colors.border,
        },
        compact && styles.compact,
        style,
      ]}>
      <View style={styles.topRow}>
        {mood ? (
          <View
            style={[
              styles.mood,
              { backgroundColor: withAlpha(mood.color, 0.14), borderColor: withAlpha(mood.color, 0.28) },
            ]}>
            <AppText style={styles.moodEmoji}>{mood.emoji}</AppText>
            <AppText
              variant="caption"
              style={{ color: mood.color, fontFamily: FONTS.semibold }}>
              {mood.label}
            </AppText>
          </View>
        ) : (
          <View style={[styles.mood, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
            <Feather name="feather" size={13} color={colors.textTertiary} />
            <AppText variant="caption" style={{ color: colors.textTertiary }}>
              Entry
            </AppText>
          </View>
        )}

        <View style={styles.meta}>
          {entry.favorite ? <Feather name="bookmark" size={13} color={colors.gold} /> : null}
          <AppText variant="caption">{formatTime(entry.createdAt)}</AppText>
        </View>
      </View>

      <View style={styles.copy}>
        <AppText variant="subheading" numberOfLines={2}>
          {displayTitle(entry)}
        </AppText>
        {!compact ? (
          <AppText variant="bodySmall" numberOfLines={2} style={styles.excerpt}>
            {entryExcerpt(entry.body)}
          </AppText>
        ) : null}
      </View>

      <View style={styles.footer}>
        <View style={styles.tags}>
          {entry.tags.slice(0, 2).map((tag) => (
            <View key={tag} style={[styles.tag, { backgroundColor: colors.surfaceMuted }]}>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>
                {tagLabel(tag)}
              </AppText>
            </View>
          ))}
          {entry.tags.length > 2 ? (
            <AppText variant="caption" style={{ color: colors.textTertiary }}>
              +{entry.tags.length - 2}
            </AppText>
          ) : null}
        </View>
        <View style={styles.wordCount}>
          <AppText variant="caption">{words} {words === 1 ? 'word' : 'words'}</AppText>
          <Feather name="chevron-right" size={14} color={colors.textTertiary} />
        </View>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 17,
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 13,
  },
  compact: {
    padding: 15,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  mood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  moodEmoji: {
    fontSize: 13,
    lineHeight: 17,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  copy: {
    gap: 4,
  },
  excerpt: {
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  tags: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  wordCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
