// G8N Views - Toolbar Component (Placeholder)

import { useState } from 'react';
import { useG8nStore } from '../../models/store';
import type { NodeType, StartNodeData, AgentNodeData, OutputNodeData } from '../../models/types';
import { ImportN8nDialog } from '../Dialogs';
import './Toolbar.css';

const NODE_PALETTE: { type: NodeType; label: string; icon: string }[] = [
    { type: 'start', label: 'Start', icon: '🟢' },
    { type: 'agent', label: 'Agent', icon: '🤖' },
    { type: 'tool', label: 'Tool', icon: '🔧' },
    { type: 'condition', label: 'Condition', icon: '❓' },
    { type: 'memory', label: 'Memory', icon: '🧠' },
    { type: 'output', label: 'Output', icon: '📤' },
];

export function Toolbar() {
    const addNode = useG8nStore((state) => state.addNode);
    const [isImportDialogOpen, setImportDialogOpen] = useState(false);

    const handleAddNode = (type: NodeType) => {
        const position = {
            x: 100 + Math.random() * 200,
            y: 100 + Math.random() * 200,
        };

        const baseData = { label: type.charAt(0).toUpperCase() + type.slice(1) };

        let data: any;
        switch (type) {
            case 'start':
                data = { ...baseData, triggerType: 'manual', inputVariables: [] } as StartNodeData;
                break;
            case 'agent':
                data = { ...baseData, model: 'gemini-2.5-flash', systemPrompt: '', temperature: 0.7 } as AgentNodeData;
                break;
            case 'output':
                data = { ...baseData, outputFormat: 'text' } as OutputNodeData;
                break;
            default:
                data = baseData;
        }

        addNode({
            id: `${type}_${Date.now()}`,
            type,
            position,
            data,
        });
    };

    return (
        <>
            <div className="g8n-toolbar">
                <div className="toolbar-header">
                    <h3>Nodes</h3>
                </div>
                <div className="toolbar-content">
                    {NODE_PALETTE.map((item) => (
                        <button
                            key={item.type}
                            className="node-btn"
                            onClick={() => handleAddNode(item.type)}
                        >
                            <span className="node-icon">{item.icon}</span>
                            <span className="node-label">{item.label}</span>
                        </button>
                    ))}
                </div>

                <div className="toolbar-divider" />

                <div className="toolbar-section">
                    <h4>Import</h4>
                    <button className="action-btn" onClick={() => setImportDialogOpen(true)}>
                        <span className="action-icon">📥</span>
                        <span>Import n8n</span>
                    </button>
                </div>
            </div>

            <ImportN8nDialog
                isOpen={isImportDialogOpen}
                onClose={() => setImportDialogOpen(false)}
            />
        </>
    );
}

