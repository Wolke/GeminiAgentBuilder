// G8N Types - Execution state definitions

import type { NodeType } from './g8n';

// ============================================
// Execution State
// ============================================

export type ExecutionStatus = 'idle' | 'running' | 'completed' | 'error';

export interface ExecutionState {
    status: ExecutionStatus;
    currentNodeId: string | null;
    variables: Record<string, unknown>;
    history: ExecutionStep[];
    error?: string;
}

export interface ExecutionStep {
    id: string;
    nodeId: string;
    nodeType: NodeType;
    input: unknown;
    output: unknown;
    startTime: number;
    endTime?: number;
    error?: string;
    tokensUsed?: number;
}

// ============================================
// Execution Log (for monitoring)
// ============================================

export interface ExecutionLog {
    id: string;
    workflowId: string;
    trigger: 'manual' | 'webhook' | 'cronjob';
    startedAt: string;
    completedAt?: string;
    status: 'success' | 'failed' | 'timeout';
    steps: ExecutionStep[];
    totalTokensUsed?: number;
    errorMessage?: string;
}

// ============================================
// Execution Context (passed to executors)
// ============================================

export interface ExecutionContext {
    variables: Record<string, unknown>;
    previousOutput: unknown;
    settings: {
        geminiApiKey: string;
        gasWebAppUrl: string | null;
        gasApiToken: string | null;
    };
    addStep: (step: Omit<ExecutionStep, 'id'>) => void;
}

// ============================================
// Execution Result
// ============================================

export interface ExecutionResult {
    success: boolean;
    output: unknown;
    error?: string;
    tokensUsed?: number;
}

// ============================================
// Initial State
// ============================================

export const initialExecutionState: ExecutionState = {
    status: 'idle',
    currentNodeId: null,
    variables: {},
    history: [],
};
