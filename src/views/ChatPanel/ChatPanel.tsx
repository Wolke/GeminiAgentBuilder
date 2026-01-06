// G8N Views - ChatPanel Component (Placeholder)

import { useState } from 'react';
import { useG8nStore } from '../../models/store';
import type { ChatMessage } from '../../models/store';
import './ChatPanel.css';

export function ChatPanel() {
    const [input, setInput] = useState('');
    const chatMessages = useG8nStore((state) => state.ui.chatMessages);
    const addChatMessage = useG8nStore((state) => state.addChatMessage);
    const settings = useG8nStore((state) => state.settings);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim()) return;

        // Add user message
        addChatMessage({ role: 'user', content: input });
        setInput('');

        // TODO: Implement workflow execution
        addChatMessage({
            role: 'assistant',
            content: '🚧 Workflow execution not yet implemented. Coming soon!'
        });
    };

    return (
        <div className="g8n-chat-panel">
            <div className="chat-header">
                <h3>Run Workflow</h3>
            </div>

            <div className="chat-messages">
                {!settings.geminiApiKey && (
                    <div className="chat-warning">
                        ⚠️ Please set your Gemini API key in settings
                    </div>
                )}

                {chatMessages.length === 0 ? (
                    <div className="chat-empty">
                        <p>Send a message to run the workflow</p>
                    </div>
                ) : (
                    chatMessages.map((msg: ChatMessage) => (
                        <div key={msg.id} className={`chat-message ${msg.role}`}>
                            <div className="message-content">{msg.content}</div>
                        </div>
                    ))
                )}
            </div>

            <form className="chat-input-form" onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Type your message..."
                    disabled={!settings.geminiApiKey}
                />
                <button type="submit" disabled={!settings.geminiApiKey || !input.trim()}>
                    Send
                </button>
            </form>
        </div>
    );
}

