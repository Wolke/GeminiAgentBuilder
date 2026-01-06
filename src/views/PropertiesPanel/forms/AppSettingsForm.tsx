import { memo } from 'react';
import type { AppSettings } from '../../../models/store/slices/settingsSlice';

interface AppSettingsFormProps {
    settings: AppSettings;
    onUpdate: (settings: Partial<AppSettings>) => void;
}

export const AppSettingsForm = memo(({ settings, onUpdate }: AppSettingsFormProps) => {
    return (
        <div className="panel-content">
            <div className="form-group">
                <label>Gemini API Key</label>
                <input
                    type="password"
                    value={settings.geminiApiKey || ''}
                    placeholder="AIzaSy..."
                    onChange={(e) => onUpdate({ geminiApiKey: e.target.value })}
                />
                <p className="help-text">
                    Required for Agent nodes. Key is stored locally in your browser.
                </p>
            </div>

            <div className="form-group">
                <label>Default Model</label>
                <select
                    value={settings.defaultModel}
                    onChange={(e) => onUpdate({ defaultModel: e.target.value })}
                >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                </select>
            </div>

            <div className="form-group">
                <label>Debug Mode</label>
                <div className="checkbox-wrapper">
                    <input
                        type="checkbox"
                        checked={settings.debugMode}
                        onChange={(e) => onUpdate({ debugMode: e.target.checked })}
                    />
                    <span>Enable Debug Mode</span>
                </div>
            </div>
        </div>
    );
});
