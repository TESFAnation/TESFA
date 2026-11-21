import React, { createContext, useContext, useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeChoice = 'system' | 'light' | 'dark';
const themes = {
  light: {
    page: '#F6F7F8', surface: '#FFFFFF', text: '#1B2733', subtle: '#61707E',
    navy: '#173B63', line: '#DCE2E8', soft: '#E8EEF4', progress: '#173B63',
  },
  dark: {
    page: '#101821', surface: '#1B2631', text: '#F4F5F7', subtle: '#ABB8C5',
    navy: '#9EC4EB', line: '#344353', soft: '#25384A', progress: '#9EC4EB',
  },
} as const;

const Context = createContext<{ choice: ThemeChoice; setChoice: (next: ThemeChoice) => void }>({
  choice: 'system', setChoice: () => {},
});

export function AppearanceProvider({ children }: { children: React.ReactNode }) {
  const [choice, setChoiceState] = useState<ThemeChoice>('system');
  useEffect(() => {
    AsyncStorage.getItem('tesfa:theme').then((saved) => {
      if (saved === 'system' || saved === 'light' || saved === 'dark') setChoiceState(saved);
    });
  }, []);
  function setChoice(next: ThemeChoice) {
    setChoiceState(next);
    AsyncStorage.setItem('tesfa:theme', next);
  }
  return <Context.Provider value={{ choice, setChoice }}>{children}</Context.Provider>;
}

export function useAppearance() {
  const { choice, setChoice } = useContext(Context);
  const system = useColorScheme();
  const dark = choice === 'system' ? system === 'dark' : choice === 'dark';
  return { choice, setChoice, dark, colors: dark ? themes.dark : themes.light };
}

