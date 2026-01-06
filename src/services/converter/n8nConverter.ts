// G8N Services - n8n Workflow Converter
// Converts n8n workflow JSON to G8N workflow format

import type { G8nWorkflow, G8nNode, G8nEdge, NodeType } from '../../models/types';
import { G8N_SCHEMA_URL, G8N_VERSION } from '../../models/types';
import { v4 as uuid } from 'uuid';

// ============================================
// n8n Types (Simplified)
// ============================================

interface N8nNode {
    id: string;
    name: string;
    type: string;
    parameters: Record<string, unknown>;
    position: [number, number];
    typeVersion?: number;
    credentials?: Record<string, unknown>;
}

interface N8nConnection {
    node: string;
    type: string;
    index: number;
}

interface N8nWorkflow {
    name: string;
    nodes: N8nNode[];
    connections: Record<string, { main?: N8nConnection[][] }>;
    active?: boolean;
    settings?: Record<string, unknown>;
}

// ============================================
// Node Type Mapping
// ============================================

const N8N_TO_G8N_TYPE_MAP: Record<string, NodeType> = {
    // Triggers -> Start
    'n8n-nodes-base.manualTrigger': 'start',
    'n8n-nodes-base.webhook': 'start',
    'n8n-nodes-base.scheduleTrigger': 'start',
    'n8n-nodes-base.cronTrigger': 'start',
    '@n8n/n8n-nodes-langchain.manualChatTrigger': 'start',

    // LLM/Agent -> Agent
    'n8n-nodes-base.openAi': 'agent',
    '@n8n/n8n-nodes-langchain.lmChatGoogleGemini': 'agent',
    '@n8n/n8n-nodes-langchain.agent': 'agent',
    '@n8n/n8n-nodes-langchain.chainLlm': 'agent',

    // Memory -> Memory
    '@n8n/n8n-nodes-langchain.memoryBufferWindow': 'memory',

    // Tools -> Tool
    'n8n-nodes-base.googleSheets': 'tool',
    'n8n-nodes-base.gmail': 'tool',
    'n8n-nodes-base.googleDrive': 'tool',
    'n8n-nodes-base.googleCalendar': 'tool',
    'n8n-nodes-base.httpRequest': 'tool',
    'n8n-nodes-base.code': 'tool',
    '@n8n/n8n-nodes-langchain.toolCode': 'tool',

    // Router/Switch -> Condition
    'n8n-nodes-base.switch': 'condition',
    'n8n-nodes-base.if': 'condition',
    '@n8n/n8n-nodes-langchain.outputParserStructured': 'condition',

    // Response -> Output
    'n8n-nodes-base.respondToWebhook': 'output',
    'n8n-nodes-base.set': 'output',
};

// ============================================
// Conversion Result
// ============================================

export interface ConversionResult {
    success: boolean;
    workflow?: G8nWorkflow;
    warnings: ConversionWarning[];
    errors: string[];
}

export interface ConversionWarning {
    nodeId: string;
    nodeName: string;
    message: string;
}

// ============================================
// Converter Functions
// ============================================

export function convertN8nToG8n(n8nJson: string | N8nWorkflow): ConversionResult {
    const warnings: ConversionWarning[] = [];
    const errors: string[] = [];

    let n8nWorkflow: N8nWorkflow;

    // Parse JSON if string
    if (typeof n8nJson === 'string') {
        try {
            n8nWorkflow = JSON.parse(n8nJson);
        } catch (e) {
            return {
                success: false,
                errors: ['Invalid JSON format'],
                warnings: [],
            };
        }
    } else {
        n8nWorkflow = n8nJson;
    }

    // Validate basic structure
    if (!n8nWorkflow.nodes || !Array.isArray(n8nWorkflow.nodes)) {
        return {
            success: false,
            errors: ['Missing or invalid nodes array'],
            warnings: [],
        };
    }

    // Convert nodes
    const g8nNodes: G8nNode[] = [];
    const nodeIdMap = new Map<string, string>(); // n8n name -> g8n id

    for (const n8nNode of n8nWorkflow.nodes) {
        const g8nType = N8N_TO_G8N_TYPE_MAP[n8nNode.type];

        if (!g8nType) {
            warnings.push({
                nodeId: n8nNode.id,
                nodeName: n8nNode.name,
                message: `Unsupported node type: ${n8nNode.type}. Skipped.`,
            });
            continue;
        }

        const g8nId = uuid();
        nodeIdMap.set(n8nNode.name, g8nId);

        const g8nNode: G8nNode = {
            id: g8nId,
            type: g8nType,
            position: {
                x: n8nNode.position[0],
                y: n8nNode.position[1],
            },
            data: convertNodeData(n8nNode, g8nType, warnings),
        };

        g8nNodes.push(g8nNode);
    }

    // Convert connections to edges
    const g8nEdges: G8nEdge[] = [];

    for (const [sourceName, connections] of Object.entries(n8nWorkflow.connections)) {
        const sourceId = nodeIdMap.get(sourceName);
        if (!sourceId) continue;

        const mainConnections = connections.main || [];

        for (let outputIndex = 0; outputIndex < mainConnections.length; outputIndex++) {
            const targets = mainConnections[outputIndex] || [];

            for (const target of targets) {
                const targetId = nodeIdMap.get(target.node);
                if (!targetId) continue;

                g8nEdges.push({
                    id: `e-${sourceId}-${targetId}-${outputIndex}`,
                    source: sourceId,
                    target: targetId,
                    sourceHandle: outputIndex > 0 ? `category-${outputIndex - 1}` : undefined,
                });
            }
        }
    }

    // Create G8N workflow
    const g8nWorkflow: G8nWorkflow = {
        $schema: G8N_SCHEMA_URL,
        version: G8N_VERSION,
        id: uuid(),
        name: n8nWorkflow.name || 'Imported Workflow',
        description: `Imported from n8n workflow`,
        nodes: g8nNodes,
        edges: g8nEdges,
        gasConfig: {
            webAppUrl: null,
            apiToken: null,
            syncStatus: 'not_configured',
            lastSyncAt: null,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
    };

    return {
        success: true,
        workflow: g8nWorkflow,
        warnings,
        errors,
    };
}

// ============================================
// Node Data Conversion
// ============================================

function convertNodeData(
    n8nNode: N8nNode,
    g8nType: NodeType,
    _warnings: ConversionWarning[]
): G8nNode['data'] {
    const baseData = {
        label: n8nNode.name,
    };

    switch (g8nType) {
        case 'start':
            return {
                ...baseData,
                triggerType: inferTriggerType(n8nNode.type),
                inputVariables: [],
            };

        case 'agent':
            return {
                ...baseData,
                model: 'gemini-2.5-flash',
                systemPrompt: extractSystemPrompt(n8nNode.parameters),
                temperature: 0.7,
            };

        case 'tool':
            return {
                ...baseData,
                toolType: inferToolType(n8nNode.type) as import('../../models/types').ToolType,
                config: extractToolConfig(n8nNode.parameters),
            };

        case 'memory':
            return {
                ...baseData,
                storageKey: `memory_${n8nNode.name.toLowerCase().replace(/\s+/g, '_')}`,
                maxMessages: 10,
            };

        case 'condition':
            return {
                ...baseData,
                categories: extractCategories(n8nNode.parameters),
                model: 'gemini-2.5-flash',
            };

        case 'output':
            return {
                ...baseData,
                outputFormat: 'text',
            };

        default:
            return baseData as G8nNode['data'];
    }
}

// ============================================
// Helper Functions
// ============================================

function inferTriggerType(n8nType: string): 'manual' | 'webhook' | 'cronjob' {
    if (n8nType.includes('webhook')) return 'webhook';
    if (n8nType.includes('schedule') || n8nType.includes('cron')) return 'cronjob';
    return 'manual';
}

function inferToolType(n8nType: string): string {
    if (n8nType.includes('googleSheets')) return 'sheets';
    if (n8nType.includes('gmail')) return 'gmail';
    if (n8nType.includes('googleDrive')) return 'drive';
    if (n8nType.includes('googleCalendar')) return 'calendar';
    if (n8nType.includes('code')) return 'code_execution';
    return 'google_search';
}

function extractSystemPrompt(params: Record<string, unknown>): string {
    // Try common n8n parameter names for system prompts
    return (
        (params.systemMessage as string) ||
        (params.systemPrompt as string) ||
        (params.instructions as string) ||
        ''
    );
}

function extractToolConfig(params: Record<string, unknown>): Record<string, unknown> {
    const config: Record<string, unknown> = {};

    if (params.sheetId) config.spreadsheetId = params.sheetId;
    if (params.sheetName) config.sheetName = params.sheetName;
    if (params.sendTo) config.to = params.sendTo;
    if (params.subject) config.subject = params.subject;

    return config;
}

function extractCategories(params: Record<string, unknown>): string[] {
    // Try to extract categories from switch/if node parameters
    const rules = params.rules as Array<{ value?: string }> | undefined;
    if (rules && Array.isArray(rules)) {
        return rules.map((r, i) => r.value || `Branch ${i + 1}`);
    }
    return ['True', 'False'];
}

// ============================================
// Export
// ============================================

export default {
    convertN8nToG8n,
};
