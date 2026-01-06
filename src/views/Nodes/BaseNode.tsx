// G8N Views - BaseNode Component
// Shared wrapper for all custom nodes

import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { G8nNodeData } from '../../models/types';
import './nodes.css';

// Use a looser type for BaseNodeProps to accommodate various Node types
interface BaseNodeProps {
    id: string;
    data: G8nNodeData;
    selected?: boolean;
    type?: string;
    icon?: string;
    hasInput?: boolean;
    hasOutput?: boolean;
    children?: React.ReactNode;
    [key: string]: any; // Allow other props passed by ReactFlow
}

export const BaseNode = memo(({
    id,
    data,
    selected,
    type,
    icon,
    hasInput = true,
    hasOutput = true,
    children,
    ...rest
}: BaseNodeProps) => {
    return (
        <div className={`g8n-node type-${type} ${selected ? 'selected' : ''}`}>
            {hasInput && (
                <Handle
                    type="target"
                    position={Position.Left}
                    isConnectable={true}
                />
            )}

            <div className="node-header">
                {icon && <span className="node-icon">{icon}</span>}
                <span className="node-title">{data.label}</span>
            </div>

            <div className="node-body">
                {children || <div className="node-info">Type: {type}</div>}
            </div>

            {hasOutput && (
                <Handle
                    type="source"
                    position={Position.Right}
                    isConnectable={true}
                />
            )}
        </div>
    );
});

BaseNode.displayName = 'BaseNode';
