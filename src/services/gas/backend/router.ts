export const ROUTER_JS = `const Router = {
  dispatch(request) {
    const { action, payload, token } = request;
    const storedToken = PropertiesService.getScriptProperties().getProperty('API_TOKEN');
    if (storedToken && token !== storedToken) {
      throw new Error('Unauthorized: Invalid API Token');
    }
    switch (action) {
      case 'ping': return 'pong';
      case 'tool.execute': return Engine.executeTool(payload.toolType, payload.config);
      case 'sheets':
      case 'gmail':
      case 'drive':
      case 'calendar':
      case 'youtube':
        return Engine.executeTool(action, payload);
      default:
        throw new Error('Unknown action: ' + action);
    }
  }
};`;
