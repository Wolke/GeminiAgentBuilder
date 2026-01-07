// GAS Deploy Service - Google Apps Script API integration for automatic deployment

import type { AppsScriptProject, AppsScriptFile, AppsScriptDeployment, GasProject } from '../types/gas';
import type { Workflow } from '../types/nodes';

// GAS file contents (will be bundled from src/gas/)
import CodeJs from '../gas/Code.js?raw';
import RouterJs from '../gas/Router.js?raw';
import EngineJs from '../gas/Engine.js?raw';
import AppsScriptJson from '../gas/appsscript.json?raw';

const APPS_SCRIPT_API_BASE = 'https://script.googleapis.com/v1';

/**
 * GAS Deploy Service
 * Handles project creation and deployment via Apps Script API
 */
export const gasDeployService = {
    /**
     * Get the GAS files to deploy
     */
    getGasFiles(): AppsScriptFile[] {
        return [
            { name: 'Code', type: 'SERVER_JS', source: CodeJs },
            { name: 'Router', type: 'SERVER_JS', source: RouterJs },
            { name: 'Engine', type: 'SERVER_JS', source: EngineJs },
            { name: 'appsscript', type: 'JSON', source: AppsScriptJson },
        ];
    },

    /**
     * Create a new Apps Script project
     */
    async createProject(
        title: string,
        accessToken: string
    ): Promise<AppsScriptProject> {
        const response = await fetch(`${APPS_SCRIPT_API_BASE}/projects`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ title }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create project');
        }

        const data = await response.json();
        return {
            scriptId: data.scriptId,
            title: data.title,
        };
    },

    /**
     * Update project content (push files)
     */
    async pushFiles(
        scriptId: string,
        files: AppsScriptFile[],
        accessToken: string
    ): Promise<void> {
        const response = await fetch(
            `${APPS_SCRIPT_API_BASE}/projects/${scriptId}/content`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    files: files.map(f => ({
                        name: f.name,
                        type: f.type,
                        source: f.source,
                    })),
                }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to push files');
        }
    },

    /**
     * Create a new version
     */
    async createVersion(
        scriptId: string,
        description: string,
        accessToken: string
    ): Promise<number> {
        const response = await fetch(
            `${APPS_SCRIPT_API_BASE}/projects/${scriptId}/versions`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ description }),
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to create version');
        }

        const data = await response.json();
        return data.versionNumber;
    },

    /**
     * Create or update Web App deployment
     */
    async deployWebApp(
        scriptId: string,
        versionNumber: number,
        accessToken: string,
        existingDeploymentId?: string
    ): Promise<AppsScriptDeployment> {
        const deploymentConfig = {
            versionNumber,
            manifestFileName: 'appsscript',
            description: `G8N Deployment v${versionNumber}`,
        };

        let response: Response;

        if (existingDeploymentId) {
            // Update existing deployment
            response = await fetch(
                `${APPS_SCRIPT_API_BASE}/projects/${scriptId}/deployments/${existingDeploymentId}`,
                {
                    method: 'PUT',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ deploymentConfig }),
                }
            );
        } else {
            // Create new deployment
            response = await fetch(
                `${APPS_SCRIPT_API_BASE}/projects/${scriptId}/deployments`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ deploymentConfig }),
                }
            );
        }

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to deploy');
        }

        const data = await response.json();
        return {
            deploymentId: data.deploymentId,
            version: versionNumber,
            webAppUrl: data.entryPoints?.find((e: { entryPointType: string }) =>
                e.entryPointType === 'WEB_APP'
            )?.webApp?.url || '',
        };
    },

    /**
     * Full deployment flow: create project, push files, deploy
     */
    async fullDeploy(
        projectTitle: string,
        accessToken: string,
        existingScriptId?: string
    ): Promise<{
        project: AppsScriptProject;
        deployment: AppsScriptDeployment;
    }> {
        let scriptId = existingScriptId;
        let project: AppsScriptProject;

        // Step 1: Create or use existing project
        if (!scriptId) {
            project = await this.createProject(projectTitle, accessToken);
            scriptId = project.scriptId;
        } else {
            project = { scriptId, title: projectTitle };
        }

        // Step 2: Push files
        const files = this.getGasFiles();
        await this.pushFiles(scriptId, files, accessToken);

        // Step 3: Create version
        const versionNumber = await this.createVersion(
            scriptId,
            `Deployed from Gemini Agent Builder at ${new Date().toISOString()}`,
            accessToken
        );

        // Step 4: Deploy as Web App
        const deployment = await this.deployWebApp(
            scriptId,
            versionNumber,
            accessToken
        );

        return { project, deployment };
    },

    /**
     * Get list of existing deployments
     */
    async listDeployments(
        scriptId: string,
        accessToken: string
    ): Promise<AppsScriptDeployment[]> {
        const response = await fetch(
            `${APPS_SCRIPT_API_BASE}/projects/${scriptId}/deployments`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to list deployments');
        }

        const data = await response.json();
        return (data.deployments || []).map((d: {
            deploymentId: string;
            deploymentConfig?: { versionNumber?: number };
            entryPoints?: Array<{ entryPointType: string; webApp?: { url: string } }>;
        }) => ({
            deploymentId: d.deploymentId,
            version: d.deploymentConfig?.versionNumber || 0,
            webAppUrl: d.entryPoints?.find(e => e.entryPointType === 'WEB_APP')?.webApp?.url || '',
        }));
    },

    // ============================================
    // G8N Project Management
    // ============================================

    /**
     * List all user's Apps Script projects (requires Drive API)
     * Filter by G8N- prefix
     */
    async listG8nProjects(accessToken: string): Promise<GasProject[]> {
        // Use Drive API to list Apps Script files
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.script' and name contains 'G8N-' and trashed=false&fields=files(id,name,createdTime,modifiedTime)`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to list projects');
        }

        const data = await response.json();
        return (data.files || []).map((f: {
            id: string;
            name: string;
            createdTime?: string;
            modifiedTime?: string;
        }) => ({
            scriptId: f.id,
            title: f.name,
            createTime: f.createdTime,
            updateTime: f.modifiedTime,
        }));
    },

    /**
     * Get project content (all files)
     */
    async getProjectContent(
        scriptId: string,
        accessToken: string
    ): Promise<AppsScriptFile[]> {
        const response = await fetch(
            `${APPS_SCRIPT_API_BASE}/projects/${scriptId}/content`,
            {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to get project content');
        }

        const data = await response.json();
        return (data.files || []).map((f: { name: string; type: string; source: string }) => ({
            name: f.name,
            type: f.type as 'SERVER_JS' | 'JSON',
            source: f.source,
        }));
    },

    /**
     * Get workflow from a G8N project
     * Reads WorkflowData.gs and extracts WORKFLOW_DATA
     */
    async getWorkflowFromProject(
        scriptId: string,
        accessToken: string
    ): Promise<Workflow | null> {
        const files = await this.getProjectContent(scriptId, accessToken);
        const workflowFile = files.find(f => f.name === 'WorkflowData');

        if (!workflowFile) {
            return null;
        }

        // Extract JSON from: const WORKFLOW_DATA = {...};
        const match = workflowFile.source.match(/const\s+WORKFLOW_DATA\s*=\s*(\{[\s\S]*\});/);
        if (!match) {
            return null;
        }

        try {
            return JSON.parse(match[1]) as Workflow;
        } catch {
            console.error('Failed to parse workflow data');
            return null;
        }
    },

    /**
     * Generate WorkflowData.gs content
     */
    generateWorkflowDataFile(workflow: Workflow): string {
        const json = JSON.stringify(workflow, null, 2);
        return `/**
 * G8N Workflow Data
 * Generated by Gemini Agent Builder
 * Updated: ${new Date().toISOString()}
 */
const WORKFLOW_DATA = ${json};

function getWorkflow() {
    return WORKFLOW_DATA;
}
`;
    },

    /**
     * Save workflow to an existing G8N project
     */
    async saveWorkflowToProject(
        scriptId: string,
        workflow: Workflow,
        accessToken: string
    ): Promise<void> {
        // Get existing files
        const existingFiles = await this.getProjectContent(scriptId, accessToken);

        // Replace or add WorkflowData.gs
        const workflowDataContent = this.generateWorkflowDataFile(workflow);
        const workflowDataFile: AppsScriptFile = {
            name: 'WorkflowData',
            type: 'SERVER_JS',
            source: workflowDataContent,
        };

        const filesWithoutWorkflow = existingFiles.filter(f => f.name !== 'WorkflowData');
        const newFiles = [...filesWithoutWorkflow, workflowDataFile];

        await this.pushFiles(scriptId, newFiles, accessToken);
    },

    /**
     * Create a new G8N project with workflow
     */
    async createG8nProject(
        name: string,
        workflow: Workflow,
        accessToken: string
    ): Promise<GasProject> {
        // Ensure G8N- prefix
        const projectName = name.startsWith('G8N-') ? name : `G8N-${name}`;

        // Create project
        const project = await this.createProject(projectName, accessToken);

        // Get default GAS files and add WorkflowData
        const gasFiles = this.getGasFiles();
        const workflowDataFile: AppsScriptFile = {
            name: 'WorkflowData',
            type: 'SERVER_JS',
            source: this.generateWorkflowDataFile(workflow),
        };

        await this.pushFiles(project.scriptId, [...gasFiles, workflowDataFile], accessToken);

        return {
            scriptId: project.scriptId,
            title: projectName,
            createTime: new Date().toISOString(),
            updateTime: new Date().toISOString(),
        };
    },

    /**
     * Delete a GAS project (move to trash via Drive API)
     */
    async deleteProject(
        scriptId: string,
        accessToken: string
    ): Promise<void> {
        const response = await fetch(
            `https://www.googleapis.com/drive/v3/files/${scriptId}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                },
            }
        );

        if (!response.ok && response.status !== 204) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Failed to delete project');
        }
    },
};
