import React, {createContext, useContext, useState} from 'react';
import {themes, Theme} from '../styles/theme.ts';

type ThemeContextType = {
    colors: Theme;
    isDark: boolean;
    toggle: () => void;
};

const ThemeContext = createContext<ThemeContextType>(null!);

export function ThemeProvider({children}: {children: React.ReactNode}) {
    const [isDark, setIsDark] = useState(false);
    return (
        <ThemeContext.Provider value={{
            colors: isDark ? themes.dark : themes.light,
            isDark,
            toggle: () => setIsDark(p => !p),
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export const useTheme = () => useContext(ThemeContext);