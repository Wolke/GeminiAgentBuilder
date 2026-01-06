/**
 * G8N Application Constants
 */

// Project Naming & Structure
export const G8N_PROJECT_PREFIX = 'G8N_';
export const G8N_WORKFLOW_FILE_NAME = 'G8nWorkflow';
export const G8N_WORKFLOW_VAR_NAME = 'G8N_WORKFLOW';

// Legacy Support (for migration)
export const LEGACY_WORKFLOW_FILES = ['g8n', 'workflow'];

// Google OAuth Scopes
export const GOOGLE_SCOPES = [
    'openid',
    'email',
    'https://www.googleapis.com/auth/script.projects',
    'https://www.googleapis.com/auth/script.deployments',
    'https://www.googleapis.com/auth/drive', // Required for listing and deleting projects
];

// Local Storage Keys
export const STORAGE_KEYS = {
    GOOGLE_AUTH: 'g8n_google_auth',
    WORKFLOW_BACKUP: 'g8n_workflow_backup',
};
