// G8N Views - MemoryNode Component

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { MemoryNodeData } from '../../models/types';

export const MemoryNode = memo((props: NodeProps<Node<MemoryNodeData>>) => {
    const { data } = props;

    return (
        <BaseNode {...props} icon="🧠">
            {/* Handle for connecting from Agent (Top) */}
            <Handle
                type="target"
                position={Position.Top}
                id="memory-input"
                isConnectable={true}
                className="g8n-handle-top"
            />
            <div className="node-info">
                <div style={{ fontWeight: 600 }}>Local Memory</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>
                    Key: {data.storageKey || 'default'}
                </div>
            </div>
        </BaseNode>
    );
});

MemoryNode.displayName = 'MemoryNode';
