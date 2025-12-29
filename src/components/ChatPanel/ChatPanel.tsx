// Chat Panel - Conversation interface for Run mode

import { useState } from 'react';
import { useWorkflowStore } from '../../stores';
import { WorkflowEngine } from '../../services';
import './ChatPanel.css';

export function ChatPanel() {
    const { chatMessages, addChatMessage, clearChatMessages, execution, settings, resetExecution } = useWorkflowStore();
    const [input, setInput] = useState('');

    const isRunning = execution.status === 'running';

    const handleSend = async () => {
        if (!input.trim() || isRunning) return;

        // Add user message
        addChatMessage({ role: 'user', content: input.trim() });
        setInput('');

        // Run workflow with user input
        try {
            const result = await WorkflowEngine.run(input.trim());

            // Add assistant response
            if (result) {
                // Check if it's an error response
                if (typeof result === 'object' && result.error === true) {
                    addChatMessage({ role: 'assistant', content: result.message || '❌ 執行失敗' });
                } else {
                    const responseText = typeof result === 'string'
                        ? result
                        : typeof result === 'object' && 'text' in result
                            ? result.text
                            : JSON.stringify(result, null, 2);
                    addChatMessage({ role: 'assistant', content: responseText });
                }
            } else {
                addChatMessage({ role: 'assistant', content: '❌ Workflow 沒有回傳結果' });
            }
        } catch (error: any) {
            addChatMessage({ role: 'assistant', content: `❌ 發生未預期的錯誤: ${error?.message || '未知錯誤'}` });
        }
    };

    const handleReset = () => {
        clearChatMessages();
        resetExecution();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-panel">
            <div className="chat-header">
                <h3>💬 Chat</h3>
                <div className="chat-header-actions">
                    {chatMessages.length > 0 && (
                        <button className="chat-reset-btn" onClick={handleReset} title="New Chat">
                            🔄
                        </button>
                    )}
                    {!settings.geminiApiKey && (
                        <span className="api-warning">⚠️ API Key missing</span>
                    )}
                </div>
            </div>

            <div className="chat-messages">
                {chatMessages.length === 0 ? (
                    <div className="chat-empty">
                        <span className="chat-empty-icon">🚀</span>
                        <p>Send a message to run your workflow</p>
                    </div>
                ) : (
                    chatMessages.map((msg) => (
                        <div key={msg.id} className={`chat-message ${msg.role}`}>
                            <div className="message-avatar">
                                {msg.role === 'user' ? '👤' : '🤖'}
                            </div>
                            <div className="message-content">
                                <pre>{msg.content}</pre>
                            </div>
                        </div>
                    ))
                )}
                {isRunning && (
                    <div className="chat-message assistant">
                        <div className="message-avatar">🤖</div>
                        <div className="message-content typing">
                            <span className="dot"></span>
                            <span className="dot"></span>
                            <span className="dot"></span>
                        </div>
                    </div>
                )}
            </div>

            <div className="chat-input-container">
                <textarea
                    className="chat-input"
                    placeholder="Type your message..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isRunning}
                    rows={2}
                />
                <button
                    className="chat-send-btn"
                    onClick={handleSend}
                    disabled={isRunning || !input.trim()}
                >
                    {isRunning ? '⏳' : '➤'}
                </button>
            </div>
        </div>
    );
}
