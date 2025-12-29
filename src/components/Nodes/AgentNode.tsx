import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { AgentNodeData } from '../../types';
import './nodes.css';

export function AgentNode({ data, selected }: NodeProps) {
    const nodeData = data as AgentNodeData & { isExecuting?: boolean };

    return (
        <div className={`custom-node agent-node ${selected ? 'selected' : ''} ${nodeData.isExecuting ? 'executing' : ''}`}>
            <Handle type="target" position={Position.Left} className="handle target-handle" />
            <div className="node-header">
                <span className="node-icon">🤖</span>
                <span className="node-title">{nodeData.label}</span>
            </div>
            <div className="node-content">
                <div className="node-model">{nodeData.model}</div>
                <div className="node-prompt" title={nodeData.systemPrompt}>
                    {nodeData.systemPrompt?.slice(0, 50)}
                    {nodeData.systemPrompt?.length > 50 ? '...' : ''}
                </div>
                {nodeData.enabledTools?.length > 0 && (
                    <div className="node-tools">
                        🔧 {nodeData.enabledTools.length} tool(s)
                    </div>
                )}
            </div>
            <Handle type="source" position={Position.Right} className="handle source-handle" />
        </div>
    );
}
