import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Animated, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { DICTATION_LANGUAGES } from '@/domain/constants';
import { formatDuration } from '@/domain/date';
import type { DictationStatus } from '@/hooks/useDictation';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { FONTS } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { AppText } from '../ui/AppText';
import { Button } from '../ui/Button';
import { SheetModal } from '../ui/SheetModal';
import { VoiceWave } from './VoiceWave';

interface DictationPanelProps {
  visible: boolean;
  status: DictationStatus;
  error: string | null;
  volume: number;
  elapsedMs: number;
  interimPreview: string;
  stablePreview: string;
  language: string;
  canRetry?: boolean;
  onFinish: () => void;
  onDismiss: () => void;
  onRetry: () => void;
}

function PulseDot({ color }: { color: string }) {
  const [opacity] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.25,
          duration: 650,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 650,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reducedMotion]);

  return <Animated.View style={[styles.dot, { backgroundColor: color, opacity }]} />;
}

export function DictationPanel({
  visible,
  status,
  error,
  volume,
  elapsedMs,
  interimPreview,
  stablePreview,
  language,
  canRetry = true,
  onFinish,
  onDismiss,
  onRetry,
}: DictationPanelProps) {
  const { colors } = useTheme();
  const hasError = status === 'error' && Boolean(error);
  const active = status === 'starting' || status === 'listening' || status === 'stopping';
  const preview = `${stablePreview}${stablePreview && interimPreview ? ' ' : ''}${interimPreview}`;
  const languageLabel =
    DICTATION_LANGUAGES.find((item) => item.code === language)?.label ?? language;

  const statusLabel = hasError
    ? 'Dictation paused'
    : status === 'starting'
      ? 'Getting ready'
      : status === 'stopping'
        ? 'Finishing up'
        : 'Listening';

  return (
    <SheetModal
      visible={visible}
      onClose={active ? onFinish : onDismiss}
      title={statusLabel}
      subtitle={
        hasError
          ? 'Your words are safe. You can pick up again whenever you like.'
          : 'Speak naturally. d-dairy will tidy the punctuation as you go.'
      }
      testID="dictation-panel">
      <View style={styles.content}>
        {hasError ? (
          <View
            style={[
              styles.errorCard,
              { backgroundColor: colors.dangerSoft, borderColor: colors.danger },
            ]}>
            <Feather name="alert-circle" size={20} color={colors.danger} />
            <AppText variant="bodySmall" style={{ color: colors.danger, flex: 1 }}>
              {error}
            </AppText>
          </View>
        ) : (
          <>
            <LinearGradient
              colors={[colors.surfaceTint, colors.surfaceRaised]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[styles.hero, { borderColor: colors.border }]}>
              <View style={styles.statusRow}>
                <View style={styles.statusLeft}>
                  <PulseDot color={colors.micActive} />
                  <AppText
                    variant="bodySmall"
                    style={{ color: colors.text, fontFamily: FONTS.semibold }}>
                    {statusLabel}
                  </AppText>
                </View>
                <View style={[styles.timer, { backgroundColor: colors.surface }]}>
                  <AppText variant="caption" style={{ color: colors.textSecondary }}>
                    {formatDuration(elapsedMs)}
                  </AppText>
                </View>
              </View>

              <VoiceWave
                active={status === 'listening'}
                level={volume}
                color={colors.waveform}
                mutedColor={colors.waveformMuted}
                bars={26}
                height={62}
                style={styles.wave}
              />

              <View style={styles.languageRow}>
                <Feather name="globe" size={12} color={colors.textTertiary} />
                <AppText variant="caption">{languageLabel}</AppText>
                <View style={[styles.dividerDot, { backgroundColor: colors.textTertiary }]} />
                <AppText variant="caption">Live speech recognition</AppText>
              </View>
            </LinearGradient>

            <View
              style={[
                styles.preview,
                { backgroundColor: colors.surfaceRaised, borderColor: colors.border },
              ]}>
              {preview.trim() ? (
                <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
                  <AppText variant="body" style={styles.previewText}>
                    {preview}
                  </AppText>
                </ScrollView>
              ) : (
                <View style={styles.placeholder}>
                  <Feather name="mic" size={17} color={colors.textTertiary} />
                  <AppText variant="bodySmall" align="center">
                    Start talking — your words will appear here.
                  </AppText>
                </View>
              )}
            </View>

            <View style={styles.tips}>
              <AppText variant="label">Try saying</AppText>
              <View style={styles.tipRow}>
                {['“comma”', '“new paragraph”', '“question mark”'].map((tip) => (
                  <View
                    key={tip}
                    style={[
                      styles.tip,
                      { backgroundColor: colors.surfaceMuted, borderColor: colors.border },
                    ]}>
                    <AppText variant="caption" style={{ color: colors.textSecondary }}>
                      {tip}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <View style={styles.actions}>
          {hasError ? (
            <>
              {canRetry ? (
                <Button label="Try again" icon="mic" onPress={onRetry} style={styles.flex} />
              ) : null}
              <Button
                label="Keep writing"
                onPress={onDismiss}
                variant={canRetry ? 'secondary' : 'primary'}
                style={styles.flex}
              />
            </>
          ) : (
            <Button
              label={status === 'stopping' ? 'Finishing…' : 'Done dictating'}
              icon="check"
              onPress={onFinish}
              loading={status === 'stopping'}
              style={styles.flex}
            />
          )}
        </View>

        <View style={styles.privacy}>
          <Feather name="shield" size={12} color={colors.textTertiary} />
          <AppText variant="caption" align="center">
            Your voice is transcribed by your device’s speech engine. d-dairy stores only the words
            you keep.
          </AppText>
        </View>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    paddingBottom: 8,
  },
  hero: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    padding: 18,
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timer: {
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  wave: {
    marginVertical: 10,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  dividerDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    opacity: 0.5,
  },
  preview: {
    minHeight: 92,
    maxHeight: 150,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    padding: 15,
  },
  previewScroll: {
    maxHeight: 118,
  },
  previewText: {
    lineHeight: 24,
  },
  placeholder: {
    minHeight: 62,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  tips: {
    gap: 7,
  },
  tipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tip: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 16,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    paddingTop: 4,
  },
  flex: {
    flexGrow: 1,
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 10,
  },
});
