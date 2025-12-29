// Properties Panel - Edit selected node properties

import { useWorkflowStore } from '../../stores';
import type {
    StartNodeData,
    AgentNodeData,
    ToolNodeData,
    ConditionNodeData,
    OutputNodeData,
    ToolType,
    GeminiModel
} from '../../types';
import './PropertiesPanel.css';

const GEMINI_MODELS_OPTIONS: { value: GeminiModel; label: string }[] = [
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Exp)' },
    { value: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
    { value: 'gemini-1.5-flash-8b', label: 'Gemini 1.5 Flash 8B' },
];

const TOOL_TYPE_OPTIONS: { value: ToolType; label: string }[] = [
    { value: 'google_search', label: 'Google Search' },
    { value: 'code_execution', label: 'Code Execution' },
    { value: 'function_calling', label: 'Function Calling' },
    { value: 'url_context', label: 'URL Context' },
];

export function PropertiesPanel() {
    const { nodes, selectedNodeId, updateNodeData, deleteNode } = useWorkflowStore();

    const selectedNode = nodes.find(n => n.id === selectedNodeId);

    if (!selectedNode) {
        return (
            <div className="properties-panel empty">
                <div className="empty-state">
                    <span className="empty-icon">👆</span>
                    <p>Select a node to edit its properties</p>
                </div>
            </div>
        );
    }

    const handleUpdate = (data: Partial<typeof selectedNode.data>) => {
        updateNodeData(selectedNode.id, data);
    };

    const renderStartNodeProps = (data: StartNodeData) => (
        <>
            <div className="prop-group">
                <label>Label</label>
                <input
                    type="text"
                    value={data.label}
                    onChange={(e) => handleUpdate({ label: e.target.value })}
                />
            </div>
            <div className="prop-group">
                <label>Input Variables</label>
                <div className="variables-list">
                    {data.inputVariables?.map((v, i) => (
                        <div key={i} className="variable-item">
                            <input
                                type="text"
                                value={v.name}
                                placeholder="Name"
                                onChange={(e) => {
                                    const vars = [...(data.inputVariables || [])];
                                    vars[i] = { ...vars[i], name: e.target.value };
                                    handleUpdate({ inputVariables: vars });
                                }}
                            />
                            <select
                                value={v.type}
                                onChange={(e) => {
                                    const vars = [...(data.inputVariables || [])];
                                    vars[i] = { ...vars[i], type: e.target.value as 'string' | 'number' | 'boolean' | 'object' };
                                    handleUpdate({ inputVariables: vars });
                                }}
                            >
                                <option value="string">String</option>
                                <option value="number">Number</option>
                                <option value="boolean">Boolean</option>
                                <option value="object">Object</option>
                            </select>
                        </div>
                    ))}
                    <button
                        className="add-variable-btn"
                        onClick={() => handleUpdate({
                            inputVariables: [...(data.inputVariables || []), { name: '', type: 'string' }]
                        })}
                    >
                        + Add Variable
                    </button>
                </div>
            </div>
        </>
    );

    const renderAgentNodeProps = (data: AgentNodeData) => (
        <>
            <div className="prop-group">
                <label>Label</label>
                <input
                    type="text"
                    value={data.label}
                    onChange={(e) => handleUpdate({ label: e.target.value })}
                />
            </div>
            <div className="prop-group">
                <label>Model</label>
                <select
                    value={data.model}
                    onChange={(e) => handleUpdate({ model: e.target.value as GeminiModel })}
                >
                    {GEMINI_MODELS_OPTIONS.map(m => (
                        <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                </select>
            </div>
            <div className="prop-group">
                <label>System Prompt</label>
                <textarea
                    value={data.systemPrompt}
                    onChange={(e) => handleUpdate({ systemPrompt: e.target.value })}
                    rows={4}
                    placeholder="Enter system instructions..."
                />
            </div>
            <div className="prop-group">
                <label>Temperature: {data.temperature}</label>
                <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={data.temperature}
                    onChange={(e) => handleUpdate({ temperature: parseFloat(e.target.value) })}
                />
            </div>
            <div className="prop-group">
                <label>Enabled Tools</label>
                <div className="tools-checkboxes">
                    {TOOL_TYPE_OPTIONS.map(t => (
                        <label key={t.value} className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={data.enabledTools?.includes(t.value) || false}
                                onChange={(e) => {
                                    const tools = data.enabledTools || [];
                                    if (e.target.checked) {
                                        handleUpdate({ enabledTools: [...tools, t.value] });
                                    } else {
                                        handleUpdate({ enabledTools: tools.filter(x => x !== t.value) });
                                    }
                                }}
                            />
                            {t.label}
                        </label>
                    ))}
                </div>
            </div>
        </>
    );

    const renderToolNodeProps = (data: ToolNodeData) => (
        <>
            <div className="prop-group">
                <label>Label</label>
                <input
                    type="text"
                    value={data.label}
                    onChange={(e) => handleUpdate({ label: e.target.value })}
                />
            </div>
            <div className="prop-group">
                <label>Tool Type</label>
                <select
                    value={data.toolType}
                    onChange={(e) => handleUpdate({ toolType: e.target.value as ToolType })}
                >
                    {TOOL_TYPE_OPTIONS.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                </select>
            </div>
            {data.toolType === 'function_calling' && (
                <>
                    <div className="prop-group">
                        <label>Function Name</label>
                        <input
                            type="text"
                            value={data.config?.functionName || ''}
                            onChange={(e) => handleUpdate({ config: { ...data.config, functionName: e.target.value } })}
                            placeholder="my_function"
                        />
                    </div>
                    <div className="prop-group">
                        <label>Description</label>
                        <textarea
                            value={data.config?.functionDescription || ''}
                            onChange={(e) => handleUpdate({ config: { ...data.config, functionDescription: e.target.value } })}
                            rows={2}
                            placeholder="What this function does..."
                        />
                    </div>
                </>
            )}
            {data.toolType === 'url_context' && (
                <div className="prop-group">
                    <label>Target URL</label>
                    <input
                        type="url"
                        value={data.config?.targetUrl || ''}
                        onChange={(e) => handleUpdate({ config: { ...data.config, targetUrl: e.target.value } })}
                        placeholder="https://..."
                    />
                </div>
            )}
        </>
    );

    const renderConditionNodeProps = (data: ConditionNodeData) => (
        <>
            <div className="prop-group">
                <label>Label</label>
                <input
                    type="text"
                    value={data.label}
                    onChange={(e) => handleUpdate({ label: e.target.value })}
                />
            </div>
            <div className="prop-group">
                <label>Condition Type</label>
                <select
                    value={data.conditionType}
                    onChange={(e) => handleUpdate({ conditionType: e.target.value as ConditionNodeData['conditionType'] })}
                >
                    <option value="contains">Contains</option>
                    <option value="equals">Equals</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="less_than">Less Than</option>
                    <option value="custom">Custom Expression</option>
                </select>
            </div>
            <div className="prop-group">
                <label>Value</label>
                <input
                    type="text"
                    value={data.conditionValue}
                    onChange={(e) => handleUpdate({ conditionValue: e.target.value })}
                    placeholder="Enter value to compare..."
                />
            </div>
            {data.conditionType === 'custom' && (
                <div className="prop-group">
                    <label>Custom Expression</label>
                    <textarea
                        value={data.customExpression || ''}
                        onChange={(e) => handleUpdate({ customExpression: e.target.value })}
                        rows={3}
                        placeholder="e.g., input.length > 10"
                    />
                </div>
            )}
        </>
    );

    const renderOutputNodeProps = (data: OutputNodeData) => (
        <>
            <div className="prop-group">
                <label>Label</label>
                <input
                    type="text"
                    value={data.label}
                    onChange={(e) => handleUpdate({ label: e.target.value })}
                />
            </div>
            <div className="prop-group">
                <label>Output Format</label>
                <select
                    value={data.outputFormat}
                    onChange={(e) => handleUpdate({ outputFormat: e.target.value as OutputNodeData['outputFormat'] })}
                >
                    <option value="text">Text</option>
                    <option value="json">JSON</option>
                    <option value="markdown">Markdown</option>
                </select>
            </div>
        </>
    );

    return (
        <div className="properties-panel">
            <div className="panel-header">
                <h3>{selectedNode.type?.toUpperCase()} Node</h3>
                <button
                    className="delete-node-btn"
                    onClick={() => deleteNode(selectedNode.id)}
                    title="Delete Node"
                >
                    🗑
                </button>
            </div>
            <div className="panel-content">
                {selectedNode.type === 'start' && renderStartNodeProps(selectedNode.data as StartNodeData)}
                {selectedNode.type === 'agent' && renderAgentNodeProps(selectedNode.data as AgentNodeData)}
                {selectedNode.type === 'tool' && renderToolNodeProps(selectedNode.data as ToolNodeData)}
                {selectedNode.type === 'condition' && renderConditionNodeProps(selectedNode.data as ConditionNodeData)}
                {selectedNode.type === 'output' && renderOutputNodeProps(selectedNode.data as OutputNodeData)}
            </div>
        </div>
    );
}
