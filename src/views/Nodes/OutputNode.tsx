// G8N Views - OutputNode Component

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import type { NodeProps, Node } from '@xyflow/react';
import type { OutputNodeData } from '../../models/types';

export const OutputNode = memo((props: NodeProps<Node<OutputNodeData>>) => {
    const { data } = props;

    return (
        <BaseNode {...props} icon="📤" hasOutput={false}>
            <div className="node-info">
                Format: <span style={{ fontWeight: 600 }}>{data.outputFormat}</span>
            </div>
        </BaseNode>
    );
});

OutputNode.displayName = 'OutputNode';
