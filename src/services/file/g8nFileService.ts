// G8N File Service - JSON file operations

import type { G8nWorkflow } from '../../models/types';
import { G8N_SCHEMA_URL, G8N_VERSION, createG8nError } from '../../models/types';

// ============================================
// Service Interface
// ============================================

export interface FileSaveOptions {
    prettify?: boolean;
}

export const g8nFileService = {
    /**
     * Validate workflow JSON structure
     */
    validate(data: unknown): data is G8nWorkflow {
        if (typeof data !== 'object' || data === null) {
            throw createG8nError('WORKFLOW_INVALID', 'Invalid JSON data');
        }

        const workflow = data as any;

        // Check required fields
        if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
            throw createG8nError('WORKFLOW_INVALID', 'Missing or invalid "nodes" array');
        }

        if (!workflow.edges || !Array.isArray(workflow.edges)) {
            throw createG8nError('WORKFLOW_INVALID', 'Missing or invalid "edges" array');
        }

        // Version check (simplified for now)
        if (workflow.version && workflow.version !== G8N_VERSION) {
            console.warn(`Version mismatch: file is ${workflow.version}, app is ${G8N_VERSION}`);
            // In future: migrateWorkflow(workflow)
        }

        return true;
    },

    /**
     * Save workflow to file (download)
     */
    saveToFile(workflow: G8nWorkflow, filename: string = 'workflow.g8n.json'): void {
        const jsonStr = JSON.stringify(workflow, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Load workflow from file
     */
    async loadFromFile(file: File): Promise<G8nWorkflow> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const data = JSON.parse(content);

                    if (this.validate(data)) {
                        resolve(data);
                    } else {
                        reject(createG8nError('WORKFLOW_INVALID', 'Validation failed'));
                    }
                } catch (error: any) {
                    reject(createG8nError('WORKFLOW_PARSE_ERROR', error.message));
                }
            };

            reader.onerror = () => {
                reject(createG8nError('WORKFLOW_INVALID', 'Failed to read file'));
            };

            reader.readAsText(file);
        });
    }
};
