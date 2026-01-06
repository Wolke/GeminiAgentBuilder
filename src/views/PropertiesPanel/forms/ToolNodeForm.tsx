import { memo } from 'react';
import { GEMINI_BUILTIN_TOOLS, GAS_TOOLS } from '../../../models/types';
import type { ToolNodeData, ToolType, ToolConfig } from '../../../models/types';

interface ToolNodeFormProps {
    data: ToolNodeData;
    onChange: (data: Partial<ToolNodeData>) => void;
}

export const ToolNodeForm = memo(({ data, onChange }: ToolNodeFormProps) => {
    const currentToolType = data.toolType || 'google_search';

    const handleConfigChange = (key: keyof ToolConfig, value: any) => {
        onChange({
            config: {
                ...data.config,
                [key]: value,
            },
        });
    };

    return (
        <>
            <div className="form-group">
                <label>Tool Type</label>
                <select
                    value={currentToolType}
                    onChange={(e) => onChange({ toolType: e.target.value as ToolType })}
                >
                    <optgroup label="Gemini Built-in">
                        {GEMINI_BUILTIN_TOOLS.map((t) => (
                            <option key={t} value={t}>
                                {t.replace('_', ' ').toUpperCase()}
                            </option>
                        ))}
                    </optgroup>
                    <optgroup label="Google Apps Script (GAS)">
                        {GAS_TOOLS.map((t) => (
                            <option key={t} value={t}>
                                {t.toUpperCase()}
                            </option>
                        ))}
                    </optgroup>
                </select>
            </div>

            <fieldset className="form-section">
                <legend>Configuration</legend>

                {/* Dynamic fields based on tool type */}
                {currentToolType === 'sheets' && (
                    <>
                        <div className="form-group">
                            <label>Spreadsheet ID</label>
                            <input
                                type="text"
                                placeholder="1BxiMVs0XRA5nFMdKbBdB..."
                                value={data.config?.spreadsheetId || ''}
                                onChange={(e) => handleConfigChange('spreadsheetId', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Sheet Name</label>
                            <input
                                type="text"
                                placeholder="Sheet1"
                                value={data.config?.sheetName || ''}
                                onChange={(e) => handleConfigChange('sheetName', e.target.value)}
                            />
                        </div>
                    </>
                )}

                {currentToolType === 'gmail' && (
                    <>
                        <div className="form-group">
                            <label>Recipient (To)</label>
                            <input
                                type="text"
                                placeholder="email@example.com"
                                value={data.config?.to || ''}
                                onChange={(e) => handleConfigChange('to', e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Subject</label>
                            <input
                                type="text"
                                placeholder="Subject line"
                                value={data.config?.subject || ''}
                                onChange={(e) => handleConfigChange('subject', e.target.value)}
                            />
                        </div>
                    </>
                )}

                {/* Fallback for other tools */}
                {!['sheets', 'gmail'].includes(currentToolType) && (
                    <div className="form-group">
                        <p className="help-text">
                            No specific configuration needed for <strong>{currentToolType}</strong> yet.
                        </p>
                    </div>
                )}
            </fieldset>
        </>
    );
});
