const light = {
    primary: '#0b43d6',
    primaryMuted: '#818181',

    textPrimary: '#333',
    textSecondary: '#555',
    textHint: '#7e7e7e',
    textOnPrimary: '#ffffff',

    bgPrimary: '#ffffff',
    bgSecondary: '#e1e0e0',
    bgBubbleUser: '#d0e0ff',
    bgBubbleSearch: '#d6d6d6',

    danger: '#ff0000',
    success: '#2563EB',

    border: '#eee',
};

const dark = {
    primary: '#658cea',
    primaryMuted: '#666',

    textPrimary: '#f0f0f0',
    textSecondary: '#aaa',
    textHint: '#777',
    textOnPrimary: '#ffffff',

    bgPrimary: '#121212',
    bgSecondary: '#1e1e1e',
    bgBubbleUser: '#1a2f5e',
    bgBubbleSearch: '#2a2a2a',

    danger: '#ff4444',
    success: '#3b82f6',

    border: '#333',
};

export type Theme = typeof light;
export const themes = {light, dark};