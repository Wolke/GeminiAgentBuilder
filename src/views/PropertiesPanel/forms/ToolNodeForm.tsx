import { memo } from 'react';
import { GEMINI_BUILTIN_TOOLS, GAS_TOOLS } from '../../../models/types';
import type { ToolNodeData, ToolType, ToolConfig, GasTool } from '../../../models/types';

interface ToolNodeFormProps {
    data: ToolNodeData;
    onChange: (data: Partial<ToolNodeData>) => void;
}

export const ToolNodeForm = memo(({ data, onChange }: ToolNodeFormProps) => {
    const currentToolType = data.toolType || 'google_search';
    const isGasTool = GAS_TOOLS.includes(currentToolType as GasTool);
    const useGas = data.useGas ?? isGasTool; // Default to true for GAS tools

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
                    onChange={(e) => {
                        const newType = e.target.value as ToolType;
                        const newIsGas = GAS_TOOLS.includes(newType as GasTool);
                        onChange({
                            toolType: newType,
                            useGas: newIsGas ? true : data.useGas
                        });
                    }}
                >
                    <optgroup label="Gemini Built-in (Local)">
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

            {/* Execution Mode Toggle */}
            <div className="form-group">
                <label>Execution Mode</label>
                <div className="toggle-group">
                    <label className="toggle-label">
                        <input
                            type="checkbox"
                            checked={useGas}
                            disabled={isGasTool}
                            onChange={(e) => onChange({ useGas: e.target.checked })}
                        />
                        <span>Use GAS Web App</span>
                    </label>
                </div>
                {isGasTool && (
                    <p className="help-text warning">
                        ⚠️ <strong>{currentToolType.toUpperCase()}</strong> requires GAS Web App.
                        Make sure workflow is synced.
                    </p>
                )}
                {!isGasTool && !useGas && (
                    <p className="help-text">
                        Tool will execute locally via Gemini API.
                    </p>
                )}
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
                            No specific configuration needed for <strong>{currentToolType}</strong>.
                        </p>
                    </div>
                )}
            </fieldset>
        </>
    );
});

