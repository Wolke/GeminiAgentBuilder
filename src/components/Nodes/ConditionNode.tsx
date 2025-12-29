import { Handle, Position } from '@xyflow/react';
import type { NodeProps } from '@xyflow/react';
import type { ConditionNodeData } from '../../types';
import './nodes.css';

const conditionLabels: Record<ConditionNodeData['conditionType'], string> = {
    contains: 'Contains',
    equals: 'Equals',
    greater_than: '>',
    less_than: '<',
    custom: 'Custom',
};

export function ConditionNode({ data, selected }: NodeProps) {
    const nodeData = data as ConditionNodeData;

    return (
        <div className={`custom-node condition-node ${selected ? 'selected' : ''}`}>
            <Handle type="target" position={Position.Left} className="handle target-handle" />
            <div className="node-header">
                <span className="node-icon">◇</span>
                <span className="node-title">{nodeData.label}</span>
            </div>
            <div className="node-content">
                <div className="condition-expression">
                    {conditionLabels[nodeData.conditionType]} "{nodeData.conditionValue}"
                </div>
            </div>
            <div className="condition-handles">
                <Handle
                    type="source"
                    position={Position.Right}
                    id="true"
                    className="handle source-handle true-handle"
                    style={{ top: '35%' }}
                />
                <Handle
                    type="source"
                    position={Position.Right}
                    id="false"
                    className="handle source-handle false-handle"
                    style={{ top: '65%' }}
                />
            </div>
            <div className="condition-labels">
                <span className="true-label">✓</span>
                <span className="false-label">✗</span>
            </div>
        </div>
    );
}
