// G8N Controllers - useExecution Hook
// Handles workflow execution flow

import { useCallback, useState, useRef } from 'react';
import { useG8nStore } from '../models/store';
import { useWorkflow } from './useWorkflow';
import { geminiClient } from '../services/gemini';
import type { G8nNode, GeminiModel } from '../models/types';

// ============================================
// Execution State Types
// ============================================

export interface ExecutionState {
    status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
    currentNodeId: string | null;
    executedNodes: string[];
    output: string | null;
    error: string | null;
    startTime: number | null;
    endTime: number | null;
}

export interface NodeExecutionResult {
    success: boolean;
    output?: unknown;
    error?: string;
    nextNodeIds?: string[];
}

// ============================================
// Hook
// ============================================

export function useExecution() {
    const { edges, getStartNode, getDownstreamNodes, getNodeById, validateWorkflow } = useWorkflow();
    const settings = useG8nStore((state) => state.settings);

    const [executionState, setExecutionState] = useState<ExecutionState>({
        status: 'idle',
        currentNodeId: null,
        executedNodes: [],
        output: null,
        error: null,
        startTime: null,
        endTime: null,
    });

    const abortRef = useRef(false);
    const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

    // Execute a single node
    const executeNode = useCallback(async (node: G8nNode, input: unknown): Promise<NodeExecutionResult> => {
        console.log(`[Execution] Executing node: ${node.data.label} (${node.type})`);

        switch (node.type) {
            case 'start':
                return { success: true, output: input, nextNodeIds: getDownstreamNodes(node.id).map((n) => n.id) };

            case 'agent': {
                if (!settings.geminiApiKey) {
                    return { success: false, error: 'Gemini API Key not configured' };
                }

                try {
                    // Build the prompt with conversation history
                    const systemPrompt = node.data.systemPrompt as string || '';
                    const messages = conversationHistoryRef.current.map((m) =>
                        `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`
                    ).join('\n');
                    const fullPrompt = messages ? `${messages}\nUser: ${input}` : String(input);

                    const response = await geminiClient.generateContent(fullPrompt, {
                        apiKey: settings.geminiApiKey,
                        model: (node.data.model as GeminiModel) || 'gemini-2.5-flash',
                        systemInstruction: systemPrompt,
                        temperature: node.data.temperature as number || 0.7,
                    });

                    conversationHistoryRef.current.push(
                        { role: 'user', content: String(input) },
                        { role: 'model', content: response.text }
                    );

                    return {
                        success: true,
                        output: response.text,
                        nextNodeIds: getDownstreamNodes(node.id).map((n) => n.id),
                    };
                } catch (error) {
                    return { success: false, error: error instanceof Error ? error.message : 'Agent execution failed' };
                }
            }

            case 'tool':
                // Tool execution placeholder - will be handled by GAS bridge in Phase 5/6
                console.log(`[Execution] Tool node: ${node.data.toolType}`);
                return {
                    success: true,
                    output: `[Tool: ${node.data.toolType}] - Execution pending GAS integration`,
                    nextNodeIds: getDownstreamNodes(node.id).map((n) => n.id),
                };

            case 'memory':
                // Memory node just passes through - actual memory handling is in Agent node
                return {
                    success: true,
                    output: input,
                    nextNodeIds: getDownstreamNodes(node.id).map((n) => n.id),
                };

            case 'condition': {
                // Simple condition: use first category for now (TODO: implement LLM classification)
                const downstreamNodes = getDownstreamNodes(node.id);

                // For now, route to first output
                const selectedCategory = 0;
                const targetEdge = edges.find(
                    (e) => e.source === node.id && e.sourceHandle === `category-${selectedCategory}`
                );

                const nextIds = targetEdge
                    ? [targetEdge.target]
                    : downstreamNodes.slice(0, 1).map((n) => n.id);

                return {
                    success: true,
                    output: input,
                    nextNodeIds: nextIds,
                };
            }

            case 'output':
                return {
                    success: true,
                    output: input,
                    nextNodeIds: [], // Terminal node
                };

            default:
                return { success: false, error: `Unknown node type: ${node.type}` };
        }
    }, [settings.geminiApiKey, getDownstreamNodes, edges]);

    // Run the workflow
    const runWorkflow = useCallback(async (initialInput: string) => {
        abortRef.current = false;
        conversationHistoryRef.current = [];

        // Validate
        const validation = validateWorkflow();
        if (!validation.isValid) {
            setExecutionState({
                status: 'error',
                currentNodeId: null,
                executedNodes: [],
                output: null,
                error: validation.errors.join(', '),
                startTime: null,
                endTime: null,
            });
            return;
        }

        const startNode = getStartNode();
        if (!startNode) {
            setExecutionState((prev) => ({ ...prev, status: 'error', error: 'No start node found' }));
            return;
        }

        const startTime = Date.now();
        setExecutionState({
            status: 'running',
            currentNodeId: startNode.id,
            executedNodes: [],
            output: null,
            error: null,
            startTime,
            endTime: null,
        });

        // BFS-style execution
        const queue: Array<{ nodeId: string; input: unknown }> = [{ nodeId: startNode.id, input: initialInput }];
        const executed: string[] = [];
        let finalOutput: unknown = null;

        while (queue.length > 0 && !abortRef.current) {
            const { nodeId, input } = queue.shift()!;
            const node = getNodeById(nodeId);

            if (!node || executed.includes(nodeId)) continue;

            setExecutionState((prev) => ({ ...prev, currentNodeId: nodeId }));

            const result = await executeNode(node, input);
            executed.push(nodeId);

            setExecutionState((prev) => ({ ...prev, executedNodes: [...executed] }));

            if (!result.success) {
                setExecutionState((prev) => ({
                    ...prev,
                    status: 'error',
                    error: result.error || 'Execution failed',
                    endTime: Date.now(),
                }));
                return;
            }

            // Queue next nodes
            if (result.nextNodeIds && result.nextNodeIds.length > 0) {
                for (const nextId of result.nextNodeIds) {
                    queue.push({ nodeId: nextId, input: result.output });
                }
            } else {
                // Terminal node
                finalOutput = result.output;
            }

            // Small delay for UI feedback
            await new Promise((r) => setTimeout(r, 100));
        }

        setExecutionState({
            status: abortRef.current ? 'idle' : 'completed',
            currentNodeId: null,
            executedNodes: executed,
            output: String(finalOutput),
            error: null,
            startTime,
            endTime: Date.now(),
        });
    }, [validateWorkflow, getStartNode, getNodeById, executeNode]);

    // Stop execution
    const stopExecution = useCallback(() => {
        abortRef.current = true;
        setExecutionState((prev) => ({ ...prev, status: 'idle', currentNodeId: null }));
    }, []);

    // Reset execution state
    const resetExecution = useCallback(() => {
        abortRef.current = false;
        conversationHistoryRef.current = [];
        setExecutionState({
            status: 'idle',
            currentNodeId: null,
            executedNodes: [],
            output: null,
            error: null,
            startTime: null,
            endTime: null,
        });
    }, []);

    return {
        executionState,
        runWorkflow,
        stopExecution,
        resetExecution,
    };
}
