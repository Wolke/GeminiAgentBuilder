// G8N Store - Main store combining all slices

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createWorkflowSlice, type WorkflowSlice } from './slices/workflowSlice';
import { createExecutionSlice, type ExecutionSlice } from './slices/executionSlice';
import { createSettingsSlice, type SettingsSlice } from './slices/settingsSlice';
import { createUISlice, type UISlice } from './slices/uiSlice';

// ============================================
// Combined Store Type
// ============================================

export type G8nStore = WorkflowSlice & ExecutionSlice & SettingsSlice & UISlice;

// ============================================
// Create Store
// ============================================

export const useG8nStore = create<G8nStore>()(
    persist(
        (...a) => ({
            ...createWorkflowSlice(...a),
            ...createExecutionSlice(...a),
            ...createSettingsSlice(...a),
            ...createUISlice(...a),
        }),
        {
            name: 'g8n-storage',
            storage: createJSONStorage(() => localStorage),

            // Only persist certain state
            partialize: (state) => ({
                // Settings (always persist)
                settings: state.settings,

                // UI persistence
                ui: {
                    canvasViewport: state.ui.canvasViewport,
                    panelWidths: state.ui.panelWidths,
                    recentFiles: state.ui.recentFiles,
                    // Don't persist chat messages or app mode
                    appMode: 'edit' as const,
                    chatMessages: [],
                },

                // Don't persist workflow (loaded from file)
                // Don't persist execution state
            }),
        }
    )
);

// ============================================
// Re-export types
// ============================================

export type { WorkflowSlice } from './slices/workflowSlice';
export type { ExecutionSlice } from './slices/executionSlice';
export type { SettingsSlice, AppSettings } from './slices/settingsSlice';
export type { UISlice, UIState, AppMode, ChatMessage } from './slices/uiSlice';
