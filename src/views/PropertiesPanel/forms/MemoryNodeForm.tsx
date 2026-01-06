import { memo } from 'react';
import type { MemoryNodeData } from '../../../models/types';

interface MemoryNodeFormProps {
    data: MemoryNodeData;
    onChange: (data: Partial<MemoryNodeData>) => void;
}

export const MemoryNodeForm = memo(({ data, onChange }: MemoryNodeFormProps) => {
    return (
        <>
            <div className="form-group">
                <label>Storage Key</label>
                <input
                    type="text"
                    value={data.storageKey || ''}
                    placeholder="chat_history_1"
                    onChange={(e) => onChange({ storageKey: e.target.value })}
                />
                <div className="help-text">
                    Unique key to persist conversation history in localStorage.
                </div>
            </div>

            <div className="form-group">
                <label>Max Messages</label>
                <input
                    type="number"
                    min="1"
                    max="100"
                    value={data.maxMessages || 10}
                    onChange={(e) => onChange({ maxMessages: parseInt(e.target.value, 10) })}
                />
                <div className="help-text">
                    Maximum number of recent messages to retain context.
                </div>
            </div>
        </>
    );
});
