// G8N Store - Settings Slice

import type { StateCreator } from 'zustand';

// ============================================
// State Interface
// ============================================

export interface AppSettings {
    // Gemini
    geminiApiKey: string;
    defaultModel: string;

    // Debug
    debugMode: boolean;
    logLevel: 'error' | 'warn' | 'info' | 'debug';

    // Google OAuth
    googleOAuthClientId?: string;

    // GAS Project
    gasProjectId?: string;
    gasWebAppUrl?: string;
}

export interface SettingsSlice {
    settings: AppSettings;

    // Actions
    updateSettings: (settings: Partial<AppSettings>) => void;
    resetSettings: () => void;
}

// ============================================
// Initial State
// ============================================

const initialSettings: AppSettings = {
    geminiApiKey: '',
    defaultModel: 'gemini-2.5-flash',
    debugMode: false,
    logLevel: 'warn',
    googleOAuthClientId: '',
    gasProjectId: '',
    gasWebAppUrl: '',
};

// ============================================
// Slice Creator
// ============================================

export const createSettingsSlice: StateCreator<
    SettingsSlice,
    [],
    [],
    SettingsSlice
> = (set) => ({
    settings: initialSettings,

    updateSettings: (newSettings) => {
        set((state) => ({
            settings: { ...state.settings, ...newSettings },
        }));
    },

    resetSettings: () => {
        set({ settings: initialSettings });
    },
});
