// GAS Tool Executor - Dual-mode execution for GAS native tools
// Local: HTTP call to GAS Web App
// GAS: Direct call to Engine.executeTool (handled by WorkflowRunner.js)

import { gasService } from './gasService';
import type { GasNativeTool, ToolConfig } from '../types/nodes';

// Simplified config for GAS tool execution (subset of full GasConfig)
export interface GasToolCallConfig {
    webAppUrl: string;
    apiToken?: string;
}

export interface GasToolExecutorResult {
    success: boolean;
    data?: unknown;
    error?: string;
}

export const gasToolExecutor = {
    /**
     * Execute a GAS native tool
     * In browser: calls GAS Web App via HTTP
     * In GAS: would call Engine.executeTool directly (handled by WorkflowRunner.js)
     */
    async execute(
        toolType: GasNativeTool,
        config: ToolConfig & { action?: string;[key: string]: unknown },
        gasConfig: GasToolCallConfig
    ): Promise<unknown> {
        if (!gasConfig.webAppUrl) {
            throw new Error(
                'GAS Web App URL not configured. Please deploy your project first to test GAS native tools locally.'
            );
        }

        // Call GAS Web App via HTTP
        try {
            const result = await gasService.call('tool.execute', { toolType, config }, {
                webAppUrl: gasConfig.webAppUrl,
                apiToken: gasConfig.apiToken || null,
                projectId: null,
                syncStatus: 'synced',
                lastSyncAt: null,
            });
            return result;
        } catch (error) {
            console.error('[GasToolExecutor] Execution failed:', error);
            throw error;
        }
    },

    /**
     * Check if GAS native tools can be tested locally
     */
    canTestLocally(webAppUrl?: string): boolean {
        return !!webAppUrl;
    },

    /**
     * Get a human-readable description of the tool
     */
    getToolDescription(toolType: GasNativeTool): string {
        const descriptions: Record<GasNativeTool, string> = {
            gas_gmail: 'Send emails using GAS MailApp/GmailApp',
            gas_calendar: 'Manage calendar events using GAS CalendarApp',
            gas_sheets: 'Read/write spreadsheet data using GAS SpreadsheetApp',
            gas_drive: 'Manage files using GAS DriveApp',
        };
        return descriptions[toolType] || 'GAS native tool';
    },
};
