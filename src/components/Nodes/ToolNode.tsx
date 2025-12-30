import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ToolNodeData, ToolType } from '../../types';
import './nodes.css';

const toolIcons: Record<ToolType, string> = {
    function_calling: '⚡',
    code_execution: '💻',
    google_search: '🔍',
    google_maps: '🗺️',
    file_search: '📄',
    mcp: '🔌',
    url_context: '🌐',
};

const toolLabels: Record<ToolType, string> = {
    function_calling: 'Function Calling',
    code_execution: 'Code Execution',
    google_search: 'Google Search',
    google_maps: 'Google Maps',
    file_search: 'File Search',
    mcp: 'MCP Client',
    url_context: 'URL Context',
};

export function ToolNode({ data, selected }: NodeProps) {
    const nodeData = data as ToolNodeData & { isExecuting?: boolean };

    return (
        <div className={`custom-node tool-node ${selected ? 'selected' : ''} ${nodeData.isExecuting ? 'executing' : ''}`}>
            <Handle type="target" position={Position.Left} className="handle target-handle" />
            <div className="node-header">
                <span className="node-icon">{toolIcons[nodeData.toolType] || '🔧'}</span>
                <span className="node-title">{nodeData.label}</span>
            </div>
            <div className="node-content">
                <div className="node-tool-type">
                    {toolLabels[nodeData.toolType] || nodeData.toolType}
                </div>
                {nodeData.config?.functionName && (
                    <div className="node-function-name">
                        fn: {nodeData.config.functionName}
                    </div>
                )}
                {nodeData.config?.targetUrl && (
                    <div className="node-url" title={nodeData.config.targetUrl}>
                        {nodeData.config.targetUrl.slice(0, 30)}...
                    </div>
                )}
            </div>
            <Handle
                type="source"
                position={Position.Right}
                id="flow-output"
                className="handle source-handle"
            />
            <Handle
                type="source"
                position={Position.Bottom}
                id="tool-output"
                className="handle tool-handle-source"
                style={{ left: '50%', background: '#faa61a', borderColor: '#faa61a' }}
            />
        </div>
    );
}
