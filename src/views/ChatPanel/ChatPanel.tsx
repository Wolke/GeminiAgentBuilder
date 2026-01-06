// G8N Views - ChatPanel Component
// Provides workflow execution UI with chat interface

import { useState, useRef, useEffect } from 'react';
import { useG8nStore } from '../../models/store';
import { useExecution } from '../../controllers';
import type { ChatMessage } from '../../models/store';
import './ChatPanel.css';

export function ChatPanel() {
    const [input, setInput] = useState('');
    const chatMessages = useG8nStore((state) => state.ui.chatMessages);
    const addChatMessage = useG8nStore((state) => state.addChatMessage);
    const clearChatMessages = useG8nStore((state) => state.clearChatMessages);
    const settings = useG8nStore((state) => state.settings);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const { executionState, runWorkflow, stopExecution, resetExecution } = useExecution();

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatMessages]);

    // Handle execution completion
    useEffect(() => {
        if (executionState.status === 'completed' && executionState.output) {
            addChatMessage({
                role: 'assistant',
                content: executionState.output,
            });
        } else if (executionState.status === 'error' && executionState.error) {
            addChatMessage({
                role: 'system',
                content: `❌ Error: ${executionState.error}`,
            });
        }
    }, [executionState.status, executionState.output, executionState.error, addChatMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || executionState.status === 'running') return;

        const userMessage = input.trim();
        addChatMessage({ role: 'user', content: userMessage });
        setInput('');

        // Run workflow
        await runWorkflow(userMessage);
    };

    const handleClear = () => {
        clearChatMessages();
        resetExecution();
    };

    const isRunning = executionState.status === 'running';

    return (
        <div className="g8n-chat-panel">
            <div className="chat-header">
                <h3>Run Workflow</h3>
                <div className="header-actions">
                    {isRunning && (
                        <button className="btn-stop" onClick={stopExecution} title="Stop execution">
                            ⏹
                        </button>
                    )}
                    <button className="btn-clear" onClick={handleClear} title="Clear chat">
                        🗑
                    </button>
                </div>
            </div>

            {/* Execution Status Bar */}
            {isRunning && (
                <div className="execution-status">
                    <div className="status-indicator running" />
                    <span>Running: {executionState.executedNodes.length} nodes executed</span>
                </div>
            )}

            {/* Debug Info (when debug mode enabled) */}
            {settings.debugMode && executionState.currentNodeId && (
                <div className="debug-info">
                    <span className="debug-label">Current Node:</span>
                    <span className="debug-value">{executionState.currentNodeId}</span>
                </div>
            )}

            <div className="chat-messages">
                {!settings.geminiApiKey && (
                    <div className="chat-warning">
                        ⚠️ Please set your Gemini API key in Global Settings (click empty canvas)
                    </div>
                )}

                {chatMessages.length === 0 ? (
                    <div className="chat-empty">
                        <div className="empty-icon">💬</div>
                        <p>Send a message to run your workflow</p>
                        <p className="hint">Your input will be passed to the Start node</p>
                    </div>
                ) : (
                    chatMessages.map((msg: ChatMessage) => (
                        <div key={msg.id} className={`chat-message ${msg.role}`}>
                            <div className="message-role">
                                {msg.role === 'user' ? '👤' : msg.role === 'system' ? '⚙️' : '🤖'}
                            </div>
                            <div className="message-content">{msg.content}</div>
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder={isRunning ? 'Processing...' : 'Type your message...'}
                    disabled={!settings.geminiApiKey || isRunning}
                />
                <button
                    type="submit"
                    disabled={!settings.geminiApiKey || !input.trim() || isRunning}
                >
                    {isRunning ? '⏳' : '▶'}
                </button>
            </form>
        </div>
    );
}
