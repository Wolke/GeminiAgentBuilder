// G8N Views - Canvas Component (Placeholder)

import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react';
import { StartNode, AgentNode, OutputNode, ToolNode, ConditionNode, MemoryNode } from '../Nodes';
import type { NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useG8nStore } from '../../models/store';
import './Canvas.css';

// Cast to any to avoid strict NodeTypes incompatibility for now, 
// as we know these components are compatible in practice.
const nodeTypes: any = {
    start: StartNode,
    agent: AgentNode,
    output: OutputNode,
    tool: ToolNode,
    condition: ConditionNode,
    memory: MemoryNode,
};

export function Canvas() {
    const { nodes, edges, onNodesChange, onEdgesChange, onConnect, selectNode } = useG8nStore();
    const appMode = useG8nStore((state) => state.ui.appMode);

    const isRunMode = appMode === 'run';

    return (
        <div className="g8n-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={isRunMode ? undefined : onNodesChange}
                onEdgesChange={isRunMode ? undefined : onEdgesChange}
                onConnect={isRunMode ? undefined : onConnect}
                onNodeClick={(_, node) => selectNode(node.id)}
                onPaneClick={() => selectNode(null)}
                nodesDraggable={!isRunMode}
                nodesConnectable={!isRunMode}
                fitView
                proOptions={{ hideAttribution: true }}
                defaultEdgeOptions={{
                    style: { stroke: '#5865f2', strokeWidth: 2 },
                }}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#3d3d5c" />
                <Controls className="g8n-canvas-controls" />
                <MiniMap
                    className="g8n-canvas-minimap"
                    maskColor="rgba(0, 0, 0, 0.8)"
                />
            </ReactFlow>
        </div>
    );
}
