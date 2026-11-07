import { Feather } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/AppText';
import { IconButton } from '@/components/ui/IconButton';
import { PressableScale } from '@/components/ui/PressableScale';
import { SheetModal } from '@/components/ui/SheetModal';
import { useApp } from '@/context/AppProvider';
import { DICTATION_LANGUAGES } from '@/domain/constants';
import { createEmptyData } from '@/domain/defaults';
import { formatTime } from '@/domain/date';
import { useHaptics } from '@/hooks/useHaptics';
import { useResponsive } from '@/hooks/useResponsive';
import { FONTS, TAB_BAR_INSET } from '@/theme/colors';
import { useTheme } from '@/theme/ThemeProvider';
import { confirmDestructive } from '@/utils/confirm';
import { exportJournal } from '@/utils/export';

const THEMES = [
  { id: 'system' as const, label: 'System', icon: 'smartphone' as const },
  { id: 'light' as const, label: 'Light', icon: 'sun' as const },
  { id: 'dark' as const, label: 'Dark', icon: 'moon' as const },
];

export default function SettingsScreen() {
  const { state, dispatch, saveState, lastSavedAt, storageError, saveNow } = useApp();
  const { colors } = useTheme();
  const { gutters } = useResponsive();
  const insets = useSafeAreaInsets();
  const triggerHaptic = useHaptics();
  const [languageOpen, setLanguageOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportNote, setExportNote] = useState<string | null>(null);

  const selectedLanguage =
    DICTATION_LANGUAGES.find((language) => language.code === state.settings.dictationLanguage) ??
    DICTATION_LANGUAGES[0];
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const setSetting = <K extends keyof typeof state.settings>(key: K, value: (typeof state.settings)[K]) => {
    dispatch({ type: 'UPDATE_SETTINGS', changes: { [key]: value } });
  };

  const handleExport = async () => {
    setExporting(true);
    setExportNote(null);
    try {
      const result = await exportJournal(state);
      setExportNote(result === 'downloaded' ? 'Markdown file downloaded.' : 'Your pages are ready to share.');
      triggerHaptic('success');
    } catch {
      setExportNote('The export could not be opened. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleReset = () => {
    confirmDestructive(
      'Erase everything?',
      'All books and entries will be removed from this device. Your main diary will be recreated empty.',
      () => {
        dispatch({ type: 'RESET_DATA', data: createEmptyData() });
        triggerHaptic('warning');
      },
    );
  };

  return (
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingHorizontal: gutters,
            paddingBottom: TAB_BAR_INSET + insets.bottom,
            maxWidth: 920,
            alignSelf: 'center',
            width: '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <AppText variant="label">Make it yours</AppText>
          <AppText variant="display" style={styles.title}>
            Settings
          </AppText>
          <AppText variant="body" style={styles.subtitle}>
            Shape how d-dairy listens, looks, and keeps your words.
          </AppText>
        </View>

        <Section title="Appearance">
          <View style={styles.themeRow}>
            {THEMES.map((theme) => {
              const selected = state.settings.theme === theme.id;
              return (
                <PressableScale
                  key={theme.id}
                  accessibilityRole="radio"
                  accessibilityLabel={`${theme.label} appearance`}
                  accessibilityState={{ selected }}
                  onPress={() => {
                    setSetting('theme', theme.id);
                    triggerHaptic('light');
                  }}
                  haptic="light"
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: selected ? colors.accentSoft : colors.surfaceRaised,
                      borderColor: selected ? colors.accent : colors.border,
                    },
                  ]}>
                  <Feather
                    name={theme.icon}
                    size={17}
                    color={selected ? colors.accent : colors.textSecondary}
                  />
                  <AppText
                    variant="bodySmall"
                    style={{
                      color: selected ? colors.accent : colors.textSecondary,
                      fontFamily: selected ? FONTS.semibold : FONTS.medium,
                    }}>
                    {theme.label}
                  </AppText>
                </PressableScale>
              );
            })}
          </View>
        </Section>

        <Section title="Voice & writing">
          <SettingsRow
            icon="globe"
            title="Dictation language"
            description="Used by your device's speech engine."
            onPress={() => setLanguageOpen(true)}
            trailing={
              <View style={styles.rowTrailing}>
                <AppText variant="bodySmall">{selectedLanguage.label}</AppText>
                <Feather name="chevron-right" size={16} color={colors.textTertiary} />
              </View>
            }
          />
          <Divider />
          <SettingsRow
            icon="type"
            title="Smart punctuation"
            description="Adds full stops, capitals, and respects spoken punctuation."
            control={
              <Switch
                accessibilityLabel="Smart punctuation"
                value={state.settings.smartPunctuation}
                onValueChange={(value) => {
                  setSetting('smartPunctuation', value);
                  triggerHaptic('light');
                }}
                trackColor={{ false: colors.surfaceMuted, true: colors.accentSoft }}
                thumbColor={state.settings.smartPunctuation ? colors.accent : colors.borderStrong}
              />
            }
          />
          <Divider />
          <SettingsRow
            icon="wind"
            title="Quiet the fillers"
            description="Gently removes “um”, “uh”, and other thinking sounds."
            control={
              <Switch
                accessibilityLabel="Remove filler words"
                value={state.settings.removeFillers}
                onValueChange={(value) => {
                  setSetting('removeFillers', value);
                  triggerHaptic('light');
                }}
                trackColor={{ false: colors.surfaceMuted, true: colors.accentSoft }}
                thumbColor={state.settings.removeFillers ? colors.accent : colors.borderStrong}
              />
            }
          />
          <Divider />
          <SettingsRow
            icon="smartphone"
            title="Gentle haptics"
            description="A small tap when buttons and choices respond."
            control={
              <Switch
                accessibilityLabel="Haptic feedback"
                value={state.settings.haptics}
                onValueChange={(value) => {
                  setSetting('haptics', value);
                  triggerHaptic('light');
                }}
                trackColor={{ false: colors.surfaceMuted, true: colors.accentSoft }}
                thumbColor={state.settings.haptics ? colors.accent : colors.borderStrong}
              />
            }
          />
        </Section>

        <Section title="Your words">
          <SettingsRow
            icon="download"
            title="Export my pages"
            description="Download everything as a tidy Markdown file."
            onPress={() => void handleExport()}
            trailing={
              exporting ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Feather name="chevron-right" size={16} color={colors.textTertiary} />
              )
            }
          />
          <Divider />
          <SettingsRow
            icon="shield"
            title="Where your words live"
            description="Entries are stored on this device. No account, no cloud, no ads. Speech is handled by your device’s speech service."
            control={
              <View style={[styles.privacyBadge, { backgroundColor: colors.sageSoft }]}>
                <Feather name="check" size={12} color={colors.sage} />
                <AppText variant="caption" style={{ color: colors.sage }}>
                  Private
                </AppText>
              </View>
            }
          />
          <Divider />
          <SettingsRow
            icon="database"
            title="Local save"
            description={
              storageError
                ? storageError
                : lastSavedAt
                  ? `Last saved at ${formatTime(lastSavedAt)}.`
                  : 'Saving happens automatically as you write.'
            }
            onPress={() => void saveNow()}
            trailing={
              storageError ? (
                <Feather name="alert-circle" size={17} color={colors.danger} />
              ) : saveState === 'saving' ? (
                <ActivityIndicator size="small" color={colors.textTertiary} />
              ) : (
                <Feather name="check-circle" size={17} color={colors.sage} />
              )
            }
          />
        </Section>

        <Section title="Care">
          <SettingsRow
            icon="trash-2"
            title="Erase everything"
            description="Remove every book and entry from this device."
            onPress={handleReset}
            destructive
            trailing={<Feather name="chevron-right" size={16} color={colors.danger} />}
          />
        </Section>

        <View style={styles.about}>
          <View style={[styles.aboutMark, { backgroundColor: colors.accentSoft }]}>
            <Feather name="feather" size={20} color={colors.accent} />
          </View>
          <AppText variant="heading">d-dairy</AppText>
          <AppText variant="bodySmall" align="center" style={styles.aboutText}>
            A softer place for your days. Made for slow mornings, long walks, and the things you
            want to remember.
          </AppText>
          <AppText variant="caption">Version {version} · {Platform.OS === 'web' ? 'Web' : 'Mobile'}</AppText>
          {exportNote ? (
            <AppText variant="caption" style={{ color: colors.accent }}>
              {exportNote}
            </AppText>
          ) : null}
        </View>
      </ScrollView>

      <SheetModal
        visible={languageOpen}
        onClose={() => setLanguageOpen(false)}
        title="Dictation language"
        subtitle="The speech engine uses this language for new sessions.">
        <View style={styles.languageList}>
          {DICTATION_LANGUAGES.map((language) => {
            const selected = language.code === state.settings.dictationLanguage;
            return (
              <PressableScale
                key={language.code}
                accessibilityRole="radio"
                accessibilityLabel={`${language.label}, ${language.nativeLabel}`}
                accessibilityState={{ selected }}
                onPress={() => {
                  setSetting('dictationLanguage', language.code);
                  setLanguageOpen(false);
                  triggerHaptic('light');
                }}
                style={[
                  styles.languageRow,
                  {
                    backgroundColor: selected ? colors.accentSoft : colors.surfaceRaised,
                    borderColor: selected ? colors.accent : colors.border,
                  },
                ]}>
                <View style={styles.languageText}>
                  <AppText
                    variant="subheading"
                    style={{ color: selected ? colors.accent : colors.text }}>
                    {language.label}
                  </AppText>
                  <AppText variant="caption">{language.nativeLabel}</AppText>
                </View>
                {selected ? (
                  <IconButton
                    icon="check"
                    accessibilityLabel="Selected"
                    variant="accent"
                    size={28}
                    iconSize={14}
                    onPress={() => setLanguageOpen(false)}
                  />
                ) : null}
              </PressableScale>
            );
          })}
          <AppText variant="caption" align="center" style={styles.languageNote}>
            Available languages depend on your device and speech engine.
          </AppText>
        </View>
      </SheetModal>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={styles.section}>
      <AppText variant="label">{title}</AppText>
      <View
        style={[
          styles.sectionCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        {children}
      </View>
    </View>
  );
}

function Divider() {
  const { colors } = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
}

interface SettingsRowProps {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  control?: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
  destructive?: boolean;
}

function SettingsRow({
  icon,
  title,
  description,
  control,
  trailing,
  onPress,
  destructive,
}: SettingsRowProps) {
  const { colors } = useTheme();
  const content = (
    <>
      <View
        style={[
          styles.rowIcon,
          { backgroundColor: destructive ? colors.dangerSoft : colors.surfaceMuted },
        ]}>
        <Feather
          name={icon}
          size={16}
          color={destructive ? colors.danger : colors.textSecondary}
        />
      </View>
      <View style={styles.rowCopy}>
        <AppText variant="subheading" style={{ color: destructive ? colors.danger : colors.text }}>
          {title}
        </AppText>
        <AppText variant="bodySmall" style={styles.rowDescription}>
          {description}
        </AppText>
      </View>
      {control ?? trailing}
    </>
  );

  if (!onPress) {
    return <View style={styles.row}>{content}</View>;
  }

  return (
    <PressableScale
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityHint={description}
      onPress={onPress}
      haptic="light"
      style={styles.row}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 16,
  },
  header: {
    gap: 7,
    marginBottom: 28,
  },
  title: {
    fontSize: 42,
    lineHeight: 46,
  },
  subtitle: {
    maxWidth: 540,
  },
  section: {
    gap: 9,
    marginBottom: 24,
  },
  sectionCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 22,
    overflow: 'hidden',
  },
  themeRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  themeOption: {
    flex: 1,
    minHeight: 58,
    borderRadius: 15,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 15,
    paddingVertical: 14,
    minHeight: 68,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowCopy: {
    flex: 1,
    gap: 2,
  },
  rowDescription: {
    maxWidth: 480,
  },
  rowTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 61,
  },
  privacyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  about: {
    alignItems: 'center',
    gap: 7,
    paddingTop: 12,
    paddingBottom: 24,
  },
  aboutMark: {
    width: 44,
    height: 44,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  aboutText: {
    maxWidth: 330,
  },
  languageList: {
    gap: 8,
  },
  languageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  languageText: {
    flex: 1,
    gap: 1,
  },
  languageNote: {
    marginTop: 8,
    marginBottom: 4,
  },
});
