// G8N Store - Execution Slice

import type { StateCreator } from 'zustand';
import type { ExecutionState, ExecutionStep } from '../../types';
import { initialExecutionState } from '../../types';

// ============================================
// State Interface
// ============================================

export interface ExecutionSlice {
    execution: ExecutionState;

    // Actions
    setExecutionStatus: (status: ExecutionState['status']) => void;
    setCurrentNode: (nodeId: string | null) => void;
    addExecutionStep: (step: Omit<ExecutionStep, 'id'>) => void;
    setVariable: (key: string, value: unknown) => void;
    setExecutionError: (error: string) => void;
    resetExecution: () => void;
}

// ============================================
// Slice Creator
// ============================================

export const createExecutionSlice: StateCreator<
    ExecutionSlice,
    [],
    [],
    ExecutionSlice
> = (set) => ({
    execution: initialExecutionState,

    setExecutionStatus: (status) => {
        set((state) => ({
            execution: { ...state.execution, status },
        }));
    },

    setCurrentNode: (nodeId) => {
        set((state) => ({
            execution: { ...state.execution, currentNodeId: nodeId },
        }));
    },

    addExecutionStep: (step) => {
        const stepWithId: ExecutionStep = {
            ...step,
            id: crypto.randomUUID(),
        };

        set((state) => ({
            execution: {
                ...state.execution,
                history: [...state.execution.history, stepWithId],
            },
        }));
    },

    setVariable: (key, value) => {
        set((state) => ({
            execution: {
                ...state.execution,
                variables: { ...state.execution.variables, [key]: value },
            },
        }));
    },

    setExecutionError: (error) => {
        set((state) => ({
            execution: {
                ...state.execution,
                status: 'error',
                error,
            },
        }));
    },

    resetExecution: () => {
        set({ execution: initialExecutionState });
    },
});
