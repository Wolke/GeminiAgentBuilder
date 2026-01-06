/**
 * G8N - GAS Router
 * Dispatches actions to appropriate handlers
 */

const Router = {
    dispatch(request) {
        const { action, payload, token } = request;

        // Basic token validation (in real app, use PropertiesService)
        const storedToken = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
        if (storedToken && token !== storedToken) {
            throw new Error('Unauthorized: Invalid API Token');
        }

        switch (action) {
            case 'ping':
                return 'pong';

            case 'system.sync_workflow':
                return Engine.syncWorkflow(payload.workflow);

            case 'tool.execute':
                return Engine.executeTool(payload.toolType, payload.config);

            // Tool-specific shortcuts
            case 'sheets':
            case 'gmail':
            case 'drive':
            case 'calendar':
            case 'youtube':
                return Engine.executeTool(action, payload);

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }
};
