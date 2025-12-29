// Workflow Execution Engine - Orchestrates node execution

import { useWorkflowStore } from '../stores/workflowStore';
import { generateContent, initializeGemini } from './geminiService';
import type {
    WorkflowNode,
    ExecutionStep,
    NodeType,
    AgentNodeData,
    ConditionNodeData,
    ToolNodeData,
    OutputNodeData
} from '../types';

export class WorkflowEngine {
    private static isRunning = false;

    /**
     * Runs the current workflow stored in useWorkflowStore
     * @param userInput - The initial user input to pass through the workflow
     * @returns The final output from the workflow
     */
    static async run(userInput: string = ''): Promise<any> {
        if (this.isRunning) return null;

        const store = useWorkflowStore.getState();
        const { nodes, edges, settings } = store;

        // Validation
        if (!settings.geminiApiKey) {
            console.error('Gemini API Key missing');
            store.setExecutionStatus('error');
            return;
        }

        const startNode = nodes.find(n => n.type === 'start');
        if (!startNode) {
            console.error('Start node not found');
            store.setExecutionStatus('error');
            return;
        }

        this.isRunning = true;

        try {
            // Initialization
            initializeGemini(settings.geminiApiKey);
            store.resetExecution();
            store.setExecutionStatus('running');

            let currentNode: WorkflowNode | undefined = startNode;
            const variables: Record<string, unknown> = {
                user_input: userInput,
                last_output: userInput,
            };
            let finalOutput: any = null;

            while (currentNode) {
                const startTime = Date.now();
                const nodeType = currentNode.type as NodeType;

                // 1. Execute current node logic
                const result = await this.executeNode(currentNode, variables);

                // 2. Record execution step
                const step: ExecutionStep = {
                    nodeId: currentNode.id,
                    nodeType: nodeType,
                    input: { ...variables },
                    output: result,
                    startTime,
                    endTime: Date.now(),
                };
                store.addExecutionStep(step);

                // 3. Update execution context variables
                if (result !== undefined && result !== null) {
                    variables[`${currentNode.id}_output`] = result;
                    // For text-based nodes, update the 'last_output' for convenience
                    if (typeof result === 'string') {
                        variables['last_output'] = result;
                    } else if (typeof result === 'object' && 'text' in (result as any)) {
                        variables['last_output'] = (result as any).text;
                    }
                    // Capture output node result as final output
                    if (currentNode.type === 'output') {
                        finalOutput = variables['last_output'] || result;
                    }
                }

                // 4. Determine next node based on edges and result
                currentNode = this.getNextNode(currentNode, edges, nodes, result);

                // Small delay for visual perception of flow
                await new Promise(resolve => setTimeout(resolve, 600));
            }

            store.setExecutionStatus('completed');
            return finalOutput;
        } catch (error: any) {
            console.error('Workflow execution failed:', error);
            store.setExecutionStatus('error');
            return null;
        } finally {
            this.isRunning = false;
        }
    }

    private static async executeNode(node: WorkflowNode, variables: Record<string, unknown>): Promise<any> {
        const data = node.data;

        switch (node.type) {
            case 'start': {
                // Pass through user input
                return variables['user_input'] || 'Workflow started';
            }

            case 'agent': {
                const agentData = data as AgentNodeData;
                // Use last_output as the prompt if available, otherwise use a default
                const prompt = (variables['last_output'] as string) || "Hello, how can you help me today?";

                const result = await generateContent(prompt, agentData.systemPrompt, {
                    codeExecution: agentData.enabledTools.includes('code_execution'),
                    googleSearch: agentData.enabledTools.includes('google_search'),
                });

                return result;
            }

            case 'condition': {
                const condData = data as ConditionNodeData;
                const input = String(variables['last_output'] || "");

                let matches = false;
                switch (condData.conditionType) {
                    case 'contains':
                        matches = input.toLowerCase().includes(condData.conditionValue.toLowerCase());
                        break;
                    case 'equals':
                        matches = input === condData.conditionValue;
                        break;
                    case 'greater_than':
                        matches = Number(input) > Number(condData.conditionValue);
                        break;
                    case 'less_than':
                        matches = Number(input) < Number(condData.conditionValue);
                        break;
                    case 'custom':
                        // Basic eval risk noted, but helpful for prototype
                        try {
                            const evalFn = new Function('input', `return ${condData.customExpression}`);
                            matches = !!evalFn(input);
                        } catch (e) {
                            console.error('Custom condition eval failed', e);
                            matches = false;
                        }
                        break;
                }

                return matches;
            }

            case 'tool': {
                const toolData = data as ToolNodeData;
                // Currently most tools are integrated directly into the Agent node in Gemini API
                // For a separate Tool node, we could implement specific logic here
                return { status: 'success', tool: toolData.toolType, message: `Executed ${toolData.label}` };
            }

            case 'output': {
                const outputData = data as OutputNodeData;
                return {
                    format: outputData.outputFormat,
                    content: variables['last_output'] || "No content generated"
                };
            }

            default:
                return null;
        }
    }

    private static getNextNode(
        current: WorkflowNode,
        edges: any[],
        nodes: WorkflowNode[],
        result: any
    ): WorkflowNode | undefined {
        // Special handling for condition nodes branching
        if (current.type === 'condition') {
            const handleId = result === true ? 'true' : 'false';
            const edge = edges.find(e => e.source === current.id && e.sourceHandle === handleId);
            if (!edge) return undefined;
            return nodes.find(n => n.id === edge.target);
        }

        // Default: find any outgoing edge
        const edge = edges.find(e => e.source === current.id);
        if (!edge) return undefined;
        return nodes.find(n => n.id === edge.target);
    }
}
