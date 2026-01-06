// G8N Views - AgentNode Component

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { AgentNodeData } from '../../models/types';
import './nodes.css';

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

            {/* Agent Extension Handles (Bottom) */}
            <div className="agent-extension-handles">
                {/* Tool Handle - Left Bottom */}
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="agent-tool"
                    isConnectable={true}
                    className="g8n-handle-bottom handle-tool"
                    style={{ left: '30%' }}
                />
                <span className="handle-label tool-label">🔧</span>

                {/* Memory Handle - Right Bottom */}
                <Handle
                    type="source"
                    position={Position.Bottom}
                    id="agent-memory"
                    isConnectable={true}
                    className="g8n-handle-bottom handle-memory"
                    style={{ left: '70%' }}
                />
                <span className="handle-label memory-label">🧠</span>
            </div>
        </BaseNode>
    );
});

AgentNode.displayName = 'AgentNode';

