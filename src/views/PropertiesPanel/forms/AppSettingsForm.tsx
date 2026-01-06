import { memo, useState, useEffect, useCallback } from 'react';
import type { AppSettings } from '../../../models/store/slices/settingsSlice';
import { googleAuthService, type GoogleAuthState } from '../../../services/auth';
import { gasApiService, type GasProject } from '../../../services/gas';
import { useG8nStore } from '../../../models/store';

interface AppSettingsFormProps {
    settings: AppSettings;
    onUpdate: (settings: Partial<AppSettings>) => void;
}

// LocalStorage key for workflow backup
const LOCAL_BACKUP_KEY = 'g8n_workflow_backup';

export const AppSettingsForm = memo(({ settings, onUpdate }: AppSettingsFormProps) => {
    const [authState, setAuthState] = useState<GoogleAuthState>(googleAuthService.getState());
    const [isCreating, setIsCreating] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState<string | null>(null); // Track which project is being deleted
    const [gasStatus, setGasStatus] = useState<string>('');
    const [projects, setProjects] = useState<GasProject[]>([]);
    const [newProjectName, setNewProjectName] = useState<string>('');

    const exportWorkflow = useG8nStore((state) => state.exportWorkflow);
    const setWorkflow = useG8nStore((state) => state.setWorkflow);

    // Subscribe to auth state changes
    useEffect(() => {
        const unsubscribe = googleAuthService.subscribe(setAuthState);
        return unsubscribe;
    }, []);

    // Initialize auth when client ID changes
    useEffect(() => {
        if (settings.googleOAuthClientId) {
            googleAuthService.init(settings.googleOAuthClientId);
        }
    }, [settings.googleOAuthClientId]);

    // Load project list when signed in
    useEffect(() => {
        if (authState.isSignedIn) {
            loadProjects();
        } else {
            setProjects([]);
        }
    }, [authState.isSignedIn]);

    // Auto-backup workflow to localStorage
    useEffect(() => {
        const workflow = exportWorkflow();
        if (workflow.nodes.length > 0) {
            localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(workflow));
        }
    }, [exportWorkflow]);

    const loadProjects = useCallback(async () => {
        console.log('[G8N] Loading projects...');
        try {
            const list = await gasApiService.listG8nProjects();
            console.log('[G8N] Loaded projects:', list);
            setProjects(list);
        } catch (e) {
            console.error('[G8N] Failed to load projects:', e);
            setGasStatus(`Error loading projects: ${e instanceof Error ? e.message : 'Unknown error'}`);
        }
    }, []);

    const handleSignIn = useCallback(() => {
        if (!settings.googleOAuthClientId) {
            alert('Please enter your OAuth Client ID first');
            return;
        }
        googleAuthService.signIn();
    }, [settings.googleOAuthClientId]);

    const handleSignOut = useCallback(() => {
        googleAuthService.signOut();
    }, []);

    // Generate default project name with timestamp
    // Generate default project name with timestamp (without prefix for UI)
    const getDefaultProjectName = useCallback(() => {
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD
        const timeStr = now.toTimeString().slice(0, 5).replace(':', ''); // HHMM
        return `${dateStr}_${timeStr}`;
    }, []);

    const handleCreateProject = useCallback(async () => {
        let rawName = newProjectName.trim() || getDefaultProjectName();
        // Auto-prepend G8N_ if not present
        const projectName = rawName.toUpperCase().startsWith('G8N_')
            ? rawName
            : `G8N_${rawName}`;

        console.log('[G8N] Creating project:', projectName);
        setIsCreating(true);
        setGasStatus(`Creating project: ${projectName}...`);
        try {
            const project = await gasApiService.createProject(projectName);
            console.log('[G8N] Project created:', project);
            onUpdate({ gasProjectId: project.scriptId });
            setGasStatus(`Created: ${project.title}`);
            setNewProjectName(''); // Clear input after creation
            await loadProjects(); // Refresh list
        } catch (e) {
            console.error('[G8N] Create project failed:', e);
            setGasStatus(`Error: ${e instanceof Error ? e.message : 'Failed'}`);
        } finally {
            setIsCreating(false);
        }
    }, [onUpdate, newProjectName, getDefaultProjectName, loadProjects]);

    const handleSyncAll = useCallback(async () => {
        if (!settings.gasProjectId) {
            alert('No GAS project selected');
            return;
        }
        setIsSyncing(true);
        setGasStatus('Syncing code + workflow...');
        try {
            const workflow = exportWorkflow();
            await gasApiService.syncAll(settings.gasProjectId, workflow);
            setGasStatus('✓ Code + workflow.json synced!');
        } catch (e) {
            setGasStatus(`Error: ${e instanceof Error ? e.message : 'Sync failed'}`);
        } finally {
            setIsSyncing(false);
        }
    }, [settings.gasProjectId, exportWorkflow]);

    const handleDeploy = useCallback(async () => {
        if (!settings.gasProjectId) return;
        setIsSyncing(true);
        setGasStatus('Deploying...');
        try {
            const deployment = await gasApiService.createDeployment(settings.gasProjectId);
            if (deployment.webAppUrl) {
                onUpdate({ gasWebAppUrl: deployment.webAppUrl });
                setGasStatus(`✓ Deployed!`);
            } else {
                setGasStatus('Deployed, but no Web App URL (check GAS console)');
            }
        } catch (e) {
            setGasStatus(`Error: ${e instanceof Error ? e.message : 'Deploy failed'}`);
        } finally {
            setIsSyncing(false);
        }
    }, [settings.gasProjectId, onUpdate]);

    const handleLoadWorkflow = useCallback(async (scriptId: string) => {
        setIsLoading(true);
        setGasStatus('Loading workflow...');
        try {
            const workflow = await gasApiService.getWorkflowJson(scriptId);
            if (workflow) {
                setWorkflow(workflow as any);
                onUpdate({ gasProjectId: scriptId });
                setGasStatus('✓ Workflow loaded!');
            } else {
                setGasStatus('No g8n.json found in project. Click "Sync All" to upload first.');
            }
        } catch (e) {
            setGasStatus(`Error: ${e instanceof Error ? e.message : 'Load failed'}`);
        } finally {
            setIsLoading(false);
        }
    }, [setWorkflow, onUpdate]);

    const handleLoadLocalBackup = useCallback(() => {
        const backup = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (backup) {
            try {
                setWorkflow(JSON.parse(backup));
                setGasStatus('✓ Local backup restored!');
            } catch (e) {
                setGasStatus('Failed to restore backup');
            }
        } else {
            setGasStatus('No local backup found');
        }
    }, [setWorkflow]);

    const handleDeleteProject = useCallback(async (scriptId: string, title: string) => {
        console.log('[G8N] Delete requested for:', scriptId, title);
        if (!window.confirm(`確定要刪除專案 "${title}" 嗎？\n\n此操作會將專案移至 Google Drive 垃圾桶。`)) {
            console.log('[G8N] Delete cancelled by user');
            return;
        }
        console.log('[G8N] Starting delete...');
        setIsDeleting(scriptId);
        setGasStatus('Deleting project...');
        try {
            await gasApiService.deleteProject(scriptId);
            console.log('[G8N] Delete API call successful');
            // Clear selection if deleted project was selected
            if (settings.gasProjectId === scriptId) {
                onUpdate({ gasProjectId: undefined });
            }
            // Remove from local state immediately
            setProjects((prev) => {
                const newList = prev.filter((p) => p.scriptId !== scriptId);
                console.log('[G8N] Updated projects list:', newList);
                return newList;
            });
            setGasStatus('✓ Project deleted');
        } catch (e) {
            console.error('[G8N] Delete failed:', e);
            setGasStatus(`Error: ${e instanceof Error ? e.message : 'Delete failed'}`);
        } finally {
            setIsDeleting(null);
        }
    }, [settings.gasProjectId, onUpdate]);

    return (
        <div className="panel-content">
            <div className="form-group">
                <label>Gemini API Key</label>
                <input
                    type="password"
                    value={settings.geminiApiKey || ''}
                    placeholder="AIzaSy..."
                    onChange={(e) => onUpdate({ geminiApiKey: e.target.value })}
                />
                <p className="help-text">
                    Required for Agent nodes. Key is stored locally in your browser.
                </p>
            </div>

            <div className="form-group">
                <label>Default Model</label>
                <select
                    value={settings.defaultModel}
                    onChange={(e) => onUpdate({ defaultModel: e.target.value })}
                >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                </select>
            </div>

            <div className="form-group">
                <label>Debug Mode</label>
                <div className="checkbox-wrapper">
                    <input
                        type="checkbox"
                        checked={settings.debugMode}
                        onChange={(e) => onUpdate({ debugMode: e.target.checked })}
                    />
                    <span>Enable Debug Mode</span>
                </div>
            </div>

            <div className="form-group">
                <button onClick={handleLoadLocalBackup} className="btn-secondary" style={{ width: '100%' }}>
                    📂 Restore Local Backup
                </button>
            </div>

            <hr style={{ margin: '16px 0', borderColor: 'var(--color-border)' }} />

            {/* Google OAuth Section */}
            <fieldset className="form-section">
                <legend>🔑 Google OAuth</legend>

                <div className="form-group">
                    <label>OAuth Client ID</label>
                    <input
                        type="text"
                        value={settings.googleOAuthClientId || ''}
                        placeholder="123456789.apps.googleusercontent.com"
                        onChange={(e) => onUpdate({ googleOAuthClientId: e.target.value })}
                    />
                    <p className="help-text">
                        From <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noopener">GCP Console</a>
                    </p>
                </div>

                <div className="form-group">
                    {authState.isSignedIn ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: 'var(--color-success)' }}>✓ {authState.userEmail}</span>
                            <button onClick={handleSignOut} className="btn-secondary">Sign Out</button>
                        </div>
                    ) : (
                        <button onClick={handleSignIn} className="btn-primary" disabled={!settings.googleOAuthClientId}>
                            🔐 Sign in with Google
                        </button>
                    )}
                </div>
            </fieldset>

            {/* GAS Project Section */}
            {authState.isSignedIn && (
                <fieldset className="form-section">
                    <legend>📜 Apps Script Projects</legend>

                    {/* Project List */}
                    {projects.length > 0 && (
                        <div className="form-group">
                            <label>Apps Script Projects (double-click to load)</label>
                            <div style={{
                                maxHeight: '150px',
                                overflowY: 'auto',
                                border: '1px solid var(--color-border)',
                                borderRadius: '4px',
                                marginBottom: '8px',
                            }}>
                                {projects.map((p) => (
                                    <div
                                        key={p.scriptId}
                                        onDoubleClick={() => handleLoadWorkflow(p.scriptId)}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            borderBottom: '1px solid var(--color-border)',
                                            background: settings.gasProjectId === p.scriptId
                                                ? 'var(--color-accent)'
                                                : 'transparent',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                        onClick={() => onUpdate({ gasProjectId: p.scriptId })}
                                    >
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                                            <div style={{ fontSize: '10px', opacity: 0.7 }}>
                                                {p.updateTime ? new Date(p.updateTime).toLocaleDateString() : p.scriptId.slice(0, 20)}
                                            </div>
                                        </div>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                e.preventDefault();
                                                console.log('[G8N] Delete button clicked for:', p.scriptId);
                                                handleDeleteProject(p.scriptId, p.title);
                                            }}
                                            disabled={isDeleting === p.scriptId}
                                            className="btn-danger"
                                            style={{
                                                padding: '4px 8px',
                                                fontSize: '12px',
                                                marginLeft: '8px',
                                                flexShrink: 0,
                                                opacity: isDeleting === p.scriptId ? 0.5 : 1,
                                            }}
                                            title="Delete project"
                                        >
                                            {isDeleting === p.scriptId ? '...' : '🗑️'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="form-group">
                        <label>New Project Name</label>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input
                                type="text"
                                value={newProjectName}
                                onChange={(e) => setNewProjectName(e.target.value)}
                                placeholder={`e.g. MyAgent_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`}
                                style={{ flex: 1 }}
                            />
                            <button onClick={handleCreateProject} disabled={isCreating} className="btn-secondary">
                                {isCreating ? '...' : '+ Create'}
                            </button>
                            <button onClick={loadProjects} className="btn-secondary">
                                🔄
                            </button>
                        </div>
                        <p className="help-text">Leave blank to auto-generate with timestamp</p>
                    </div>

                    {settings.gasProjectId && (
                        <div className="form-group">
                            <label>Selected: {settings.gasProjectId.slice(0, 15)}...</label>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={handleSyncAll} disabled={isSyncing || isLoading} className="btn-primary" style={{ flex: 1 }}>
                                    {isSyncing ? 'Syncing...' : '⬆️ Sync All'}
                                </button>
                                <button onClick={handleDeploy} disabled={isSyncing || isLoading} className="btn-secondary">
                                    🚀 Deploy
                                </button>
                            </div>
                        </div>
                    )}

                    {gasStatus && (
                        <p className="help-text" style={{ marginTop: '8px' }}>{gasStatus}</p>
                    )}

                    {settings.gasWebAppUrl && (
                        <div className="form-group">
                            <label>Web App URL</label>
                            <input
                                type="text"
                                value={settings.gasWebAppUrl}
                                readOnly
                                style={{ background: 'var(--color-bg-tertiary)' }}
                            />
                        </div>
                    )}
                </fieldset>
            )}
        </div>
    );
});


