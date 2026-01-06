// G8N Views - ToolNode Component

import { memo } from 'react';
import { BaseNode } from './BaseNode';
import { Handle, Position } from '@xyflow/react';
import type { NodeProps, Node } from '@xyflow/react';
import type { ToolNodeData } from '../../models/types';

const ICONS: Record<string, string> = {
    // Gemini
    google_search: '🔍',
    code_execution: '💻',
    url_context: '🔗',
    // GAS
    sheets: '📊',
    gmail: '📧',
    drive: '📁',
    calendar: '📅',
    youtube: '▶️',
    // Default
    default: '🔧'
};

export const ToolNode = memo((props: NodeProps<Node<ToolNodeData>>) => {
    const { data } = props;
    const toolType = data.toolType || 'google_search';
    const icon = ICONS[toolType] || ICONS.default;

    return (
        <BaseNode {...props} icon={icon}>
            {/* Handle for connecting from Agent (Top) */}
            <Handle
                type="target"
                position={Position.Top}
                id="tool-input"
                isConnectable={true}
                className="g8n-handle-top"
            />
            <div className="node-info">
                <div style={{ fontWeight: 600 }}>{toolType}</div>
                {toolType === 'sheets' && data.config?.sheetName && (
                    <div style={{ fontSize: 10, opacity: 0.7 }}>{data.config.sheetName}</div>
                )}
            </div>
        </BaseNode>
    );
});

ToolNode.displayName = 'ToolNode';
