// Toolbar Component - Node palette and workflow controls

import { useWorkflowStore } from '../../stores';
import { NodeType } from '../../types';
import './Toolbar.css';

interface NodeItem {
    type: NodeType;
    label: string;
    icon: string;
    color: string;
}

const nodeItems: NodeItem[] = [
    { type: 'start', label: 'Start', icon: '▶', color: '#43b581' },
    { type: 'agent', label: 'Agent', icon: '🤖', color: '#5865f2' },
    { type: 'tool', label: 'Tool', icon: '🔧', color: '#faa61a' },
    { type: 'memory', label: 'Memory', icon: '🧠', color: '#9b59b6' },
    { type: 'condition', label: 'Classify', icon: '◇', color: '#f04747' },
    { type: 'output', label: 'Output', icon: '⬛', color: '#808090' },
];

import { WorkflowEngine } from '../../services';

export function Toolbar() {
    const {
        addNode,
        saveWorkflow,
        newWorkflow,
        workflowName,
        settings,
        updateSettings,
        execution,
        resetExecution,
        nodes,
    } = useWorkflowStore();

    const handleAddNode = (type: NodeType) => {
        // Calculate position that doesn't overlap with existing nodes
        const NODE_WIDTH = 200;
        const NODE_HEIGHT = 120;
        const PADDING = 30;

        if (nodes.length === 0) {
            // First node - place at center-ish location
            addNode(type, { x: 100, y: 150 });
            return;
        }

        // Find the rightmost node
        const rightmostNode = nodes.reduce((max, node) =>
            node.position.x > max.position.x ? node : max
            , nodes[0]);

        // Place new node to the right of the rightmost node
        const newX = rightmostNode.position.x + NODE_WIDTH + PADDING;
        const newY = rightmostNode.position.y;

        addNode(type, { x: newX, y: newY });
    };

    const isRunning = execution.status === 'running';

    return (
        <div className="toolbar">
            <div className="toolbar-section">
                <h3 className="toolbar-title">Nodes</h3>
                <div className="node-palette">
                    {nodeItems.map((item) => (
                        <button
                            key={item.type}
                            className="node-button"
                            onClick={() => handleAddNode(item.type)}
                            style={{ '--node-color': item.color } as React.CSSProperties}
                            title={`Add ${item.label} Node`}
                        >
                            <span className="node-button-icon">{item.icon}</span>
                            <span className="node-button-label">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="toolbar-section">
                <h3 className="toolbar-title">Workflow</h3>
                <div className="workflow-info">
                    <input
                        type="text"
                        className="workflow-name-input"
                        value={workflowName}
                        onChange={(e) => useWorkflowStore.setState({ workflowName: e.target.value })}
                        placeholder="Workflow name..."
                    />
                </div>
                <div className="toolbar-actions" style={{ flexWrap: 'wrap' }}>
                    <button
                        className={`action-button run ${isRunning ? 'running' : ''}`}
                        onClick={() => WorkflowEngine.run()}
                        disabled={isRunning}
                    >
                        {isRunning ? '⏳ ...' : '▶ Run'}
                    </button>
                    {execution.history.length > 0 && (
                        <button className="action-button reset" onClick={resetExecution}>
                            🧹
                        </button>
                    )}
                    <button className="action-button save" onClick={saveWorkflow}>
                        💾
                    </button>
                    <button className="action-button new" onClick={newWorkflow}>
                        ✨
                    </button>
                </div>
            </div>

            <div className="toolbar-section">
                <h3 className="toolbar-title">Settings</h3>
                <div className="settings-group">
                    <label className="settings-label">Gemini API Key</label>
                    <div className="api-key-row">
                        <input
                            type="password"
                            className="settings-input"
                            value={settings.geminiApiKey}
                            onChange={(e) => updateSettings({ geminiApiKey: e.target.value })}
                            placeholder="Enter your API key..."
                        />
                        <button
                            className="save-key-btn"
                            onClick={() => {
                                // Force save to localStorage
                                localStorage.setItem('gemini-agent-builder-storage', JSON.stringify({
                                    state: {
                                        savedWorkflows: useWorkflowStore.getState().savedWorkflows,
                                        settings: useWorkflowStore.getState().settings,
                                    }
                                }));
                                alert('API Key saved!');
                            }}
                            title="Save API Key"
                        >
                            💾
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
