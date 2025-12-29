// Node Types for Gemini Agent Builder

import type { Node, Edge } from '@xyflow/react';

// All available node types
export type NodeType = 'start' | 'agent' | 'tool' | 'condition' | 'output';

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
  enabledTools: ToolType[];
}

export type GeminiModel =
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash'
  | 'gemini-1.5-flash-8b';

// Runtime constants for models
export const GEMINI_MODELS: GeminiModel[] = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'gemini-1.5-flash-8b',
];

// Tool Node - external tool execution
export interface ToolNodeData extends BaseNodeData {
  toolType: ToolType;
  config: ToolConfig;
}

export type ToolType =
  | 'function_calling'
  | 'code_execution'
  | 'google_search'
  | 'url_context';

// Runtime constants for tool types
export const TOOL_TYPES: ToolType[] = [
  'function_calling',
  'code_execution',
  'google_search',
  'url_context',
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
}

export interface FunctionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  required: boolean;
}

// Condition Node - branching logic
export interface ConditionNodeData extends BaseNodeData {
  conditionType: 'contains' | 'equals' | 'greater_than' | 'less_than' | 'custom';
  conditionValue: string;
  customExpression?: string;
}

// Output Node - workflow endpoint
export interface OutputNodeData extends BaseNodeData {
  outputFormat: 'text' | 'json' | 'markdown';
}

// Union type for all node data
export type WorkflowNodeData =
  | StartNodeData
  | AgentNodeData
  | ToolNodeData
  | ConditionNodeData
  | OutputNodeData;

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
