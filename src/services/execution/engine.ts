// G8N Execution Engine - Workflow Traversal Service
// Provides BFS-style workflow execution with pluggable node executors

import type { G8nNode, G8nEdge } from '../../models/types';

// ============================================
// Types
// ============================================

export interface ExecutionContext {
    nodes: G8nNode[];
    edges: G8nEdge[];
    apiKey: string;
    debugMode?: boolean;
    onNodeStart?: (nodeId: string) => void;
    onNodeComplete?: (nodeId: string, output: unknown) => void;
    onNodeError?: (nodeId: string, error: string) => void;
}

export interface NodeExecutionResult {
    success: boolean;
    output?: unknown;
    error?: string;
    nextNodeIds?: string[];
    metadata?: Record<string, unknown>;
}

export interface WorkflowExecutionResult {
    success: boolean;
    output?: unknown;
    error?: string;
    executedNodes: string[];
    executionTimeMs: number;
}

// ============================================
// Helper Functions
// ============================================

export function findStartNode(nodes: G8nNode[]): G8nNode | undefined {
    return nodes.find((n) => n.type === 'start');
}

export function findDownstreamNodes(nodeId: string, edges: G8nEdge[], nodes: G8nNode[]): G8nNode[] {
    const connectedEdges = edges.filter((e) => e.source === nodeId);
    return connectedEdges
        .map((e) => nodes.find((n) => n.id === e.target))
        .filter(Boolean) as G8nNode[];
}

export function findUpstreamNodes(nodeId: string, edges: G8nEdge[], nodes: G8nNode[]): G8nNode[] {
    const connectedEdges = edges.filter((e) => e.target === nodeId);
    return connectedEdges
        .map((e) => nodes.find((n) => n.id === e.source))
        .filter(Boolean) as G8nNode[];
}

export function getNodeById(nodeId: string, nodes: G8nNode[]): G8nNode | undefined {
    return nodes.find((n) => n.id === nodeId);
}

// ============================================
// Workflow Validation
// ============================================

export function validateWorkflow(nodes: G8nNode[], edges: G8nEdge[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    const startNodes = nodes.filter((n) => n.type === 'start');
    if (startNodes.length === 0) {
        errors.push('Workflow must have a Start node');
    } else if (startNodes.length > 1) {
        errors.push('Workflow can only have one Start node');
    }

    const outputNodes = nodes.filter((n) => n.type === 'output');
    if (outputNodes.length === 0) {
        errors.push('Workflow should have at least one Output node');
    }

    // Check for orphan nodes
    for (const node of nodes) {
        if (node.type === 'start') continue;
        const hasIncoming = edges.some((e) => e.target === node.id);
        if (!hasIncoming) {
            errors.push(`Node "${node.data.label}" has no incoming connections`);
        }
    }

    return { isValid: errors.length === 0, errors };
}

// ============================================
// Export
// ============================================

export const executionEngine = {
    findStartNode,
    findDownstreamNodes,
    findUpstreamNodes,
    getNodeById,
    validateWorkflow,
};

export default executionEngine;
