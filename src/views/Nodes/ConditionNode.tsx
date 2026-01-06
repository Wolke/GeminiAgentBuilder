// G8N Views - ConditionNode Component

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { ConditionNodeData } from '../../models/types';

export const ConditionNode = memo((props: NodeProps<Node<ConditionNodeData>>) => {
    const { data } = props;
    const categories = data.categories || [];

    return (
        <BaseNode {...props} icon="❓" hasOutput={false}>
            {/* Input Handle (Top) */}
            <Handle
                type="target"
                position={Position.Top}
                id="condition-input"
                isConnectable={true}
                className="g8n-handle-top"
            />

            <div className="node-info">
                <div style={{ fontWeight: 600 }}>Router</div>
                <div style={{ fontSize: 10, opacity: 0.7 }}>
                    Model: {data.model}
                </div>
            </div>

            <div className="condition-outputs">
                {categories.map((category, index) => (
                    <div key={index} className="condition-output-row">
                        <span className="output-label">{category}</span>
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`category-${index}`}
                            isConnectable={true}
                            className="g8n-handle-right"
                            style={{ top: 'auto', right: -6 }}
                        />
                    </div>
                ))}
                {categories.length === 0 && (
                    <div style={{ fontSize: 10, color: '#666', fontStyle: 'italic', marginTop: 4 }}>
                        No categories defined
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

ConditionNode.displayName = 'ConditionNode';
