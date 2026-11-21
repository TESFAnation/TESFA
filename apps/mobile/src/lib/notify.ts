import { Alert as NativeAlert, Platform } from 'react-native';

export const Alert = {
  alert(title: string, message?: string) {
    if (Platform.OS === 'web') {
      globalThis.alert?.(title + (message ? '\n\n' + message : ''));
      return;
    }
    NativeAlert.alert(title, message);
  },
};
