import { memo } from 'react';
import type { AgentNodeData } from '../../../models/types';
import { GEMINI_MODELS } from '../../../models/types';

interface AgentNodeFormProps {
    data: AgentNodeData;
    onChange: (data: Partial<AgentNodeData>) => void;
}

export const AgentNodeForm = memo(({ data, onChange }: AgentNodeFormProps) => {
    return (
        <>
            <div className="form-group">
                <label>Model</label>
                <select
                    value={data.model}
                    onChange={(e) => onChange({ model: e.target.value as any })}
                >
                    {GEMINI_MODELS.map((model) => (
                        <option key={model} value={model}>
                            {model}
                        </option>
                    ))}
                </select>
            </div>

            <div className="form-group">
                <label>Temperature: {data.temperature}</label>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={data.temperature}
                    onChange={(e) => onChange({ temperature: parseFloat(e.target.value) })}
                />
                <div className="help-text">
                    Controls randomness: 0 is deterministic, 1 is creative.
                </div>
            </div>

            <div className="form-group">
                <label>System Prompt</label>
                <textarea
                    rows={6}
                    value={data.systemPrompt}
                    onChange={(e) => onChange({ systemPrompt: e.target.value })}
                    placeholder="You are a helpful assistant..."
                    className="code-input"
                />
            </div>
        </>
    );
});
