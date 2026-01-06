// G8N Store - UI Slice

import type { StateCreator } from 'zustand';

// ============================================
// State Interface
// ============================================

export type AppMode = 'edit' | 'run';

export interface ChatMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
}

export interface UIState {
    appMode: AppMode;
    chatMessages: ChatMessage[];

    // UI Persistence
    canvasViewport: { x: number; y: number; zoom: number };
    panelWidths: { toolbar: number; properties: number; chat: number };
    recentFiles: string[];
}

export interface UISlice {
    ui: UIState;

    // Actions
    setAppMode: (mode: AppMode) => void;
    addChatMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
    clearChatMessages: () => void;
    setCanvasViewport: (viewport: UIState['canvasViewport']) => void;
    addRecentFile: (filename: string) => void;
}

// ============================================
// Initial State
// ============================================

const initialUIState: UIState = {
    appMode: 'edit',
    chatMessages: [],
    canvasViewport: { x: 0, y: 0, zoom: 1 },
    panelWidths: { toolbar: 280, properties: 320, chat: 360 },
    recentFiles: [],
};

// ============================================
// Slice Creator
// ============================================

export const createUISlice: StateCreator<
    UISlice,
    [],
    [],
    UISlice
> = (set) => ({
    ui: initialUIState,

    setAppMode: (mode) => {
        set((state) => ({
            ui: { ...state.ui, appMode: mode },
        }));
    },

    addChatMessage: (message) => {
        const chatMessage: ChatMessage = {
            ...message,
            id: crypto.randomUUID(),
            timestamp: Date.now(),
        };

        set((state) => ({
            ui: {
                ...state.ui,
                chatMessages: [...state.ui.chatMessages, chatMessage],
            },
        }));
    },

    clearChatMessages: () => {
        set((state) => ({
            ui: { ...state.ui, chatMessages: [] },
        }));
    },

    setCanvasViewport: (viewport) => {
        set((state) => ({
            ui: { ...state.ui, canvasViewport: viewport },
        }));
    },

    addRecentFile: (filename) => {
        set((state) => {
            const recent = [filename, ...state.ui.recentFiles.filter(f => f !== filename)].slice(0, 10);
            return {
                ui: { ...state.ui, recentFiles: recent },
            };
        });
    },
});
