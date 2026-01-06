// G8N Controllers - useFileOperations Hook
// Handles file save/load operations for G8N workflows

import { useCallback, useRef } from 'react';
import { useG8nStore } from '../models/store';
import { g8nFileService } from '../services/file';
import type { G8nWorkflow } from '../models/types';

export function useFileOperations() {
    const exportWorkflow = useG8nStore((state) => state.exportWorkflow);
    const setWorkflow = useG8nStore((state) => state.setWorkflow);
    const workflowName = useG8nStore((state) => state.workflowName);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    // Save workflow to file
    const saveWorkflow = useCallback(async () => {
        const workflow = exportWorkflow();
        const filename = `${workflow.name.replace(/\s+/g, '_')}.g8n.json`;

        try {
            g8nFileService.saveToFile(workflow, filename);
            return { success: true };
        } catch (error) {
            console.error('Failed to save workflow:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [exportWorkflow]);

    // Load workflow from file (via file input)
    const loadWorkflow = useCallback(async (file: File) => {
        try {
            const workflow = await g8nFileService.loadFromFile(file);
            setWorkflow(workflow);
            return { success: true, workflow };
        } catch (error) {
            console.error('Failed to load workflow:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }, [setWorkflow]);

    // Trigger file input dialog
    const openFileDialog = useCallback(() => {
        if (!fileInputRef.current) {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json,.g8n.json';
            input.onchange = async (e) => {
                const file = (e.target as HTMLInputElement).files?.[0];
                if (file) {
                    await loadWorkflow(file);
                }
            };
            fileInputRef.current = input;
        }
        fileInputRef.current.click();
    }, [loadWorkflow]);

    // Export workflow as JSON string
    const exportAsJson = useCallback(() => {
        const workflow = exportWorkflow();
        return JSON.stringify(workflow, null, 2);
    }, [exportWorkflow]);

    // Import from JSON string
    const importFromJson = useCallback((jsonString: string) => {
        try {
            const workflow: G8nWorkflow = JSON.parse(jsonString);
            // Basic validation
            if (!workflow.nodes || !workflow.edges) {
                throw new Error('Invalid workflow format');
            }
            setWorkflow(workflow);
            return { success: true };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Invalid JSON'
            };
        }
    }, [setWorkflow]);

    // Create new workflow
    const newWorkflow = useCallback(() => {
        useG8nStore.getState().resetWorkflow();
    }, []);

    return {
        workflowName,
        saveWorkflow,
        loadWorkflow,
        openFileDialog,
        exportAsJson,
        importFromJson,
        newWorkflow,
    };
}
