// G8N Store - Workflow Slice

import type { StateCreator } from 'zustand';
import type { G8nNode, G8nEdge, G8nWorkflow, GasConfig, G8N_SCHEMA_URL, G8N_VERSION } from '../../types';
import { addEdge, applyNodeChanges, applyEdgeChanges } from '@xyflow/react';
import type { Connection, NodeChange, EdgeChange } from '@xyflow/react';

// ============================================
// State Interface
// ============================================

export interface WorkflowSlice {
    // Workflow Data
    nodes: G8nNode[];
    edges: G8nEdge[];
    workflowId: string;
    workflowName: string;
    workflowDescription: string;

    // GAS Config
    gasConfig: GasConfig;

    // Selection
    selectedNodeId: string | null;

    // Dirty State
    hasUnsavedChanges: boolean;

    // Actions
    onNodesChange: (changes: NodeChange<G8nNode>[]) => void;
    onEdgesChange: (changes: EdgeChange[]) => void;
    onConnect: (connection: Connection) => void;
    addNode: (node: G8nNode) => void;
    updateNodeData: (nodeId: string, data: Partial<G8nNode['data']>) => void;
    deleteNode: (nodeId: string) => void;
    selectNode: (nodeId: string | null) => void;

    // Workflow Actions
    setWorkflow: (workflow: G8nWorkflow) => void;
    exportWorkflow: () => G8nWorkflow;
    resetWorkflow: () => void;
    updateGasConfig: (config: Partial<GasConfig>) => void;
}

// ============================================
// Initial State
// ============================================

const initialGasConfig: GasConfig = {
    webAppUrl: null,
    apiToken: null,
    syncStatus: 'not_configured',
    lastSyncAt: null,
};

// ============================================
// Slice Creator
// ============================================

export const createWorkflowSlice: StateCreator<
    WorkflowSlice,
    [],
    [],
    WorkflowSlice
> = (set, get) => ({
    // Initial State
    nodes: [],
    edges: [],
    workflowId: crypto.randomUUID(),
    workflowName: 'Untitled Workflow',
    workflowDescription: '',
    gasConfig: initialGasConfig,
    selectedNodeId: null,
    hasUnsavedChanges: false,

    // Node/Edge Changes
    onNodesChange: (changes) => {
        set((state) => ({
            nodes: applyNodeChanges(changes, state.nodes) as G8nNode[],
            hasUnsavedChanges: true,
        }));
    },

    onEdgesChange: (changes) => {
        set((state) => ({
            edges: applyEdgeChanges(changes, state.edges),
            hasUnsavedChanges: true,
        }));
    },

    onConnect: (connection) => {
        set((state) => ({
            edges: addEdge(connection, state.edges),
            hasUnsavedChanges: true,
        }));
    },

    // Node CRUD
    addNode: (node) => {
        set((state) => ({
            nodes: [...state.nodes, node],
            hasUnsavedChanges: true,
        }));
    },

    updateNodeData: (nodeId, data) => {
        set((state) => ({
            nodes: state.nodes.map((node) =>
                node.id === nodeId
                    ? { ...node, data: { ...node.data, ...data } }
                    : node
            ),
            hasUnsavedChanges: true,
        }));
    },

    deleteNode: (nodeId) => {
        set((state) => ({
            nodes: state.nodes.filter((node) => node.id !== nodeId),
            edges: state.edges.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId
            ),
            selectedNodeId: state.selectedNodeId === nodeId ? null : state.selectedNodeId,
            hasUnsavedChanges: true,
        }));
    },

    selectNode: (nodeId) => {
        set({ selectedNodeId: nodeId });
    },

    // Workflow Actions
    setWorkflow: (workflow) => {
        // Migrate nodes - ensure tool nodes have toolType set (for old workflows)
        const migratedNodes = workflow.nodes.map((node): G8nNode => {
            if (node.type === 'tool' && !(node.data as any).toolType) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        toolType: 'google_search', // Default for old tool nodes
                    },
                } as G8nNode;
            }
            return node;
        });

        set({
            nodes: migratedNodes,
            edges: workflow.edges,
            workflowId: workflow.id,
            workflowName: workflow.name,
            workflowDescription: workflow.description || '',
            gasConfig: workflow.gasConfig,
            selectedNodeId: null,
            hasUnsavedChanges: false,
        });
    },

    exportWorkflow: () => {
        const state = get();
        const now = new Date().toISOString();

        return {
            $schema: 'https://g8n.dev/schema/v1',
            version: '1.0.0',
            id: state.workflowId,
            name: state.workflowName,
            description: state.workflowDescription,
            nodes: state.nodes,
            edges: state.edges,
            gasConfig: state.gasConfig,
            createdAt: now, // Should be preserved from original
            updatedAt: now,
        };
    },

    resetWorkflow: () => {
        set({
            nodes: [],
            edges: [],
            workflowId: crypto.randomUUID(),
            workflowName: 'Untitled Workflow',
            workflowDescription: '',
            gasConfig: initialGasConfig,
            selectedNodeId: null,
            hasUnsavedChanges: false,
        });
    },

    updateGasConfig: (config) => {
        set((state) => ({
            gasConfig: { ...state.gasConfig, ...config },
            hasUnsavedChanges: true,
        }));
    },
});
