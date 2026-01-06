import { memo } from 'react';
import type { StartNodeData, TriggerType } from '../../../models/types';

interface StartNodeFormProps {
    data: StartNodeData;
    onChange: (data: Partial<StartNodeData>) => void;
}

const TRIGGER_TYPES: TriggerType[] = ['manual', 'webhook', 'cronjob'];

export const StartNodeForm = memo(({ data, onChange }: StartNodeFormProps) => {
    return (
        <>
            <div className="form-group">
                <label>Trigger Type</label>
                <select
                    value={data.triggerType}
                    onChange={(e) => onChange({ triggerType: e.target.value as TriggerType })}
                >
                    {TRIGGER_TYPES.map((t) => (
                        <option key={t} value={t}>
                            {t.toUpperCase()}
                        </option>
                    ))}
                </select>
            </div>

            {data.triggerType === 'cronjob' && (
                <fieldset className="form-section">
                    <legend>Schedule</legend>
                    <div className="form-group">
                        <label>Cron Expression</label>
                        <input
                            type="text"
                            value={data.cronjobConfig?.schedule || ''}
                            placeholder="0 9 * * *"
                            onChange={(e) =>
                                onChange({
                                    cronjobConfig: {
                                        schedule: e.target.value,
                                        timezone: data.cronjobConfig?.timezone || 'UTC',
                                        enabled: data.cronjobConfig?.enabled ?? true,
                                    },
                                })
                            }
                        />
                    </div>
                </fieldset>
            )}

            {data.triggerType === 'webhook' && (
                <fieldset className="form-section">
                    <legend>Webhook Configuration</legend>
                    <div className="form-group">
                        <label>Method</label>
                        <select
                            value={data.webhookConfig?.method || 'POST'}
                            onChange={(e) =>
                                onChange({
                                    webhookConfig: {
                                        path: data.webhookConfig?.path || '',
                                        method: e.target.value as 'GET' | 'POST',
                                    },
                                })
                            }
                        >
                            <option value="GET">GET</option>
                            <option value="POST">POST</option>
                        </select>
                    </div>
                </fieldset>
            )}
        </>
    );
});
