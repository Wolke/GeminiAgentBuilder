// G8N GAS Bridge - HTTP client for GAS Web App

import { createG8nError } from '../../models/types';
import type { GasConfig } from '../../models/types';

// ============================================
// Types
// ============================================

export interface GasResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    debugLog?: any[];
}

export interface GasPayload {
    token: string;
    action: string;
    payload?: any;
}

// ============================================
// Service
// ============================================

export const gasBridge = {
    /**
     * Universal fetch wrapper for GAS
     */
    async call<T = any>(
        action: string,
        payload: any,
        config: GasConfig
    ): Promise<T> {
        if (!config.webAppUrl) {
            throw createG8nError('GAS_NOT_CONFIGURED', 'GAS Web App URL not configured');
        }

        if (!config.apiToken) {
            throw createG8nError('GAS_AUTH_FAILED', 'GAS API Token not configured');
        }

        try {
            const body: GasPayload = {
                token: config.apiToken,
                action,
                payload,
            };

            // Use fetch with 'no-cors' mode possibility? 
            // Note: POST requires CORS support from GAS. 
            // GAS `ContentService.createTextOutput().setMimeType(ContentService.MimeType.JSON)` handles CORS usually.

            const response = await fetch(config.webAppUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain;charset=utf-8', // Plain text prevents preflight OPTIONS
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                throw createG8nError('GAS_UNREACHABLE', `HTTP Error: ${response.status}`);
            }

            const result: GasResponse<T> = await response.json();

            if (!result.success) {
                throw createG8nError('GAS_EXECUTION_FAILED' as any, result.error || 'Unknown GAS error');
            }

            return result.data as T;
        } catch (error: any) {
            console.error('GAS Bridge Error:', error);

            if (error.code) throw error; // Rethrow G8N errors

            throw createG8nError('GAS_UNREACHABLE', error.message || 'Network error connecting to GAS');
        }
    },

    /**
     * Ping GAS to verify connection
     */
    async ping(config: GasConfig): Promise<boolean> {
        try {
            const data = await this.call('ping', {}, config);
            return data === 'pong';
        } catch {
            return false;
        }
    },

    /**
     * Sync workflow to GAS
     */
    async syncWorkflow(workflow: any, config: GasConfig): Promise<boolean> {
        const data = await this.call('system.sync_workflow', { workflow }, config);
        return !!data;
    },

    /**
     * Convert CURL command for testing
     */
    generateCurlCommand(action: string, payload: any, config: GasConfig): string {
        if (!config.webAppUrl || !config.apiToken) return 'Missing GAS configuration';

        const body: GasPayload = {
            token: config.apiToken,
            action,
            payload,
        };

        return `curl -L -X POST '${config.webAppUrl}' \\
-H 'Content-Type: text/plain;charset=utf-8' \\
-d '${JSON.stringify(body)}'`;
    }
};
