// G8N Views - StartNode Component

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import type { NodeProps, Node } from '@xyflow/react';
import type { StartNodeData } from '../../models/types';

export const StartNode = memo((props: NodeProps<Node<StartNodeData>>) => {
    const { data } = props;

    return (
        <BaseNode {...props} icon="🟢" hasInput={false}>
            <div className="node-info">
                <div>Trigger: <span style={{ fontWeight: 600 }}>{data.triggerType}</span></div>
                {data.inputVariables && data.inputVariables.length > 0 && (
                    <div style={{ marginTop: 4, opacity: 0.8 }}>
                        Vars: {data.inputVariables.map(v => v.name).join(', ')}
                    </div>
                )}
            </div>
        </BaseNode>
    );
});

StartNode.displayName = 'StartNode';
