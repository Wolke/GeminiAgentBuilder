// G8N Services - GAS API Service
// Apps Script API client for project management

import { googleAuthService } from '../auth';
import {
  G8N_PROJECT_PREFIX,
  G8N_WORKFLOW_FILE_NAME,
  G8N_WORKFLOW_VAR_NAME,
  LEGACY_WORKFLOW_FILES
} from '../../constants';
import { CODE_JS } from './backend/code';
import { ROUTER_JS } from './backend/router';
import { ENGINE_JS } from './backend/engine';

const API_BASE = 'https://script.googleapis.com/v1';

export interface GasProject {
  scriptId: string;
  title: string;
  createTime?: string;
  updateTime?: string;
}

export interface GasFile {
  name: string;
  type: 'SERVER_JS' | 'HTML' | 'JSON';
  source: string;
}

export interface DeploymentInfo {
  deploymentId: string;
  version: string;
  webAppUrl?: string;
}

class GasApiService {
  /**
   * Get authorization header
   */
  private getAuthHeader(): Record<string, string> {
    const state = googleAuthService.getState();
    if (!state.accessToken) {
      throw new Error('Not authenticated. Please sign in with Google.');
    }
    return { Authorization: `Bearer ${state.accessToken}` };
  }

  /**
   * Create a new Apps Script project
   */
  async createProject(title: string): Promise<GasProject> {
    const response = await fetch(`${API_BASE}/projects`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to create project');
    }

    return response.json();
  }

  /**
   * Get project details
   */
  async getProject(scriptId: string): Promise<GasProject> {
    const response = await fetch(`${API_BASE}/projects/${scriptId}`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get project');
    }

    return response.json();
  }

  /**
   * Update project content (files)
   */
  async updateContent(scriptId: string, files: GasFile[]): Promise<void> {
    // Ensure manifest file is included
    const hasManifest = files.some((f) => f.name === 'appsscript' && f.type === 'JSON');
    if (!hasManifest) {
      files.push({
        name: 'appsscript',
        type: 'JSON',
        source: JSON.stringify({
          timeZone: 'Asia/Taipei',
          dependencies: {},
          exceptionLogging: 'STACKDRIVER',
          runtimeVersion: 'V8',
          webapp: {
            executeAs: 'USER_DEPLOYING',
            access: 'ANYONE_ANONYMOUS',
          },
        }),
      });
    }

    const response = await fetch(`${API_BASE}/projects/${scriptId}/content`, {
      method: 'PUT',
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to update content');
    }
  }

  /**
   * Create a new deployment (version)
   */
  async createDeployment(scriptId: string, description: string = 'G8N Deployment'): Promise<DeploymentInfo> {
    // First create a version
    const versionResponse = await fetch(`${API_BASE}/projects/${scriptId}/versions`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });

    if (!versionResponse.ok) {
      const error = await versionResponse.json();
      throw new Error(error.error?.message || 'Failed to create version');
    }

    const version = await versionResponse.json();

    // Then create a deployment
    const deployResponse = await fetch(`${API_BASE}/projects/${scriptId}/deployments`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        versionNumber: version.versionNumber,
        manifestFileName: 'appsscript',
        description,
      }),
    });

    if (!deployResponse.ok) {
      const error = await deployResponse.json();
      throw new Error(error.error?.message || 'Failed to create deployment');
    }

    const deployment = await deployResponse.json();

    return {
      deploymentId: deployment.deploymentId,
      version: version.versionNumber,
      webAppUrl: deployment.entryPoints?.find((e: any) => e.entryPointType === 'WEB_APP')?.webApp?.url,
    };
  }

  /**
   * List deployments for a project
   */
  async listDeployments(scriptId: string): Promise<DeploymentInfo[]> {
    const response = await fetch(`${API_BASE}/projects/${scriptId}/deployments`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to list deployments');
    }

    const data = await response.json();
    return (data.deployments || []).map((d: any) => ({
      deploymentId: d.deploymentId,
      version: d.deploymentConfig?.versionNumber,
      webAppUrl: d.entryPoints?.find((e: any) => e.entryPointType === 'WEB_APP')?.webApp?.url,
    }));
  }

  /**
   * List G8N projects (Apps Script projects starting with "G8N")
   */
  async listG8nProjects(): Promise<GasProject[]> {
    const state = googleAuthService.getState();
    if (!state.accessToken) {
      throw new Error('Not authenticated');
    }

    // Search Drive for Apps Script files starting with G8N
    const query = encodeURIComponent(`mimeType='application/vnd.google-apps.script' and name contains '${G8N_PROJECT_PREFIX.replace('_', '')}' and trashed=false`);
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`,
      { headers: { Authorization: `Bearer ${state.accessToken}` } }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to list projects');
    }

    const data = await response.json();
    // Further filter locally to ensure it starts with G8N (Drive API 'contains' is loose)
    return (data.files || [])
      .filter((f: any) => f.name.toUpperCase().startsWith(G8N_PROJECT_PREFIX))
      .map((f: any) => ({
        scriptId: f.id,
        title: f.name,
        updateTime: f.modifiedTime,
      }));
  }

  /**
   * Delete a project (move to trash via Drive API)
   */
  async deleteProject(scriptId: string): Promise<void> {
    const state = googleAuthService.getState();
    if (!state.accessToken) {
      throw new Error('Not authenticated');
    }

    // Use Drive API to trash the file
    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${scriptId}`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${state.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trashed: true }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to delete project');
    }
  }

  /**
   * Get project content (files)
   */
  async getContent(scriptId: string): Promise<GasFile[]> {
    const response = await fetch(`${API_BASE}/projects/${scriptId}/content`, {
      headers: this.getAuthHeader(),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to get content');
    }

    const data = await response.json();
    return (data.files || []).map((f: any) => ({
      name: f.name,
      type: f.type,
      source: f.source,
    }));
  }

  /**
   * Get workflow JSON from project
   */
  async getWorkflowJson(scriptId: string): Promise<object | null> {
    try {
      const files = await this.getContent(scriptId);
      console.log('[GasApi] Files in project:', files.map(f => ({ name: f.name, type: f.type })));

      const workflowFile = files.find((f) => f.name === G8N_WORKFLOW_FILE_NAME && f.type === 'SERVER_JS');
      console.log('[GasApi] Found workflow file:', workflowFile ? 'Yes' : 'No');

      if (workflowFile) {
        // Parse the JS file to extract the JSON
        const match = workflowFile.source.match(new RegExp(`var ${G8N_WORKFLOW_VAR_NAME} = (\\{[\\s\\S]*\\});`));
        console.log('[GasApi] Regex match:', match ? 'Yes' : 'No');
        if (match) {
          return JSON.parse(match[1]);
        }
      }
    } catch (e) {
      console.error('[GasApi] Failed to get workflow:', e);
    }
    return null;
  }

  /**
   * Sync workflow JSON to GAS project as a JS file (to avoid manifest validation)
   */
  async syncWorkflowJson(scriptId: string, workflow: object): Promise<void> {
    // Get existing files first
    const existingFiles = await this.getContent(scriptId);

    // Filter out old workflow files
    const otherFiles = existingFiles.filter((f) =>
      f.name !== G8N_WORKFLOW_FILE_NAME && !LEGACY_WORKFLOW_FILES.includes(f.name)
    );

    // Add the new G8nWorkflow.gs file (SERVER_JS type avoids manifest validation)
    const files: GasFile[] = [
      ...otherFiles,
      {
        name: G8N_WORKFLOW_FILE_NAME,
        type: 'SERVER_JS',
        source: `// G8N Workflow Data - Auto-generated, do not edit manually\nvar ${G8N_WORKFLOW_VAR_NAME} = ${JSON.stringify(workflow, null, 2)};\n`,
      },
    ];

    await this.updateContent(scriptId, files);
  }

  /**
   * Sync G8N GAS backend code to a project
   */
  async syncBackendCode(scriptId: string): Promise<void> {
    // Import the GAS code from our local files
    const files: GasFile[] = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: this.getCodeJs(),
      },
      {
        name: 'Router',
        type: 'SERVER_JS',
        source: this.getRouterJs(),
      },
      {
        name: 'Engine',
        type: 'SERVER_JS',
        source: this.getEngineJs(),
      },
    ];

    await this.updateContent(scriptId, files);
  }

  /**
   * Sync both backend code AND workflow JSON
   */
  async syncAll(scriptId: string, workflow: object): Promise<void> {
    const files: GasFile[] = [
      {
        name: 'Code',
        type: 'SERVER_JS',
        source: this.getCodeJs(),
      },
      {
        name: 'Router',
        type: 'SERVER_JS',
        source: this.getRouterJs(),
      },
      {
        name: 'Engine',
        type: 'SERVER_JS',
        source: this.getEngineJs(),
      },
      {
        name: G8N_WORKFLOW_FILE_NAME,
        type: 'SERVER_JS',
        source: `// G8N Workflow Data - Auto-generated, do not edit manually\nvar ${G8N_WORKFLOW_VAR_NAME} = ${JSON.stringify(workflow, null, 2)};\n`,
      },
    ];

    await this.updateContent(scriptId, files);
  }

  // Embedded GAS code for syncing
  private getCodeJs(): string {
    return CODE_JS;
  }

  private getRouterJs(): string {
    return ROUTER_JS;
  }

  private getEngineJs(): string {
    return ENGINE_JS;
  }
}

export const gasApiService = new GasApiService();
