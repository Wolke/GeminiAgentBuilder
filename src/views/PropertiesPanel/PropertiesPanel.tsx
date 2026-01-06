import { StartNodeForm, AgentNodeForm, OutputNodeForm, ToolNodeForm, AppSettingsForm } from './forms';
import { useG8nStore } from '../../models/store';
import type { G8nNodeData, StartNodeData, AgentNodeData, OutputNodeData, ToolNodeData } from '../../models/types';
import './PropertiesPanel.css';

export function PropertiesPanel() {
    const selectedNodeId = useG8nStore((state) => state.selectedNodeId);
    const nodes = useG8nStore((state) => state.nodes);
    const updateNodeData = useG8nStore((state) => state.updateNodeData);

    const selectedNode = nodes.find((node) => node.id === selectedNodeId);

    const updateSettings = useG8nStore((state) => state.updateSettings);
    const settings = useG8nStore((state) => state.settings);

    if (!selectedNode) {
        return (
            <div className="g8n-properties-panel">
                <div className="panel-header">
                    <h3>Global Settings</h3>
                </div>
                <AppSettingsForm
                    settings={settings}
                    onUpdate={updateSettings}
                />
            </div>
        );
    }

    const handleDataChange = (data: Partial<G8nNodeData>) => {
        updateNodeData(selectedNode.id, data);
    };

    return (
        <div className="g8n-properties-panel">
            <div className="panel-header">
                <h3>Properties</h3>
                <span className="node-type-badge">{selectedNode.type}</span>
            </div>
            <div className="panel-content">
                <div className="form-group">
                    <label>Label</label>
                    <input
                        type="text"
                        value={selectedNode.data.label || ''}
                        onChange={(e) =>
                            handleDataChange({ label: e.target.value })
                        }
                    />
                </div>

                <hr className="panel-divider" />

                {selectedNode.type === 'start' && (
                    <StartNodeForm
                        data={selectedNode.data as StartNodeData}
                        onChange={handleDataChange}
                    />
                )}

                {selectedNode.type === 'agent' && (
                    <AgentNodeForm
                        data={selectedNode.data as AgentNodeData}
                        onChange={handleDataChange}
                    />
                )}

                {selectedNode.type === 'output' && (
                    <OutputNodeForm
                        data={selectedNode.data as OutputNodeData}
                        onChange={handleDataChange}
                    />
                )}

                {selectedNode.type === 'tool' && (
                    <ToolNodeForm
                        data={selectedNode.data as ToolNodeData}
                        onChange={handleDataChange}
                    />
                )}

                {['condition', 'memory'].includes(selectedNode.type!) && (
                    <div className="form-group">
                        <p className="help-text">
                            Properties for <strong>{selectedNode.type}</strong> are under construction.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
