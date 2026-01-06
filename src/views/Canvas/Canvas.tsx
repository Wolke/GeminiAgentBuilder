// G8N Views - Canvas Component

import { useCallback } from 'react';
import { ReactFlow, Background, Controls, MiniMap, BackgroundVariant } from '@xyflow/react';
import { StartNode, AgentNode, OutputNode, ToolNode, ConditionNode, MemoryNode } from '../Nodes';
import '@xyflow/react/dist/style.css';
import { useG8nStore } from '../../models/store';
import './Canvas.css';

// Node type definitions
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

    // Validate connections based on handle types
    const isValidConnection = useCallback((connection: any) => {
        const { source, target, sourceHandle } = connection;
        if (!source || !target) return false;

        const sourceNode = nodes.find((n) => n.id === source);
        const targetNode = nodes.find((n) => n.id === target);

        if (!sourceNode || !targetNode) return false;

        // Agent's Tool handle -> Only Tool nodes
        if (sourceHandle === 'agent-tool') {
            return targetNode.type === 'tool';
        }

        // Agent's Memory handle -> Only Memory nodes
        if (sourceHandle === 'agent-memory') {
            return targetNode.type === 'memory';
        }

        // Tool nodes can only receive from Agent's tool handle
        if (targetNode.type === 'tool') {
            return sourceNode.type === 'agent' && sourceHandle === 'agent-tool';
        }

        // Memory nodes can only receive from Agent's memory handle
        if (targetNode.type === 'memory') {
            return sourceNode.type === 'agent' && sourceHandle === 'agent-memory';
        }

        // Default output handle (undefined/null) can connect to any node except tool/memory
        // This allows Agent -> Output, Start -> Agent, etc.
        return true;
    }, [nodes]);

    return (
        <div className="g8n-canvas">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={isRunMode ? undefined : onNodesChange}
                onEdgesChange={isRunMode ? undefined : onEdgesChange}
                onConnect={isRunMode ? undefined : onConnect}
                isValidConnection={isValidConnection}
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

