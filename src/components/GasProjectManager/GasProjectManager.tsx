// GAS Project Manager - UI for managing G8N projects in Google Apps Script

import { useState, useEffect, useCallback } from 'react';
import { useWorkflowStore } from '../../stores';
import { gasDeployService } from '../../services/gasDeployService';
import { GcpAuthService } from '../../services/gcpAuthService';
import type { GasProject } from '../../types/gas';
import './GasProjectManager.css';

// Required OAuth scopes
const GAS_SCOPES = [
    'https://www.googleapis.com/auth/script.projects',
    'https://www.googleapis.com/auth/drive',  // Full drive access for delete
];

export function GasProjectManager() {
    const {
        settings,
        gasAuth,
        setGasAuth,
        gasLogout,
        exportWorkflow,
        loadWorkflowFromGas,
        workflowName,
    } = useWorkflowStore();

    const [projects, setProjects] = useState<GasProject[]>([]);
    const [selectedProject, setSelectedProject] = useState<GasProject | null>(null);
    const [newProjectName, setNewProjectName] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Check token expiration
    const isTokenValid = gasAuth.isLoggedIn &&
        gasAuth.expiresAt &&
        Date.now() < gasAuth.expiresAt;

    // Load projects when logged in
    const loadProjects = useCallback(async () => {
        if (!gasAuth.accessToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const g8nProjects = await gasDeployService.listG8nProjects(gasAuth.accessToken);
            setProjects(g8nProjects);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load projects');
        } finally {
            setIsLoading(false);
        }
    }, [gasAuth.accessToken]);

    useEffect(() => {
        if (isTokenValid) {
            loadProjects();
        }
    }, [isTokenValid, loadProjects]);

    // Handle login
    const handleLogin = async () => {
        if (!settings.gcpClientId) {
            setError('Please set GCP Client ID in Settings first');
            return;
        }

        setIsLoggingIn(true);
        setError(null);

        try {
            const token = await GcpAuthService.requestAccess(GAS_SCOPES, settings.gcpClientId);
            setGasAuth({
                isLoggedIn: true,
                accessToken: token,
                expiresAt: Date.now() + 3600 * 1000, // 1 hour
            });
            setSuccessMessage('Login successful!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Login failed');
        } finally {
            setIsLoggingIn(false);
        }
    };

    // Handle logout
    const handleLogout = () => {
        gasLogout();
        setProjects([]);
        setSelectedProject(null);
    };

    // Load workflow from selected project
    const handleLoadWorkflow = async () => {
        if (!selectedProject || !gasAuth.accessToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const workflow = await gasDeployService.getWorkflowFromProject(
                selectedProject.scriptId,
                gasAuth.accessToken
            );

            if (workflow) {
                loadWorkflowFromGas(workflow);
                setSuccessMessage(`Loaded: ${workflow.name}`);
                setTimeout(() => setSuccessMessage(null), 3000);
            } else {
                setError('No workflow data found in this project');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load workflow');
        } finally {
            setIsLoading(false);
        }
    };

    // Save to selected project
    const handleSaveToProject = async () => {
        if (!selectedProject || !gasAuth.accessToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const workflow = exportWorkflow();
            await gasDeployService.saveWorkflowToProject(
                selectedProject.scriptId,
                workflow,
                gasAuth.accessToken
            );
            setSuccessMessage('Saved successfully!');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save');
        } finally {
            setIsLoading(false);
        }
    };

    // Create new project
    const handleCreateProject = async () => {
        if (!newProjectName.trim() || !gasAuth.accessToken) return;

        setIsLoading(true);
        setError(null);

        try {
            const workflow = exportWorkflow();
            const project = await gasDeployService.createG8nProject(
                newProjectName.trim(),
                workflow,
                gasAuth.accessToken
            );

            setProjects([project, ...projects]);
            setSelectedProject(project);
            setNewProjectName('');
            setSuccessMessage(`Created: ${project.title}`);
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create project');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete project
    const handleDeleteProject = async () => {
        if (!selectedProject || !gasAuth.accessToken) return;

        const confirmed = window.confirm(
            `確定要刪除專案 "${selectedProject.title}" 嗎？\n此操作無法復原！`
        );
        if (!confirmed) return;

        setIsLoading(true);
        setError(null);

        try {
            await gasDeployService.deleteProject(
                selectedProject.scriptId,
                gasAuth.accessToken
            );

            setProjects(projects.filter(p => p.scriptId !== selectedProject.scriptId));
            setSelectedProject(null);
            setSuccessMessage('Project deleted');
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete project');
        } finally {
            setIsLoading(false);
        }
    };

    // Not logged in view
    if (!isTokenValid) {
        return (
            <div className="gas-project-manager">
                <h3>☁️ GAS Project Manager</h3>

                {!settings.gcpClientId && (
                    <div className="gas-warning">
                        ⚠️ Please set <strong>GCP Client ID</strong> in Settings first
                    </div>
                )}

                <button
                    className="gas-login-btn"
                    onClick={handleLogin}
                    disabled={isLoggingIn || !settings.gcpClientId}
                >
                    {isLoggingIn ? '⏳ Logging in...' : '🔓 Login with Google'}
                </button>

                {error && <div className="gas-error">{error}</div>}
            </div>
        );
    }

    // Logged in view
    return (
        <div className="gas-project-manager">
            <div className="gas-header">
                <h3>☁️ GAS Project Manager</h3>
                <button className="gas-logout-btn" onClick={handleLogout}>
                    Logout
                </button>
            </div>

            {error && <div className="gas-error">{error}</div>}
            {successMessage && <div className="gas-success">{successMessage}</div>}

            {/* Project List */}
            <div className="gas-section">
                <div className="gas-section-header">
                    <span>📁 Your G8N Projects</span>
                    <button
                        className="gas-refresh-btn"
                        onClick={loadProjects}
                        disabled={isLoading}
                    >
                        🔄
                    </button>
                </div>

                {isLoading && projects.length === 0 ? (
                    <div className="gas-loading">Loading projects...</div>
                ) : projects.length === 0 ? (
                    <div className="gas-empty">No G8N projects found</div>
                ) : (
                    <div className="gas-project-list">
                        {projects.map(project => (
                            <div
                                key={project.scriptId}
                                className={`gas-project-item ${selectedProject?.scriptId === project.scriptId ? 'selected' : ''}`}
                                onClick={() => setSelectedProject(project)}
                            >
                                <span className="project-name">{project.title}</span>
                                {project.updateTime && (
                                    <span className="project-date">
                                        {new Date(project.updateTime).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {selectedProject && (
                    <div className="gas-project-actions">
                        <button
                            className="gas-btn load"
                            onClick={handleLoadWorkflow}
                            disabled={isLoading}
                        >
                            📥 Load
                        </button>
                        <button
                            className="gas-btn save"
                            onClick={handleSaveToProject}
                            disabled={isLoading}
                        >
                            💾 Save
                        </button>
                        <button
                            className="gas-btn delete"
                            onClick={handleDeleteProject}
                            disabled={isLoading}
                            title="Delete project"
                        >
                            🗑️
                        </button>
                    </div>
                )}
            </div>

            {/* Create New Project */}
            <div className="gas-section">
                <div className="gas-section-header">
                    <span>✨ Create New Project</span>
                </div>

                <div className="gas-current-workflow">
                    Current: <strong>{workflowName || 'Untitled'}</strong>
                </div>

                <div className="gas-create-form">
                    <input
                        type="text"
                        placeholder="Project name (G8N- prefix auto-added)"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                    />
                    <button
                        className="gas-btn create"
                        onClick={handleCreateProject}
                        disabled={isLoading || !newProjectName.trim()}
                    >
                        {isLoading ? '⏳' : '➕'} Create
                    </button>
                </div>
            </div>
        </div>
    );
}
