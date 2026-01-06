// G8N Node Executors - Pluggable per-node execution logic

import type { G8nNode, GeminiModel, ToolConfig } from '../../models/types';
import { geminiClient } from '../gemini';
import type { NodeExecutionResult } from './engine';

// ============================================
// Executor Interface
// ============================================

export type NodeExecutor = (
    node: G8nNode,
    input: unknown,
    context: ExecutorContext
) => Promise<NodeExecutionResult>;

export interface ExecutorContext {
    apiKey: string;
    conversationHistory: Array<{ role: string; content: string }>;
    getDownstreamNodeIds: (nodeId: string) => string[];
    // Optional GAS execution callback
    executeGasTool?: (toolType: string, config: ToolConfig) => Promise<{ success: boolean; data?: unknown; error?: string }>;
}

// ============================================
// Node Executors Map
// ============================================

const executors: Record<string, NodeExecutor> = {
    start: async (node, input, context) => {
        return {
            success: true,
            output: input,
            nextNodeIds: context.getDownstreamNodeIds(node.id),
        };
    },

    agent: async (node, input, context) => {
        if (!context.apiKey) {
            return { success: false, error: 'Gemini API Key not configured' };
        }

        try {
            const systemPrompt = (node.data.systemPrompt as string) || '';
            const messages = context.conversationHistory
                .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');
            const fullPrompt = messages ? `${messages}\nUser: ${input}` : String(input);

            const response = await geminiClient.generateContent(fullPrompt, {
                apiKey: context.apiKey,
                model: (node.data.model as GeminiModel) || 'gemini-2.5-flash',
                systemInstruction: systemPrompt,
                temperature: (node.data.temperature as number) || 0.7,
            });

            context.conversationHistory.push(
                { role: 'user', content: String(input) },
                { role: 'model', content: response.text }
            );

            return {
                success: true,
                output: response.text,
                nextNodeIds: context.getDownstreamNodeIds(node.id),
                metadata: { tokensUsed: response.tokensUsed },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Agent execution failed',
            };
        }
    },

    tool: async (node, input, context) => {
        const toolType = node.data.toolType as string;
        const config = (node.data.config as ToolConfig) || {};
        const useGas = node.data.useGas ?? false;

        // GAS tools or useGas=true -> require GAS Web App
        const gasOnlyTools = ['sheets', 'gmail', 'drive', 'calendar', 'youtube'];
        const isGasTool = gasOnlyTools.includes(toolType);

        if (isGasTool || useGas) {
            // Execute via GAS bridge
            if (!context.executeGasTool) {
                return {
                    success: false,
                    error: `Tool "${toolType}" requires GAS Web App. Please configure GAS settings and sync workflow.`,
                };
            }

            console.log(`[NodeExecutor] Executing via GAS: ${toolType}`);
            const result = await context.executeGasTool(toolType, { ...config, input: String(input) });

            if (result.success) {
                return {
                    success: true,
                    output: result.data,
                    nextNodeIds: context.getDownstreamNodeIds(node.id),
                    metadata: { toolType, executedViaGas: true },
                };
            } else {
                return {
                    success: false,
                    error: result.error || 'GAS tool execution failed',
                };
            }
        }

        // Gemini builtin tools - execute locally via Gemini API
        console.log(`[NodeExecutor] Executing locally: ${toolType}`);

        try {
            const prompt = `You are a helpful assistant with access to the ${toolType.replace('_', ' ')} tool.
            
User request: ${String(input)}

Use the available tool to help answer this request.`;

            const response = await geminiClient.generateContent(prompt, {
                apiKey: context.apiKey,
                model: 'gemini-2.5-flash',
                temperature: 0.7,
            });

            return {
                success: true,
                output: response.text,
                nextNodeIds: context.getDownstreamNodeIds(node.id),
                metadata: { toolType, executedLocally: true, tokensUsed: response.tokensUsed },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Tool execution failed',
            };
        }
    },

    memory: async (node, input, context) => {
        // Memory node passes through - actual memory is handled in agent executor
        return {
            success: true,
            output: input,
            nextNodeIds: context.getDownstreamNodeIds(node.id),
        };
    },

    condition: async (node, input, context) => {
        // TODO: Implement LLM-based classification
        // For now, route to first output
        const nextIds = context.getDownstreamNodeIds(node.id);
        return {
            success: true,
            output: input,
            nextNodeIds: nextIds.slice(0, 1),
        };
    },

    output: async (_node, input, _context) => {
        return {
            success: true,
            output: input,
            nextNodeIds: [], // Terminal node
        };
    },
};

// ============================================
// Executor Functions
// ============================================

export function getExecutor(nodeType: string): NodeExecutor | undefined {
    return executors[nodeType];
}

export function executeNode(
    node: G8nNode,
    input: unknown,
    context: ExecutorContext
): Promise<NodeExecutionResult> {
    const executor = getExecutor(node.type || 'unknown');
    if (!executor) {
        return Promise.resolve({
            success: false,
            error: `No executor found for node type: ${node.type}`,
        });
    }
    return executor(node, input, context);
}

export function registerExecutor(nodeType: string, executor: NodeExecutor): void {
    executors[nodeType] = executor;
}

// ============================================
// Export
// ============================================

export const nodeExecutors = {
    getExecutor,
    executeNode,
    registerExecutor,
};

export default nodeExecutors;
