// G8N Controllers - useWorkflow Hook
// Provides workflow manipulation methods with business logic

import { useCallback } from 'react';
import { useG8nStore } from '../models/store';
import type { G8nNode, NodeType, StartNodeData, AgentNodeData, OutputNodeData, ToolNodeData, MemoryNodeData, ConditionNodeData } from '../models/types';

// ============================================
// Default Node Data Factory
// ============================================

function createDefaultNodeData(type: NodeType, label: string): G8nNode['data'] {
    const baseData = { label };

    switch (type) {
        case 'start':
            return {
                ...baseData,
                triggerType: 'manual',
                inputVariables: [],
            } as StartNodeData;

        case 'agent':
            return {
                ...baseData,
                model: 'gemini-2.5-flash',
                systemPrompt: '',
                temperature: 0.7,
            } as AgentNodeData;

        case 'tool':
            return {
                ...baseData,
                toolType: 'google_search',
                config: {},
            } as ToolNodeData;

        case 'memory':
            return {
                ...baseData,
                storageKey: `memory_${Date.now()}`,
                maxMessages: 10,
            } as MemoryNodeData;

        case 'condition':
            return {
                ...baseData,
                categories: ['Yes', 'No'],
                model: 'gemini-2.5-flash',
            } as ConditionNodeData;

        case 'output':
            return {
                ...baseData,
                outputFormat: 'text',
            } as OutputNodeData;

        default:
            return baseData as G8nNode['data'];
    }
}

// ============================================
// Hook
// ============================================

export function useWorkflow() {
    const nodes = useG8nStore((state) => state.nodes);
    const edges = useG8nStore((state) => state.edges);
    const addNode = useG8nStore((state) => state.addNode);
    const deleteNode = useG8nStore((state) => state.deleteNode);
    const updateNodeData = useG8nStore((state) => state.updateNodeData);
    const selectNode = useG8nStore((state) => state.selectNode);
    const selectedNodeId = useG8nStore((state) => state.selectedNodeId);
    const hasUnsavedChanges = useG8nStore((state) => state.hasUnsavedChanges);
    const workflowName = useG8nStore((state) => state.workflowName);

    // Create and add a new node
    const createNode = useCallback((type: NodeType, position?: { x: number; y: number }) => {
        const label = type.charAt(0).toUpperCase() + type.slice(1);
        const nodePosition = position || {
            x: 100 + Math.random() * 300,
            y: 100 + Math.random() * 300,
        };

        const node: G8nNode = {
            id: `${type}_${Date.now()}`,
            type,
            position: nodePosition,
            data: createDefaultNodeData(type, label),
        };

        addNode(node);
        selectNode(node.id);

        return node.id;
    }, [addNode, selectNode]);

    // Delete selected node
    const deleteSelectedNode = useCallback(() => {
        if (selectedNodeId) {
            deleteNode(selectedNodeId);
            selectNode(null);
        }
    }, [selectedNodeId, deleteNode, selectNode]);

    // Get node by ID
    const getNodeById = useCallback((nodeId: string) => {
        return nodes.find((n) => n.id === nodeId);
    }, [nodes]);

    // Get connected nodes (downstream)
    const getDownstreamNodes = useCallback((nodeId: string) => {
        const connectedEdges = edges.filter((e) => e.source === nodeId);
        return connectedEdges.map((e) => nodes.find((n) => n.id === e.target)).filter(Boolean) as G8nNode[];
    }, [edges, nodes]);

    // Get connected nodes (upstream)
    const getUpstreamNodes = useCallback((nodeId: string) => {
        const connectedEdges = edges.filter((e) => e.target === nodeId);
        return connectedEdges.map((e) => nodes.find((n) => n.id === e.source)).filter(Boolean) as G8nNode[];
    }, [edges, nodes]);

    // Find start node
    const getStartNode = useCallback(() => {
        return nodes.find((n) => n.type === 'start');
    }, [nodes]);

    // Validate workflow
    const validateWorkflow = useCallback(() => {
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

        // Check for orphan nodes (no connections)
        for (const node of nodes) {
            if (node.type === 'start') continue;
            const hasIncoming = edges.some((e) => e.target === node.id);
            if (!hasIncoming) {
                errors.push(`Node "${node.data.label}" has no incoming connections`);
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    }, [nodes, edges]);

    return {
        // State
        nodes,
        edges,
        selectedNodeId,
        hasUnsavedChanges,
        workflowName,

        // Actions
        createNode,
        deleteSelectedNode,
        updateNodeData,
        selectNode,

        // Queries
        getNodeById,
        getDownstreamNodes,
        getUpstreamNodes,
        getStartNode,
        validateWorkflow,
    };
}
