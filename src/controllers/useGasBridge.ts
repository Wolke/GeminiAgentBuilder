// G8N Controllers - useGasBridge Hook
// Handles GAS synchronization and tool execution

import { useCallback, useState } from 'react';
import { useG8nStore } from '../models/store';
import { gasBridge } from '../services/gas';

export interface GasBridgeStatus {
    isConnected: boolean;
    isSyncing: boolean;
    lastError: string | null;
}

export function useGasBridge() {
    const gasConfig = useG8nStore((state) => state.gasConfig);
    const updateGasConfig = useG8nStore((state) => state.updateGasConfig);
    const exportWorkflow = useG8nStore((state) => state.exportWorkflow);

    const [status, setStatus] = useState<GasBridgeStatus>({
        isConnected: false,
        isSyncing: false,
        lastError: null,
    });

    // Configure Web App URL
    const setWebAppUrl = useCallback((url: string) => {
        updateGasConfig({ webAppUrl: url });
        setStatus((prev) => ({ ...prev, isConnected: false, lastError: null }));
    }, [updateGasConfig]);

    // Test connection to GAS
    const testConnection = useCallback(async () => {
        if (!gasConfig.webAppUrl) {
            setStatus((prev) => ({ ...prev, lastError: 'Web App URL not configured' }));
            return false;
        }

        try {
            const result = await gasBridge.ping(gasConfig);
            setStatus({
                isConnected: result,
                isSyncing: false,
                lastError: result ? null : 'Connection failed',
            });
            return result;
        } catch (error) {
            setStatus({
                isConnected: false,
                isSyncing: false,
                lastError: error instanceof Error ? error.message : 'Connection failed',
            });
            return false;
        }
    }, [gasConfig]);

    // Sync workflow to GAS
    const syncWorkflow = useCallback(async () => {
        if (!gasConfig.webAppUrl) {
            return { success: false, error: 'Web App URL not configured' };
        }

        setStatus((prev) => ({ ...prev, isSyncing: true, lastError: null }));

        try {
            const workflow = exportWorkflow();
            const result = await gasBridge.syncWorkflow(workflow, gasConfig);

            if (result) {
                updateGasConfig({
                    syncStatus: 'synced',
                    lastSyncAt: new Date().toISOString(),
                });
            } else {
                updateGasConfig({ syncStatus: 'error' });
            }

            setStatus({
                isConnected: true,
                isSyncing: false,
                lastError: result ? null : 'Sync failed',
            });

            return { success: result };
        } catch (error) {
            updateGasConfig({ syncStatus: 'error' });
            setStatus({
                isConnected: false,
                isSyncing: false,
                lastError: error instanceof Error ? error.message : 'Sync failed',
            });
            return { success: false, error: 'Sync failed' };
        }
    }, [gasConfig, exportWorkflow, updateGasConfig]);

    // Execute a tool via GAS
    const executeTool = useCallback(async (toolType: string, params: Record<string, unknown>) => {
        if (!gasConfig.webAppUrl) {
            return { success: false, error: 'Web App URL not configured' };
        }

        try {
            const result = await gasBridge.call(toolType, params, gasConfig);
            return { success: true, data: result };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Tool execution failed'
            };
        }
    }, [gasConfig]);

    return {
        // Config
        gasConfig,
        setWebAppUrl,

        // Status
        status,

        // Actions
        testConnection,
        syncWorkflow,
        executeTool,
    };
}
