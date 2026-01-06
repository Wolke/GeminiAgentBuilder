// G8N Types - Core workflow definitions

import type { Node, Edge } from '@xyflow/react';

// ============================================
// Node Types
// ============================================

export type NodeType = 'start' | 'agent' | 'tool' | 'condition' | 'output' | 'memory';

export type TriggerType = 'manual' | 'webhook' | 'cronjob';

// ============================================
// Base Node Data
// ============================================

export interface BaseNodeData {
    label: string;
    [key: string]: unknown;
}

// ============================================
// Start Node
// ============================================

export interface StartNodeData extends BaseNodeData {
    triggerType: TriggerType;
    inputVariables: InputVariable[];

    // Webhook config
    webhookConfig?: {
        path: string;
        method: 'GET' | 'POST';
        authToken?: string;
    };

    // Cronjob config
    cronjobConfig?: {
        schedule: string;      // Cron expression
        timezone: string;
        enabled: boolean;
    };
}

export interface InputVariable {
    name: string;
    type: 'string' | 'number' | 'boolean' | 'object';
    defaultValue?: string;
    description?: string;
}

// ============================================
// Agent Node
// ============================================

export type GeminiModel =
    | 'gemini-3-pro-preview'
    | 'gemini-3-flash-preview'
    | 'gemini-2.5-pro'
    | 'gemini-2.5-flash'
    | 'gemini-2.5-flash-lite'
    | 'gemini-2.0-flash';

export const GEMINI_MODELS: GeminiModel[] = [
    'gemini-3-pro-preview',
    'gemini-3-flash-preview',
    'gemini-2.5-pro',
    'gemini-2.5-flash',
    'gemini-2.5-flash-lite',
    'gemini-2.0-flash',
];

export interface AgentNodeData extends BaseNodeData {
    model: GeminiModel;
    systemPrompt: string;
    temperature: number;
}

// ============================================
// Tool Node
// ============================================

// Gemini Built-in Tools (local execution)
export type GeminiBuiltinTool =
    | 'google_search'
    | 'code_execution'
    | 'url_context';

// GAS Bridge Tools (requires GAS sync)
export type GasTool =
    | 'sheets'
    | 'gmail'
    | 'drive'
    | 'calendar'
    | 'youtube';

export type ToolType = GeminiBuiltinTool | GasTool;

export const GEMINI_BUILTIN_TOOLS: GeminiBuiltinTool[] = [
    'google_search',
    'code_execution',
    'url_context',
];

export const GAS_TOOLS: GasTool[] = [
    'sheets',
    'gmail',
    'drive',
    'calendar',
    'youtube',
];

export interface ToolNodeData extends BaseNodeData {
    toolType: ToolType;
    config: ToolConfig;
    /**
     * When true, tool will be executed via GAS Web App.
     * When false, uses local Gemini API (for builtin tools only).
     * GAS-only tools (sheets, gmail, etc.) always require this to be true.
     */
    useGas?: boolean;
}

export interface ToolConfig {
    // Sheets
    spreadsheetId?: string;
    sheetName?: string;

    // Gmail
    to?: string;
    subject?: string;

    // Generic
    [key: string]: unknown;
}

// ============================================
// Condition Node
// ============================================

export interface ConditionNodeData extends BaseNodeData {
    categories: string[];
    instructions?: string;
    model: GeminiModel;
}

// ============================================
// Output Node
// ============================================

export interface OutputNodeData extends BaseNodeData {
    outputFormat: 'text' | 'json' | 'markdown';
}

// ============================================
// Memory Node
// ============================================

export interface MemoryNodeData extends BaseNodeData {
    storageKey: string;
    maxMessages: number;
}

// ============================================
// Union Types
// ============================================

export type G8nNodeData =
    | StartNodeData
    | AgentNodeData
    | ToolNodeData
    | ConditionNodeData
    | OutputNodeData
    | MemoryNodeData;

export type G8nNode = Node<G8nNodeData, NodeType>;
export type G8nEdge = Edge;

// ============================================
// Workflow Definition
// ============================================

export interface G8nWorkflow {
    // Schema & Version
    $schema: string;
    version: string;

    // Metadata
    id: string;
    name: string;
    description?: string;

    // Flow Definition
    nodes: G8nNode[];
    edges: G8nEdge[];

    // GAS Configuration
    gasConfig: GasConfig;

    // Timestamps
    createdAt: string;
    updatedAt: string;
}

export interface GasConfig {
    webAppUrl: string | null;
    apiToken: string | null;
    syncStatus: 'not_configured' | 'syncing' | 'synced' | 'out_of_sync' | 'error';
    lastSyncAt: string | null;
}

// ============================================
// Constants
// ============================================

export const G8N_SCHEMA_URL = 'https://g8n.dev/schema/v1';
export const G8N_VERSION = '1.0.0';
