import { memo } from 'react';
import type { OutputNodeData } from '../../../models/types';

interface OutputNodeFormProps {
    data: OutputNodeData;
    onChange: (data: Partial<OutputNodeData>) => void;
}

export const OutputNodeForm = memo(({ data, onChange }: OutputNodeFormProps) => {
    return (
        <div className="form-group">
            <label>Output Format</label>
            <select
                value={data.outputFormat}
                onChange={(e) => onChange({ outputFormat: e.target.value as any })}
            >
                <option value="text">Text</option>
                <option value="markdown">Markdown</option>
                <option value="json">JSON</option>
            </select>
        </div>
    );
});
