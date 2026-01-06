// G8N Views - Placeholder Nodes
// Temporary implementations for nodes not yet fully built

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import type { NodeProps } from '@xyflow/react';
import type { G8nNodeData } from '../../models/types';

// ToolNode moved to its own file

import { Handle, Position } from '@xyflow/react';

export const ConditionNode = memo((props: NodeProps<any>) => (
    <BaseNode {...(props as any)} data={props.data as G8nNodeData} icon="❓">
        <Handle type="target" position={Position.Top} id="cond-input" />
    </BaseNode>
));

export const MemoryNode = memo((props: NodeProps<any>) => (
    <BaseNode {...(props as any)} data={props.data as G8nNodeData} icon="🧠">
        <Handle type="target" position={Position.Top} id="mem-input" />
    </BaseNode>
));
