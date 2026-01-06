// G8N Views - AgentNode Component

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { AgentNodeData } from '../../models/types';

export const AgentNode = memo((props: NodeProps<Node<AgentNodeData>>) => {
    const { data } = props;

    return (
        <BaseNode {...props} icon="🤖">
            <div className="node-info">
                <div style={{ fontWeight: 600 }}>{data.model}</div>
                <div style={{ marginTop: 4, fontSize: 10, opacity: 0.7 }}>
                    Temp: {data.temperature}
                </div>
            </div>
            {/* Handle for connecting to Tools/Memory (Bottom) */}
            <Handle
                type="source"
                position={Position.Bottom}
                id="agent-extensions"
                isConnectable={true}
                className="g8n-handle-bottom"
            />
        </BaseNode>
    );
});

AgentNode.displayName = 'AgentNode';
