/**
 * G8N - Workflow Runner
 * Decoupled execution logic that can be triggered from multiple sources:
 * - Manual (chat dialog)
 * - Webhook (doPost)
 * - Time-driven trigger (cron)
 * - Event-driven trigger (Sheets onEdit, Form submit, etc.)
 */

const WorkflowRunner = {
    /**
     * Main entry point - called from any trigger source
     * @param {string} input - User input or trigger data
     * @param {string} triggerType - 'manual' | 'webhook' | 'cron' | 'sheets_edit' | 'sheets_submit' | etc.
     * @param {object} triggerMeta - Additional trigger-specific metadata
     * @returns {object} { success: boolean, output?: string, error?: string }
     */
    run(input, triggerType, triggerMeta) {
        console.log(`[WorkflowRunner] Running with trigger: ${triggerType}`);
        console.log(`[WorkflowRunner] Input: ${input}`);
        console.log(`[WorkflowRunner] Meta: ${JSON.stringify(triggerMeta)}`);

        try {
            // Get the workflow from storage
            const workflow = this.getWorkflow();
            if (!workflow) {
                return { success: false, error: 'No workflow configured' };
            }

            // Find start node
            const startNode = workflow.nodes.find(n => n.type === 'start');
            if (!startNode) {
                return { success: false, error: 'Workflow has no start node' };
            }

            // Build execution context
            const context = {
                input: input,
                triggerType: triggerType,
                triggerMeta: triggerMeta,
                conversationHistory: [],
                variables: {},
                currentOutput: input,
                logs: [] // Capture execution logs
            };

            // Helper to log to both console and context
            context.logger = (message) => {
                console.log(message);
                context.logs.push(`[${new Date().toISOString().split('T')[1].slice(0, -1)}] ${message}`);
            };

            context.logger(`[WorkflowRunner] Starting execution with trigger: ${triggerType}`);
            context.logger(`[WorkflowRunner] Input: ${input}`);

            // Execute from start node
            const result = this.executeFromNode(workflow, startNode.id, context);

            return {
                success: true,
                output: result.output,
                executedNodes: result.executedNodes,
                logs: context.logs
            };

        } catch (error) {
            console.error('[WorkflowRunner] Error:', error);
            return { success: false, error: error.toString() };
        }
    },

    /**
     * Get workflow from storage
     */
    getWorkflow() {
        // Try G8nWorkflow.gs first (as a function)
        if (typeof getWorkflow === 'function') {
            return getWorkflow();
        }
        // Fall back to Engine storage
        return Engine.getWorkflow();
    },

    /**
     * Execute workflow starting from a specific node
     */
    executeFromNode(workflow, nodeId, context) {
        const executedNodes = [];
        const maxIterations = 100; // Safety limit
        let iterations = 0;
        let currentNodeId = nodeId;

        while (currentNodeId && iterations < maxIterations) {
            iterations++;
            const node = workflow.nodes.find(n => n.id === currentNodeId);

            if (!node) {
                context.logger(`[WorkflowRunner] Node not found: ${currentNodeId}`);
                break;
            }

            context.logger(`[WorkflowRunner] Executing node: ${node.data.label || node.type} (${node.type})`);
            executedNodes.push(node.id);

            // Execute node based on type
            const result = this.executeNode(node, context, workflow);

            if (result.output !== undefined && typeof result.output !== 'object') {
                context.logger(`[WorkflowRunner] Node Output: ${String(result.output).substring(0, 100)}${String(result.output).length > 100 ? '...' : ''}`);
            }

            // Update context with output
            context.currentOutput = result.output;

            // Get next node
            if (result.nextNodeId) {
                currentNodeId = result.nextNodeId;
            } else {
                // Find connected edge
                const edge = workflow.edges.find(e => e.source === node.id);
                currentNodeId = edge ? edge.target : null;
            }

            // Terminal node
            if (node.type === 'output') {
                break;
            }
        }

        return {
            output: context.currentOutput,
            executedNodes: executedNodes
        };
    },

    /**
     * Execute a single node
     */
    executeNode(node, context, workflow) {
        switch (node.type) {
            case 'start':
                return { output: context.input };

            case 'agent':
                return this.executeAgentNode(node, context);

            case 'tool':
                return this.executeToolNode(node, context);

            case 'condition':
                return this.executeConditionNode(node, context, workflow);

            case 'output':
                return { output: context.currentOutput };

            default:
                return { output: context.currentOutput };
        }
    },

    /**
     * Execute Agent node - calls Gemini API
     */
    executeAgentNode(node, context) {
        const systemPrompt = node.data.systemPrompt || '';
        const prompt = context.currentOutput;

        // Build conversation context
        let fullPrompt = prompt;
        if (context.conversationHistory.length > 0) {
            const history = context.conversationHistory
                .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
                .join('\n');
            fullPrompt = `${history}\nUser: ${prompt}`;
        }

        // Call Gemini
        const response = this.callGemini(fullPrompt, systemPrompt, node.data.model || 'gemini-2.5-flash');

        // Update conversation history
        context.conversationHistory.push(
            { role: 'user', content: String(prompt) },
            { role: 'model', content: response }
        );

        return { output: response };
    },

    /**
     * Execute Tool node
     */
    executeToolNode(node, context) {
        const toolType = node.data.toolType || 'unknown';
        const config = node.data.config || {};

        // Add current context to config
        config.input = context.currentOutput;

        try {
            const result = Engine.executeTool(toolType, config);
            return { output: typeof result === 'string' ? result : JSON.stringify(result) };
        } catch (error) {
            return { output: `Tool error: ${error.toString()}` };
        }
    },

    /**
     * Execute Condition node
     */
    executeConditionNode(node, context, workflow) {
        // For now, just go to first category
        // TODO: Implement LLM-based classification
        const edges = workflow.edges.filter(e => e.source === node.id);

        if (edges.length > 0) {
            return {
                output: context.currentOutput,
                nextNodeId: edges[0].target
            };
        }

        return { output: context.currentOutput };
    },

    /**
     * Call Gemini API
     */
    callGemini(prompt, systemPrompt, model) {
        const apiKey = this.getApiKey();
        if (!apiKey) {
            throw new Error('Gemini API Key not configured. Please sync from Gemini Agent Builder.');
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }]
        };

        if (systemPrompt) {
            payload.systemInstruction = { parts: [{ text: systemPrompt }] };
        }

        const options = {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
            muteHttpExceptions: true
        };

        const response = UrlFetchApp.fetch(url, options);
        const data = JSON.parse(response.getContentText());

        if (data.error) {
            throw new Error(data.error.message || 'Gemini API error');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
            throw new Error('No response from Gemini');
        }

        return text;
    },

    /**
     * Get Gemini API Key from properties
     */
    getApiKey() {
        return PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    }
};

// ============================================
// Global Functions (called from HTML/triggers)
// ============================================

/**
 * Run workflow - called from TestDialog.html
 */
function runWorkflow(input, triggerType, triggerMeta) {
    return WorkflowRunner.run(input, triggerType, triggerMeta || {});
}

/**
 * Check settings - called from TestDialog.html
 */
function checkSettings() {
    const apiKey = PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY');
    return {
        hasKey: !!apiKey,
        keyPreview: apiKey ? apiKey.substring(0, 8) + '...' : null
    };
}

/**
 * Set Gemini API Key - called from frontend sync
 */
function setGeminiApiKey(apiKey) {
    PropertiesService.getScriptProperties().setProperty('GEMINI_API_KEY', apiKey);
    return { success: true };
}
