import { Alert, Platform } from 'react-native';

/**
 * Native Alert callbacks are unreliable on React Native Web, so the web build
 * uses the browser confirm dialog while mobile keeps the native destructive
 * action sheet.
 */
export function confirmDestructive(title: string, message: string, onConfirm: () => void): void {
  if (Platform.OS === 'web') {
    const scope = globalThis as unknown as { confirm?: (message: string) => boolean };
    if (!scope.confirm || scope.confirm(`${title}\n\n${message}`)) {
      onConfirm();
    }
    return;
  }

  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: onConfirm },
  ]);
}
