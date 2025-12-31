// Node Types for Gemini Agent Builder

import type { Node, Edge } from '@xyflow/react';

// All available node types
export type NodeType = 'start' | 'agent' | 'tool' | 'condition' | 'output' | 'memory';

// Base node data structure
export interface BaseNodeData {
  label: string;
  [key: string]: unknown;
}

// Start Node - entry point
export interface StartNodeData extends BaseNodeData {
  inputVariables: InputVariable[];
}

export interface InputVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object';
  defaultValue?: string;
  description?: string;
}

// Agent Node - core LLM processing
export interface AgentNodeData extends BaseNodeData {
  model: GeminiModel;
  systemPrompt: string;
  temperature: number;
  enabledTools?: ToolType[]; // Deprecated: Use Tool Node connections instead
  deepResearch?: boolean; // Enable Deep Research capabilities
}

export type GeminiModel =
  | 'gemini-3.0-pro-preview'
  | 'gemini-3.0-flash'
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.0-flash';

// Runtime constants for models
export const GEMINI_MODELS: GeminiModel[] = [
  'gemini-3.0-pro-preview',
  'gemini-3.0-flash',
  'gemini-2.5-pro',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

// Tool Node - external tool execution
export interface ToolNodeData extends BaseNodeData {
  toolType: ToolType;
  config: ToolConfig;
}

// Tool Categories
export type ToolCategory = 'gemini_builtin' | 'gcp_api' | 'custom_mcp';

// Category 1: Gemini Built-in Tools (直接由 Gemini API 支援)
export type GeminiBuiltinTool =
  | 'google_search'
  | 'code_execution'
  | 'file_search'
  | 'url_context'
  | 'google_maps';  // Gemini 內建的 Google Maps Grounding

// Category 2: GCP APIs (需要 OAuth 認證)
export type GcpApiTool =
  | 'youtube_data'
  | 'google_calendar'
  | 'gmail'
  | 'google_drive'
  | 'places_api';

// Category 3: Custom MCP (自訂整合)
export type CustomMcpTool =
  | 'mcp'
  | 'function_calling';

// Union of all tool types
export type ToolType = GeminiBuiltinTool | GcpApiTool | CustomMcpTool;

// Runtime constants for tool categories
export const GEMINI_BUILTIN_TOOLS: GeminiBuiltinTool[] = [
  'google_search',
  'code_execution',
  'file_search',
  'url_context',
  'google_maps',
];

export const GCP_API_TOOLS: GcpApiTool[] = [
  'youtube_data',
  'google_calendar',
  'gmail',
  'google_drive',
  'places_api',
];

export const CUSTOM_MCP_TOOLS: CustomMcpTool[] = [
  'mcp',
  'function_calling',
];

// All tools combined (for backward compatibility)
export const TOOL_TYPES: ToolType[] = [
  ...GEMINI_BUILTIN_TOOLS,
  ...GCP_API_TOOLS,
  ...CUSTOM_MCP_TOOLS,
];

export interface ToolConfig {
  // Function Calling
  functionName?: string;
  functionDescription?: string;
  parameters?: FunctionParameter[];

  // Code Execution
  codeLanguage?: 'python';

  // URL Context
  targetUrl?: string;

  // File Search
  fileUris?: string[];

  // MCP
  mcpServerUrl?: string;
}

export interface FunctionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

// Condition Node - branching logic
// Condition Node - Classify logic (renamed conceptually to Classify but keeping type for now)
export interface ConditionNodeData extends BaseNodeData {
  // Classification specific
  categories: string[];
  inputVariable?: string; // defaults to 'last_output'
  instructions?: string;
  examples: ClassifyExample[];
  model: GeminiModel;
}

export interface ClassifyExample {
  id: string;
  text: string;
  category: string;
}

export interface OutputNodeData extends BaseNodeData {
  outputFormat: 'text' | 'json' | 'markdown';
}

// Memory Node - conversation history storage
export interface MemoryNodeData extends BaseNodeData {
  storageKey: string;    // localStorage key
  maxMessages: number;   // Limit stored messages (default 10)
}

// Union type for all node data
export type WorkflowNodeData =
  | StartNodeData
  | AgentNodeData
  | ToolNodeData
  | ConditionNodeData
  | OutputNodeData
  | MemoryNodeData;

// Workflow node with type discrimination
export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge;

// Workflow definition
export interface Workflow {
  id: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

// Execution context
export interface ExecutionContext {
  variables: Record<string, unknown>;
  history: ExecutionStep[];
  currentNodeId: string | null;
  status: 'idle' | 'running' | 'completed' | 'error';
  error?: string;
}

export interface ExecutionStep {
  nodeId: string;
  nodeType: NodeType;
  input: unknown;
  output: unknown;
  startTime: number;
  endTime?: number;
  error?: string;
}
