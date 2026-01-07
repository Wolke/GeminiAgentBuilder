// GAS Deploy Service - Google Apps Script API integration for automatic deployment

import type { AppsScriptProject, AppsScriptFile, AppsScriptDeployment } from '../types/gas';

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
};
